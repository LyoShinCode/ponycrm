package com.ponycrm.dto

import kotlinx.serialization.Serializable

@Serializable
data class RequirementDto(
    val id: String,
    val projectId: String,
    val title: String,
    val description: String?,
    val priority: String,
    val status: String,
    val authorId: String,
    val authorFio: String,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class RequirementUpsertRequest(
    val title: String,
    val description: String? = null,
    val priority: String,
    val status: String,
    val authorId: String
)