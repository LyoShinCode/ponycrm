package com.ponycrm.routes

import com.ponycrm.db.DatabaseFactory
import com.ponycrm.dto.RequirementDto
import com.ponycrm.dto.RequirementUpsertRequest
import com.ponycrm.enums.RequirementPriority
import com.ponycrm.enums.RequirementStatus
import com.ponycrm.models.ProjectsTable
import com.ponycrm.models.RequirementsTable
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
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.update
import java.time.Instant
import java.util.UUID

fun Route.requirementRoutes() {
    route("/api/v1/projects/{projectId}/requirements") {

        get {
            val projectId = runCatching { UUID.fromString(call.parameters["projectId"]) }.getOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid projectId"))

            val projectExists = DatabaseFactory.dbQuery {
                ProjectsTable.select { ProjectsTable.id eq projectId }.count() > 0
            }
            if (!projectExists) {
                return@get call.respond(HttpStatusCode.NotFound, mapOf("error" to "project not found"))
            }

            val statusFilter = call.request.queryParameters["status"]
            val priorityFilter = call.request.queryParameters["priority"]

            val requirements = DatabaseFactory.dbQuery {
                RequirementsTable.innerJoin(UsersTable)
                    .select { RequirementsTable.projectId eq projectId }
                    .map { row ->
                        RequirementDto(
                            id = row[RequirementsTable.id].toString(),
                            projectId = row[RequirementsTable.projectId].toString(),
                            title = row[RequirementsTable.title],
                            description = row[RequirementsTable.description],
                            priority = row[RequirementsTable.priority].name,
                            status = row[RequirementsTable.status].name,
                            authorId = row[UsersTable.id].toString(),
                            authorFio = listOfNotNull(row[UsersTable.lastName], row[UsersTable.firstName]).joinToString(" "),
                            createdAt = row[RequirementsTable.createdAt].toString(),
                            updatedAt = row[RequirementsTable.updatedAt].toString()
                        )
                    }
                    .filter { dto ->
                        val statusOk = statusFilter == null || dto.status == statusFilter
                        val priorityOk = priorityFilter == null || dto.priority == priorityFilter
                        statusOk && priorityOk
                    }
            }
            call.respond(HttpStatusCode.OK, requirements)
        }

        post {
            val projectId = runCatching { UUID.fromString(call.parameters["projectId"]) }.getOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid projectId"))
            val request = call.receive<RequirementUpsertRequest>()

            val priority = runCatching { RequirementPriority.valueOf(request.priority) }.getOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid priority"))
            val status = runCatching { RequirementStatus.valueOf(request.status) }.getOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid status"))
            val authorId = runCatching { UUID.fromString(request.authorId) }.getOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid authorId"))

            if (request.title.isBlank()) {
                return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "title is required"))
            }

            val valid = DatabaseFactory.dbQuery {
                val pExists = ProjectsTable.select { ProjectsTable.id eq projectId }.count() > 0
                val aExists = UsersTable.select { UsersTable.id eq authorId }.count() > 0
                pExists && aExists
            }
            if (!valid) {
                return@post call.respond(HttpStatusCode.NotFound, mapOf("error" to "project or author not found"))
            }

            val newId = UUID.randomUUID()
            val now = Instant.now()
            DatabaseFactory.dbQuery {
                RequirementsTable.insert {
                    it[id] = newId
                    it[this.projectId] = projectId
                    it[title] = request.title
                    it[description] = request.description
                    it[this.priority] = priority
                    it[this.status] = status
                    it[this.authorId] = authorId
                    it[createdAt] = now
                    it[updatedAt] = now
                }
            }

            val dto = DatabaseFactory.dbQuery {
                RequirementsTable.innerJoin(UsersTable)
                    .select { RequirementsTable.id eq newId }
                    .map { row ->
                        RequirementDto(
                            id = row[RequirementsTable.id].toString(),
                            projectId = row[RequirementsTable.projectId].toString(),
                            title = row[RequirementsTable.title],
                            description = row[RequirementsTable.description],
                            priority = row[RequirementsTable.priority].name,
                            status = row[RequirementsTable.status].name,
                            authorId = row[UsersTable.id].toString(),
                            authorFio = listOfNotNull(row[UsersTable.lastName], row[UsersTable.firstName]).joinToString(" "),
                            createdAt = row[RequirementsTable.createdAt].toString(),
                            updatedAt = row[RequirementsTable.updatedAt].toString()
                        )
                    }.first()
            }
            call.respond(HttpStatusCode.Created, dto)
        }

        put("/{requirementId}") {
            val projectId = runCatching { UUID.fromString(call.parameters["projectId"]) }.getOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid projectId"))
            val requirementId = runCatching { UUID.fromString(call.parameters["requirementId"]) }.getOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid requirementId"))
            val request = call.receive<RequirementUpsertRequest>()

            val priority = runCatching { RequirementPriority.valueOf(request.priority) }.getOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid priority"))
            val status = runCatching { RequirementStatus.valueOf(request.status) }.getOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid status"))
            val authorId = runCatching { UUID.fromString(request.authorId) }.getOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid authorId"))

            if (request.title.isBlank()) {
                return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "title is required"))
            }

            val updatedCount = DatabaseFactory.dbQuery<Int> {
                RequirementsTable.update({
                    (RequirementsTable.id eq requirementId) and (RequirementsTable.projectId eq projectId)
                }) {
                    it[title] = request.title
                    it[description] = request.description
                    it[this.priority] = priority
                    it[this.status] = status
                    it[this.authorId] = authorId
                    it[updatedAt] = Instant.now()
                }
            }

            if (updatedCount == 0) {
                return@put call.respond(HttpStatusCode.NotFound, mapOf("error" to "requirement not found"))
            }

            val dto = DatabaseFactory.dbQuery {
                RequirementsTable.innerJoin(UsersTable)
                    .select { RequirementsTable.id eq requirementId }
                    .map { row ->
                        RequirementDto(
                            id = row[RequirementsTable.id].toString(),
                            projectId = row[RequirementsTable.projectId].toString(),
                            title = row[RequirementsTable.title],
                            description = row[RequirementsTable.description],
                            priority = row[RequirementsTable.priority].name,
                            status = row[RequirementsTable.status].name,
                            authorId = row[UsersTable.id].toString(),
                            authorFio = listOfNotNull(row[UsersTable.lastName], row[UsersTable.firstName]).joinToString(" "),
                            createdAt = row[RequirementsTable.createdAt].toString(),
                            updatedAt = row[RequirementsTable.updatedAt].toString()
                        )
                    }.first()
            }
            call.respond(HttpStatusCode.OK, dto)
        }

        delete("/{requirementId}") {
            val projectId = runCatching { UUID.fromString(call.parameters["projectId"]) }.getOrNull()
                ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid projectId"))
            val requirementId = runCatching { UUID.fromString(call.parameters["requirementId"]) }.getOrNull()
                ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid requirementId"))

            val deletedCount = DatabaseFactory.dbQuery<Int> {
                RequirementsTable.deleteWhere {
                    (RequirementsTable.id eq requirementId) and (RequirementsTable.projectId eq projectId)
                }
            }

            if (deletedCount == 0) {
                return@delete call.respond(HttpStatusCode.NotFound, mapOf("error" to "requirement not found"))
            }
            call.respond(HttpStatusCode.NoContent)
        }
    }
}