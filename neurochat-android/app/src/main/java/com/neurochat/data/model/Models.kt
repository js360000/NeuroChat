package com.neurochat.data.model

data class User(
    val id: String,
    val name: String,
    val avatar: String? = null,
    val isOnline: Boolean = false
)

data class Message(
    val id: String,
    val content: String,
    val toneTag: String? = null,
    val sender: User,
    val createdAt: String,
    val isMe: Boolean,
    val aiAnalysis: AIExplanation? = null
)

data class Conversation(
    val id: String,
    val user: User,
    val lastMessage: Message? = null,
    val unreadCount: Int = 0,
    val updatedAt: String
)

data class AIExplanation(
    val tone: String,
    val confidence: Float,
    val hiddenMeanings: List<String>,
    val suggestions: List<String>,
    val socialCues: List<String>
)

data class AISummary(
    val summary: String,
    val highlights: List<String>
)

data class AIRephrase(
    val gentle: String,
    val direct: String
)
