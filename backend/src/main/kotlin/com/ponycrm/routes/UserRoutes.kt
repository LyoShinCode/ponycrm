package com.ponycrm.routes

import com.ponycrm.db.DatabaseFactory
import com.ponycrm.dto.UserCreateRequest
import com.ponycrm.dto.UserDto
import com.ponycrm.dto.ValidationErrorDto
import com.ponycrm.enums.RoleCatalog
import com.ponycrm.models.UserRolesTable
import com.ponycrm.models.UsersTable
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.route
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.update
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

            if (request.roles.isEmpty()) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "roles must contain at least one item"))
                return@post
            }

            val invalid = RoleCatalog.findInvalidUserRoles(request.roles)
            if (invalid.isNotEmpty()) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ValidationErrorDto(
                        error = "invalid user roles",
                        invalidRoles = invalid,
                        allowedRoles = RoleCatalog.USER_ROLES.toList()
                    )
                )
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

        put("/{userId}") {
            val userId = runCatching { UUID.fromString(call.parameters["userId"]) }.getOrNull()
            if (userId == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid userId"))
                return@put
            }
            val request = call.receive<UserCreateRequest>()
            if (request.roles.isEmpty()) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "roles must contain at least one item"))
                return@put
            }

            val invalid = RoleCatalog.findInvalidUserRoles(request.roles)
            if (invalid.isNotEmpty()) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ValidationErrorDto(
                        error = "invalid user roles",
                        invalidRoles = invalid,
                        allowedRoles = RoleCatalog.USER_ROLES.toList()
                    )
                )
                return@put
            }

            val updatedCount = DatabaseFactory.dbQuery<Int> {
                val rows = UsersTable.update({ UsersTable.id eq userId }) {
                    it[firstName] = request.firstName
                    it[lastName] = request.lastName
                    it[middleName] = request.middleName
                    it[email] = request.email
                }
                if (rows == 0) return@dbQuery 0

                // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: импорт SqlExpressionBuilder.eq решает проблему
                UserRolesTable.deleteWhere { UserRolesTable.userId eq userId }
                request.roles.forEach { roleName ->
                    UserRolesTable.insert {
                        it[this.userId] = userId
                        it[role] = roleName
                    }
                }
                1
            }

            if (updatedCount == 0) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "user not found"))
                return@put
            }

            call.respond(
                HttpStatusCode.OK,
                UserDto(userId.toString(), request.lastName, request.firstName, request.middleName, request.email, request.roles)
            )
        }

        delete("/{userId}") {
            val userId = runCatching { UUID.fromString(call.parameters["userId"]) }.getOrNull()
            if (userId == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid userId"))
                return@delete
            }

            val deletedCount = DatabaseFactory.dbQuery<Int> {
                UsersTable.deleteWhere { UsersTable.id eq userId }
            }

            if (deletedCount == 0) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "user not found"))
                return@delete
            }

            call.respond(HttpStatusCode.NoContent)
        }
    }
}