package com.ponycrm.models

import com.ponycrm.enums.ProjectStatus
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.date
import org.postgresql.util.PGobject
import java.util.UUID

object ProjectsTable : Table("projects") {
    val id = uuid("id").default(UUID.randomUUID())
    val name = varchar("name", 255)
    val description = text("description").nullable()
    val startDate = date("start_date").nullable()
    val endDate = date("end_date").nullable()

    val status = customEnumeration(
        name = "status",
        sql = "project_status",
        fromDb = { ProjectStatus.valueOf(it as String) },
        toDb = { PGobject().apply { type = "project_status"; value = it.name } }
    )

    override val primaryKey = PrimaryKey(id)
}