package com.ponycrm.dto

import kotlinx.serialization.Serializable

@Serializable
data class ParticipantDto(
    val userId: String,
    val fio: String,
    val projectRole: String,
    val isLead: Boolean
)

@Serializable
data class AddParticipantRequest(
    val userId: String,
    val projectRole: String,
    val isLead: Boolean = false
)