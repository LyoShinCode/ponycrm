package com.ponycrm.models

import com.ponycrm.enums.RequirementPriority
import com.ponycrm.enums.RequirementStatus
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp
import org.postgresql.util.PGobject
import java.time.Instant
import java.util.UUID

object RequirementsTable : Table("requirements") {
    val id = uuid("id").default(UUID.randomUUID())
    val projectId = reference("project_id", ProjectsTable.id, onDelete = ReferenceOption.CASCADE)
    val title = varchar("title", 500)
    val description = text("description").nullable()

    // customEnumeration — member-функция Table, импорт НЕ нужен
    val priority = customEnumeration(
        name = "priority",
        sql = "requirement_priority",
        fromDb = { RequirementPriority.valueOf(it as String) },
        toDb = { PGobject().apply { type = "requirement_priority"; value = it.name } }
    )

    val status = customEnumeration(
        name = "status",
        sql = "requirement_status",
        fromDb = { RequirementStatus.valueOf(it as String) },
        toDb = { PGobject().apply { type = "requirement_status"; value = it.name } }
    )

    val authorId = reference("author_id", UsersTable.id, onDelete = ReferenceOption.RESTRICT)
    val createdAt = timestamp("created_at").default(Instant.now())
    val updatedAt = timestamp("updated_at").default(Instant.now())

    override val primaryKey = PrimaryKey(id)
}