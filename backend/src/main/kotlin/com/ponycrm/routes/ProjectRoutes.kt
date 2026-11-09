package com.ponycrm.routes

import com.ponycrm.db.DatabaseFactory
import com.ponycrm.dto.ProjectDto
import com.ponycrm.dto.ProjectUpsertRequest
import com.ponycrm.enums.ProjectStatus
import com.ponycrm.models.ProjectsTable
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.route
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.update
import java.util.UUID

fun Route.projectRoutes() {
    route("/api/v1/projects") {
        get {
            val projects = DatabaseFactory.dbQuery {
                ProjectsTable.selectAll().map { row ->
                    ProjectDto(
                        id = row[ProjectsTable.id].toString(),
                        name = row[ProjectsTable.name],
                        description = row[ProjectsTable.description],
                        status = row[ProjectsTable.status].name
                    )
                }
            }
            call.respond(HttpStatusCode.OK, projects)
        }

        post {
            val request = call.receive<ProjectUpsertRequest>()
            if (request.name.isBlank()) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "name is required"))
                return@post
            }
            val status = runCatching { ProjectStatus.valueOf(request.status) }.getOrNull()
            if (status == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid status"))
                return@post
            }

            val newId = UUID.randomUUID()
            DatabaseFactory.dbQuery {
                ProjectsTable.insert {
                    it[id] = newId
                    it[name] = request.name
                    it[description] = request.description
                    it[this.status] = status
                }
            }
            call.respond(
                HttpStatusCode.Created,
                ProjectDto(newId.toString(), request.name, request.description, status.name)
            )
        }

        put("/{projectId}") {
            val projectId = runCatching { UUID.fromString(call.parameters["projectId"]) }.getOrNull()
            if (projectId == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid projectId"))
                return@put
            }
            val request = call.receive<ProjectUpsertRequest>()
            if (request.name.isBlank()) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "name is required"))
                return@put
            }
            val status = runCatching { ProjectStatus.valueOf(request.status) }.getOrNull()
            if (status == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid status"))
                return@put
            }

            val rowsUpdated = DatabaseFactory.dbQuery<Int> {
                ProjectsTable.update({ ProjectsTable.id eq projectId }) {
                    it[name] = request.name
                    it[description] = request.description
                    it[this.status] = status
                }
            }

            if (rowsUpdated == 0) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "project not found"))
                return@put
            }

            call.respond(
                HttpStatusCode.OK,
                ProjectDto(projectId.toString(), request.name, request.description, status.name)
            )
        }
    }
}