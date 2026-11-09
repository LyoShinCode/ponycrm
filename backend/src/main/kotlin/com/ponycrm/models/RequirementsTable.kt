package com.ponycrm.models

import com.ponycrm.enums.RequirementPriority
import com.ponycrm.enums.RequirementStatus
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp
import java.time.Instant

object RequirementsTable : Table("requirements") {
    val id = uuid("id").default(java.util.UUID.randomUUID())
    val projectId = reference("project_id", ProjectsTable.id, onDelete = ReferenceOption.CASCADE)
    val title = varchar("title", 500)
    val description = text("description").nullable()
    val priority = enumerationByName("priority", 20, RequirementPriority::class)
    val status = enumerationByName("status", 20, RequirementStatus::class)
    val authorId = reference("author_id", UsersTable.id, onDelete = ReferenceOption.RESTRICT)
    val createdAt = timestamp("created_at").default(Instant.now())
    val updatedAt = timestamp("updated_at").default(Instant.now())

    override val primaryKey = PrimaryKey(id)
}