package com.ponycrm.models

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp
import java.time.Instant

object ProjectParticipantsTable : Table("project_participants") {
    val projectId = reference("project_id", ProjectsTable.id, onDelete = ReferenceOption.CASCADE)
    val userId = reference("user_id", UsersTable.id, onDelete = ReferenceOption.CASCADE)
    val projectRole = varchar("project_role", 100)
    val isLead = bool("is_lead").default(false)
    val joinedAt = timestamp("joined_at").default(Instant.now())

    override val primaryKey = PrimaryKey(projectId, userId, projectRole)
}