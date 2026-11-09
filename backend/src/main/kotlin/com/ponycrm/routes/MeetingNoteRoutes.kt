package com.ponycrm.routes

import com.ponycrm.db.DatabaseFactory
import com.ponycrm.dto.MeetingNoteDto
import com.ponycrm.dto.MeetingNoteUpsertRequest
import com.ponycrm.models.MeetingNotesTable
import com.ponycrm.models.ProjectsTable
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
import java.time.LocalDate
import java.util.UUID

fun Route.meetingNoteRoutes() {
    route("/api/v1/projects/{projectId}/meetings") {

        get {
            val projectId = runCatching { UUID.fromString(call.parameters["projectId"]) }.getOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid projectId"))

            val projectExists = DatabaseFactory.dbQuery {
                ProjectsTable.select { ProjectsTable.id eq projectId }.count() > 0
            }
            if (!projectExists) return@get call.respond(HttpStatusCode.NotFound, mapOf("error" to "project not found"))

            val notes = DatabaseFactory.dbQuery {
                MeetingNotesTable.innerJoin(UsersTable)
                    .select { MeetingNotesTable.projectId eq projectId }
                    .orderBy(MeetingNotesTable.meetingDate, org.jetbrains.exposed.sql.SortOrder.DESC)
                    .map { row ->
                        MeetingNoteDto(
                            id = row[MeetingNotesTable.id].toString(),
                            projectId = row[MeetingNotesTable.projectId].toString(),
                            title = row[MeetingNotesTable.title],
                            content = row[MeetingNotesTable.content],
                            meetingDate = row[MeetingNotesTable.meetingDate].toString(),
                            authorId = row[UsersTable.id].toString(),
                            authorFio = listOfNotNull(row[UsersTable.lastName], row[UsersTable.firstName]).joinToString(" "),
                            createdAt = row[MeetingNotesTable.createdAt].toString(),
                            updatedAt = row[MeetingNotesTable.updatedAt].toString()
                        )
                    }
            }
            call.respond(HttpStatusCode.OK, notes)
        }

        post {
            val projectId = runCatching { UUID.fromString(call.parameters["projectId"]) }.getOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid projectId"))
            val request = call.receive<MeetingNoteUpsertRequest>()

            if (request.title.isBlank()) return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "title is required"))
            if (request.content.isBlank()) return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "content is required"))

            val meetingDate = runCatching { LocalDate.parse(request.meetingDate) }.getOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid meetingDate format, expected YYYY-MM-DD"))
            val authorId = runCatching { UUID.fromString(request.authorId) }.getOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid authorId"))

            val valid = DatabaseFactory.dbQuery {
                val pExists = ProjectsTable.select { ProjectsTable.id eq projectId }.count() > 0
                val aExists = UsersTable.select { UsersTable.id eq authorId }.count() > 0
                pExists && aExists
            }
            if (!valid) return@post call.respond(HttpStatusCode.NotFound, mapOf("error" to "project or author not found"))

            val newId = UUID.randomUUID()
            val now = Instant.now()
            DatabaseFactory.dbQuery {
                MeetingNotesTable.insert {
                    it[id] = newId
                    it[this.projectId] = projectId
                    it[title] = request.title
                    it[content] = request.content
                    it[this.meetingDate] = meetingDate
                    it[this.authorId] = authorId
                    it[createdAt] = now
                    it[updatedAt] = now
                }
            }

            val dto = DatabaseFactory.dbQuery {
                MeetingNotesTable.innerJoin(UsersTable)
                    .select { MeetingNotesTable.id eq newId }
                    .map { row ->
                        MeetingNoteDto(
                            id = row[MeetingNotesTable.id].toString(),
                            projectId = row[MeetingNotesTable.projectId].toString(),
                            title = row[MeetingNotesTable.title],
                            content = row[MeetingNotesTable.content],
                            meetingDate = row[MeetingNotesTable.meetingDate].toString(),
                            authorId = row[UsersTable.id].toString(),
                            authorFio = listOfNotNull(row[UsersTable.lastName], row[UsersTable.firstName]).joinToString(" "),
                            createdAt = row[MeetingNotesTable.createdAt].toString(),
                            updatedAt = row[MeetingNotesTable.updatedAt].toString()
                        )
                    }.first()
            }
            call.respond(HttpStatusCode.Created, dto)
        }

        put("/{meetingId}") {
            val projectId = runCatching { UUID.fromString(call.parameters["projectId"]) }.getOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid projectId"))
            val meetingId = runCatching { UUID.fromString(call.parameters["meetingId"]) }.getOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid meetingId"))
            val request = call.receive<MeetingNoteUpsertRequest>()

            if (request.title.isBlank()) return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "title is required"))
            if (request.content.isBlank()) return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "content is required"))

            val meetingDate = runCatching { LocalDate.parse(request.meetingDate) }.getOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid meetingDate format"))
            val authorId = runCatching { UUID.fromString(request.authorId) }.getOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid authorId"))

            val updatedCount = DatabaseFactory.dbQuery<Int> {
                MeetingNotesTable.update({
                    (MeetingNotesTable.id eq meetingId) and (MeetingNotesTable.projectId eq projectId)
                }) {
                    it[title] = request.title
                    it[content] = request.content
                    it[this.meetingDate] = meetingDate
                    it[this.authorId] = authorId
                    it[updatedAt] = Instant.now()
                }
            }

            if (updatedCount == 0) return@put call.respond(HttpStatusCode.NotFound, mapOf("error" to "meeting note not found"))

            val dto = DatabaseFactory.dbQuery {
                MeetingNotesTable.innerJoin(UsersTable)
                    .select { MeetingNotesTable.id eq meetingId }
                    .map { row ->
                        MeetingNoteDto(
                            id = row[MeetingNotesTable.id].toString(),
                            projectId = row[MeetingNotesTable.projectId].toString(),
                            title = row[MeetingNotesTable.title],
                            content = row[MeetingNotesTable.content],
                            meetingDate = row[MeetingNotesTable.meetingDate].toString(),
                            authorId = row[UsersTable.id].toString(),
                            authorFio = listOfNotNull(row[UsersTable.lastName], row[UsersTable.firstName]).joinToString(" "),
                            createdAt = row[MeetingNotesTable.createdAt].toString(),
                            updatedAt = row[MeetingNotesTable.updatedAt].toString()
                        )
                    }.first()
            }
            call.respond(HttpStatusCode.OK, dto)
        }

        delete("/{meetingId}") {
            val projectId = runCatching { UUID.fromString(call.parameters["projectId"]) }.getOrNull()
                ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid projectId"))
            val meetingId = runCatching { UUID.fromString(call.parameters["meetingId"]) }.getOrNull()
                ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid meetingId"))

            val deletedCount = DatabaseFactory.dbQuery<Int> {
                MeetingNotesTable.deleteWhere {
                    (MeetingNotesTable.id eq meetingId) and (MeetingNotesTable.projectId eq projectId)
                }
            }

            if (deletedCount == 0) return@delete call.respond(HttpStatusCode.NotFound, mapOf("error" to "meeting note not found"))
            call.respond(HttpStatusCode.NoContent)
        }
    }
}