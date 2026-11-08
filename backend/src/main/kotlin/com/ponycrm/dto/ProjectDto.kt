package com.ponycrm.dto

import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class ProjectDto(
    val id: String,
    val name: String,
    val description: String?,
    val status: String
)