package com.ponycrm.routes

import com.ponycrm.db.DatabaseFactory
import com.ponycrm.dto.AddParticipantRequest
import com.ponycrm.dto.ParticipantDto
import com.ponycrm.models.ProjectParticipantsTable
import com.ponycrm.models.ProjectsTable
import com.ponycrm.models.UsersTable
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
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
            val userId = runCatching { UUID.fromString(request.userId) }.getOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid userId"))

            DatabaseFactory.dbQuery {
                val projectExists = ProjectsTable.select { ProjectsTable.id eq projectId }.count() > 0
                val userExists = UsersTable.select { UsersTable.id eq userId }.count() > 0
                if (!projectExists || !userExists) {
                    null
                } else {
                    val duplicate = ProjectParticipantsTable.select {
                        (ProjectParticipantsTable.projectId eq projectId) and
                                (ProjectParticipantsTable.userId eq userId) and
                                (ProjectParticipantsTable.projectRole eq request.projectRole)
                    }.count() > 0
                    if (duplicate) "duplicate" else "ok"
                }
            }.let { check ->
                when (check) {
                    null -> call.respond(HttpStatusCode.NotFound, mapOf("error" to "project or user not found"))
                    "duplicate" -> call.respond(HttpStatusCode.Conflict, mapOf("error" to "participant already assigned with this role"))
                    else -> {
                        DatabaseFactory.dbQuery {
                            ProjectParticipantsTable.insert {
                                it[this.projectId] = projectId
                                it[this.userId] = userId
                                it[projectRole] = request.projectRole
                                it[isLead] = request.isLead
                            }
                        }
                        call.respond(HttpStatusCode.Created, mapOf("message" to "participant added"))
                    }
                }
            }
        }
    }
}