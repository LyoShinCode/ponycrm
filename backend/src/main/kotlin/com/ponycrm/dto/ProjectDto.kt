package com.ponycrm.dto

import kotlinx.serialization.Serializable

@Serializable
data class ProjectDto(
    val id: String,
    val name: String,
    val description: String?,
    val status: String
)