package com.ponycrm.models

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import java.util.UUID

object UsersTable : Table("users") {
    val id = uuid("id").default(UUID.randomUUID())
    val firstName = varchar("first_name", 100)
    val lastName = varchar("last_name", 100)
    val middleName = varchar("middle_name", 100).nullable()
    val email = varchar("email", 255).nullable()

    override val primaryKey = PrimaryKey(id)
}

object UserRolesTable : Table("user_roles") {
    val userId = reference("user_id", UsersTable.id, onDelete = ReferenceOption.CASCADE)
    val role = varchar("role", 100)

    override val primaryKey = PrimaryKey(userId, role)
}