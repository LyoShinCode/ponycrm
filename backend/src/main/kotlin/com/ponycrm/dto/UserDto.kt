package com.ponycrm.dto

import kotlinx.serialization.Serializable

@Serializable
data class UserDto(
    val id: String,
    val lastName: String,
    val firstName: String,
    val middleName: String?,
    val email: String?,
    val roles: List<String>
)

@Serializable
data class UserCreateRequest(
    val lastName: String,
    val firstName: String,
    val middleName: String? = null,
    val email: String? = null,
    val roles: List<String>
)