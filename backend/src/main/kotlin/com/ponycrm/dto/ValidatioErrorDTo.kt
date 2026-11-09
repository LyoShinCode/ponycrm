package com.ponycrm.dto

import kotlinx.serialization.Serializable

@Serializable
data class ValidationErrorDto(
    val error: String,
    val invalidRoles: List<String> = emptyList(),
    val allowedRoles: List<String> = emptyList()
)

@Serializable
data class ValidationErrorSingleDto(
    val error: String,
    val invalidRole: String = "",
    val allowedRoles: List<String> = emptyList()
)