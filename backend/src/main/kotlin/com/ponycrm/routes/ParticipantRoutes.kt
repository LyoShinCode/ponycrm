package com.ponycrm.routes

import com.ponycrm.db.DatabaseFactory
import com.ponycrm.dto.AddParticipantRequest
import com.ponycrm.dto.ParticipantDto
import com.ponycrm.dto.ValidationErrorSingleDto
import com.ponycrm.enums.RoleCatalog
import com.ponycrm.models.ProjectParticipantsTable
import com.ponycrm.models.ProjectsTable
import com.ponycrm.models.UsersTable
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.update
import java.util.UUID

fun Route.participantRoutes() {
    route("/api/v1/projects/{projectId}/participants") {

        get {
            val projectId = runCatching { UUID.fromString(call.parameters["projectId"]) }.getOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid projectId"))

            val projectExists = DatabaseFactory.dbQuery {
                ProjectsTable.select { ProjectsTable.id eq projectId }.count() > 0
            }
            if (!projectExists) return@get call.respond(HttpStatusCode.NotFound, mapOf("error" to "project not found"))

            val participants = DatabaseFactory.dbQuery {
                ProjectParticipantsTable
                    .innerJoin(UsersTable)
                    .select { ProjectParticipantsTable.projectId eq projectId }
                    .map { row ->
                        ParticipantDto(
                            userId = row[UsersTable.id].toString(),
                            fio = listOfNotNull(
                                row[UsersTable.lastName],
                                row[UsersTable.firstName],
                                row[UsersTable.middleName]
                            ).joinToString(" "),
                            projectRole = row[ProjectParticipantsTable.projectRole],
                            isLead = row[ProjectParticipantsTable.isLead]
                        )
                    }
            }
            call.respond(HttpStatusCode.OK, participants)
        }

        post {
            val projectId = runCatching { UUID.fromString(call.parameters["projectId"]) }.getOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid projectId"))

            val request = call.receive<AddParticipantRequest>()

            if (RoleCatalog.findInvalidProjectRole(request.projectRole)) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ValidationErrorSingleDto(
                        error = "invalid project role",
                        invalidRole = request.projectRole,
                        allowedRoles = RoleCatalog.PROJECT_ROLES.toList()
                    )
                )
                return@post
            }

            val userId = runCatching { UUID.fromString(request.userId) }.getOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid userId"))

            val result = DatabaseFactory.dbQuery {
                val projectExists = ProjectsTable.select { ProjectsTable.id eq projectId }.count() > 0
                val userExists = UsersTable.select { UsersTable.id eq userId }.count() > 0
                if (!projectExists || !userExists) return@dbQuery "not_found"

                val duplicate = ProjectParticipantsTable.select {
                    (ProjectParticipantsTable.projectId eq projectId) and
                            (ProjectParticipantsTable.userId eq userId) and
                            (ProjectParticipantsTable.projectRole eq request.projectRole)
                }.count() > 0
                if (duplicate) return@dbQuery "duplicate"

                if (request.isLead) {
                    ProjectParticipantsTable.update({
                        (ProjectParticipantsTable.projectId eq projectId) and
                                (ProjectParticipantsTable.isLead eq true)
                    }) {
                        it[isLead] = false
                    }
                }

                ProjectParticipantsTable.insert {
                    it[this.projectId] = projectId
                    it[this.userId] = userId
                    it[projectRole] = request.projectRole
                    it[isLead] = request.isLead
                }
                "ok"
            }

            when (result) {
                "not_found" -> call.respond(HttpStatusCode.NotFound, mapOf("error" to "project or user not found"))
                "duplicate" -> call.respond(HttpStatusCode.Conflict, mapOf("error" to "participant already assigned with this role"))
                else -> call.respond(HttpStatusCode.Created, mapOf("message" to "participant added"))
            }
        }
    }
}