package com.ponycrm.dto

import kotlinx.serialization.Serializable

@Serializable
data class MeetingNoteDto(
    val id: String,
    val projectId: String,
    val title: String,
    val content: String,
    val meetingDate: String,
    val authorId: String,
    val authorFio: String,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class MeetingNoteUpsertRequest(
    val title: String,
    val content: String,
    val meetingDate: String,
    val authorId: String
)