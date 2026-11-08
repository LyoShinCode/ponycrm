package com.ponycrm.models

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.date

object ProjectsTable : Table("projects") {
    val id = varchar("id", 36) // UUID храним как строку
    val name = varchar("name", 255)
    val description = text("description").nullable()
    val startDate = date("start_date").nullable()
    val endDate = date("end_date").nullable()
    val status = varchar("status", 20) // В MVP храним как строку

    override val primaryKey = PrimaryKey(id)
}