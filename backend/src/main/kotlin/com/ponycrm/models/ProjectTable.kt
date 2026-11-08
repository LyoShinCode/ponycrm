package com.ponycrm.models

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.date
import java.util.UUID

object ProjectsTable : Table("projects") {
    val id = uuid("id").default(UUID.randomUUID())
    val name = varchar("name", 255)
    val description = text("description").nullable()
    val startDate = date("start_date").nullable()
    val endDate = date("end_date").nullable()
    val status = varchar("status", 20)

    override val primaryKey = PrimaryKey(id)
}