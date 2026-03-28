package com.neurochat.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.neurochat.data.model.AIExplanation
import com.neurochat.data.model.Conversation
import com.neurochat.data.model.Message
import com.neurochat.data.remote.ApiService
import com.neurochat.data.remote.ExplainRequest
import com.neurochat.data.remote.SendMessageRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {

    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages

    private val _conversation = MutableStateFlow<Conversation?>(null)
    val conversation: StateFlow<Conversation?> = _conversation

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    fun loadMessages(conversationId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = apiService.getMessages(conversationId)
                _messages.value = response.messages
            } catch (e: Exception) {
                // Handle error
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun sendMessage(conversationId: String, content: String) {
        viewModelScope.launch {
            try {
                val response = apiService.sendMessage(
                    SendMessageRequest(
                        conversationId = conversationId,
                        content = content
                    )
                )
                _messages.value = _messages.value + response.message
            } catch (e: Exception) {
                // Handle error
            }
        }
    }

    fun explainMessage(messageId: String, messageContent: String) {
        viewModelScope.launch {
            try {
                // Get context from previous messages
                val context = _messages.value
                    .filter { it.createdAt <= _messages.value.find { m -> m.id == messageId }?.createdAt }
                    .takeLast(5)
                    .joinToString("\n") { "${it.sender.name}: ${it.content}" }

                val response = apiService.explainMessage(
                    ExplainRequest(
                        message = messageContent,
                        context = context
                    )
                )

                // Update the message with the explanation
                _messages.value = _messages.value.map { message ->
                    if (message.id == messageId) {
                        message.copy(aiAnalysis = response.explanation)
                    } else {
                        message
                    }
                }
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
}
