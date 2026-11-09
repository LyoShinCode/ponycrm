package com.ponycrm

import com.ponycrm.db.DatabaseFactory
import com.ponycrm.routes.projectRoutes
import com.ponycrm.routes.userRoutes
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.http.content.staticResources
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json

fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

fun Application.module() {
    DatabaseFactory.init()

    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
    }

    install(CORS) {
        anyHost()
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)
    }

    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respondText(text = "500: ${cause.message}", status = HttpStatusCode.InternalServerError)
        }
    }

    routing {
        get("/") {
            call.respondText("🐴 PonyCRM is alive!")
        }

        get("/health") {
            call.respond(mapOf("status" to "ok", "service" to "ponycrm-backend"))
        }

        get("/swagger") {
            val swaggerHtml = javaClass.getResource("/swagger.html")?.readText() ?: "Swagger not found"
            call.respondText(text = swaggerHtml, contentType = ContentType.Text.Html)
        }

        staticResources("/openapi", "openapi")

        projectRoutes()

        userRoutes()
    }
}