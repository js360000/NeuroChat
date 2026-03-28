package com.neurochat.data.remote

import com.neurochat.data.model.*
import retrofit2.http.*

interface ApiService {
    // Messages
    @GET("messages/conversations")
    suspend fun getConversations(): ConversationsResponse

    @GET("messages/conversations/{conversationId}")
    suspend fun getMessages(
        @Path("conversationId") conversationId: String,
        @Query("limit") limit: Int = 50
    ): MessagesResponse

    @POST("messages")
    suspend fun sendMessage(
        @Body request: SendMessageRequest
    ): SendMessageResponse

    // AI
    @POST("ai/explain")
    suspend fun explainMessage(
        @Body request: ExplainRequest
    ): ExplainResponse

    @POST("ai/summary")
    suspend fun summarizeConversation(
        @Body request: SummaryRequest
    ): SummaryResponse

    @POST("ai/rephrase")
    suspend fun rephraseMessage(
        @Body request: RephraseRequest
    ): RephraseResponse
}

// Response classes
data class ConversationsResponse(val conversations: List<Conversation>)
data class MessagesResponse(val messages: List<Message>)
data class SendMessageResponse(val message: Message)
data class ExplainResponse(val explanation: AIExplanation)
data class SummaryResponse(val summary: AISummary)
data class RephraseResponse(val rephrase: AIRephrase)

// Request classes
data class SendMessageRequest(
    val conversationId: String,
    val content: String,
    val toneTag: String? = null
)

data class ExplainRequest(
    val message: String,
    val toneTag: String? = null,
    val context: String? = null
)

data class SummaryRequest(
    val messages: List<MessageContent>
)

data class RephraseRequest(
    val message: String
)

data class MessageContent(
    val sender: String,
    val content: String
)
