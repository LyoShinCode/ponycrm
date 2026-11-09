package com.ponycrm.enums

object RoleCatalog {
    val USER_ROLES: Set<String> = setOf(
        "Системный аналитик",
        "Бизнес-аналитик",
        "Архитектор",
        "Дизайнер",
        "Бэкенд-разработчик",
        "Фронтенд-разработчик",
        "QA-инженер",
        "Тимлид",
        "Юрист",
    )

    val PROJECT_ROLES: Set<String> = setOf(
        "Руководитель проекта",
        "Системный аналитик",
        "Бизнес-аналитик",
        "Архитектор",
        "Бэкенд-разработчик",
        "Фронтенд-разработчик",
        "QA-инженер",
        "DevOps",
        "Дизайнер",
        "Технический писатель",
    )

    fun isValidUserRole(role: String): Boolean = role in USER_ROLES
    fun isValidProjectRole(role: String): Boolean = role in PROJECT_ROLES

    fun findInvalidUserRoles(roles: List<String>): List<String> =
        roles.filterNot(::isValidUserRole)

    fun findInvalidProjectRole(role: String): Boolean = !isValidProjectRole(role)
}