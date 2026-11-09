package com.ponycrm.models

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.date
import org.jetbrains.exposed.sql.javatime.timestamp
import java.time.Instant

object MeetingNotesTable : Table("meeting_notes") {
    val id = uuid("id").default(java.util.UUID.randomUUID())
    val projectId = reference("project_id", ProjectsTable.id, onDelete = ReferenceOption.CASCADE)
    val title = varchar("title", 500)
    val content = text("content")
    val meetingDate = date("meeting_date")
    val authorId = reference("author_id", UsersTable.id, onDelete = ReferenceOption.RESTRICT)
    val createdAt = timestamp("created_at").default(Instant.now())
    val updatedAt = timestamp("updated_at").default(Instant.now())

    override val primaryKey = PrimaryKey(id)
}