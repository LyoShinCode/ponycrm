package com.ponycrm.routes

import com.ponycrm.db.DatabaseFactory
import com.ponycrm.dto.ProjectDto
import com.ponycrm.models.ProjectsTable
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import java.util.UUID

fun Route.projectRoutes() {
    route("/api/v1/projects") {
        get {
            val projects = DatabaseFactory.dbQuery {
                ProjectsTable.selectAll().map { row ->
                    ProjectDto(
                        id = row[ProjectsTable.id],
                        name = row[ProjectsTable.name],
                        description = row[ProjectsTable.description],
                        status = row[ProjectsTable.status]
                    )
                }
            }
            call.respond(HttpStatusCode.OK, projects)
        }

        post {
            val newId = UUID.randomUUID().toString()
            DatabaseFactory.dbQuery {
                ProjectsTable.insert {
                    it[id] = newId
                    it[name] = "Новый проект PonyCRM"
                    it[description] = "Описание проекта..."
                    it[status] = "planning"
                }
            }
            call.respond(HttpStatusCode.Created, mapOf("id" to newId, "message" to "Project created"))
        }
    }
}