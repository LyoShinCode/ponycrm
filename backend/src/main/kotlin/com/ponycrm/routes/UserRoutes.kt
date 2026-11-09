package com.ponycrm.routes

import com.ponycrm.db.DatabaseFactory
import com.ponycrm.dto.UserCreateRequest
import com.ponycrm.dto.UserDto
import com.ponycrm.models.UserRolesTable
import com.ponycrm.models.UsersTable
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.selectAll
import java.util.UUID

fun Route.userRoutes() {
    route("/api/v1/users") {
        get {
            val users = DatabaseFactory.dbQuery {
                UsersTable.selectAll().map { row ->
                    val userId = row[UsersTable.id]
                    val roles = UserRolesTable.select { UserRolesTable.userId eq userId }
                        .map { it[UserRolesTable.role] }
                    UserDto(
                        id = userId.toString(),
                        lastName = row[UsersTable.lastName],
                        firstName = row[UsersTable.firstName],
                        middleName = row[UsersTable.middleName],
                        email = row[UsersTable.email],
                        roles = roles
                    )
                }
            }
            call.respond(HttpStatusCode.OK, users)
        }

        post {
            val request = call.receive<UserCreateRequest>()

            // Валидация по контракту: roles minItems = 1
            if (request.roles.isEmpty()) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "roles must contain at least one item"))
                return@post
            }

            val newId = UUID.randomUUID()
            DatabaseFactory.dbQuery {
                UsersTable.insert {
                    it[id] = newId
                    it[firstName] = request.firstName
                    it[lastName] = request.lastName
                    it[middleName] = request.middleName
                    it[email] = request.email
                }
                request.roles.forEach { roleName ->
                    UserRolesTable.insert {
                        it[userId] = newId
                        it[role] = roleName
                    }
                }
            }
            call.respond(
                HttpStatusCode.Created,
                UserDto(newId.toString(), request.lastName, request.firstName, request.middleName, request.email, request.roles)
            )
        }
    }
}