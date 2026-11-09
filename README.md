# 🐴 PonyCRM

CRM-система системного аналитика: управление проектами, участниками, требованиями и конспектами встреч со стейкхолдерами.
Построена по принципу **contract-first** — OpenAPI-спецификация является источником истины, бэкенд и фронтенд реализуются под неё.

![Kotlin](https://img.shields.io/badge/Kotlin-1.9-purple?logo=kotlin)
![Ktor](https://img.shields.io/badge/Ktor-2.3-orange?logo=kotlin)
![Exposed](https://img.shields.io/badge/Exposed-0.45-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?logo=postgresql)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan?logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)

## 🎯 О проекте

PonyCRM закрывает полный рабочий цикл системного аналитика на проекте:

- **Проекты** — создание, редактирование, архивирование (статусы `planning / active / archived`).
- **Участники** — CRUD с несколькими должностями (M:N), фиксированный справочник ролей.
- **Команда проекта** — назначение людей на проект с ролью и флагом руководителя; вывод из команды одним кликом.
- **Требования** — реестр с приоритетом и статусом из ENUM-справочников, фильтры, автор из команды.
- **Конспекты встреч** — Markdown-заметки, привязанные к проекту и автору.

Проект демонстрирует не просто «работающий код», а **аналитическое мышление**: контракты API, целостность данных на уровне БД, бизнес-инварианты и трёхуровневая защита справочников.

## 🏗 Архитектура


## 🏗 Архитектура
┌──────────────┐ ┌──────────────┐ ┌─────────────┐
│ React │─────▶│   Ktor API │────▶│ PostgreSQL  │
│ Frontend     │ │ (Kotlin) │   │      (Docker) │
└──────────────┘ └──────────────┘ └─────────────┘
 :5173            :8080            :5432


Слой данных — **Exposed (DSL)** поверх JDBC-драйвера PostgreSQL. Кастомные ENUM-типы БД (`project_status`, `requirement_priority`, `requirement_status`) подключены через `customEnumeration` + `PGobject`, поскольку встроенные enum-типы Exposed не отправляют параметр с меткой PG-типа.

## 🗄 Схема базы данных

users ──1:N──▶ user_roles (M:N: человек ↔ должности)
projects ──M:N──▶ users (через project_participants, с ролью и is_lead)
projects ──1:N──▶ requirements (автор → users, RESTRICT)
projects ──1:N──▶ meeting_notes (автор → users, RESTRICT)



| Таблица | Назначение | Ключевые ограничения |
|---|---|---|
| `users` | Участники системы | `email` UNIQUE |
| `user_roles` | Должности человека | PK `(user_id, role)`, FK `CASCADE` |
| `projects` | Проекты | `status` ENUM `project_status` |
| `project_participants` | Команда проекта | PK `(project_id, user_id, project_role)`, FK `CASCADE` |
| `requirements` | Требования | `priority`/`status` ENUM, FK автор `RESTRICT` |
| `meeting_notes` | Конспекты встреч | FK автор `RESTRICT`, индекс по дате DESC |

ER-диаграмма: [`docs/er-diagram.png`](docs/er-diagram.png) · исходник DBML: [`docs/er-diagram.dbml`](docs/er-diagram.dbml)

## 🔒 Бизнес-правила (source of truth)

1. **Один руководитель на проект.** При назначении нового `is_lead = true` предыдущий лидер автоматически понижается — инвариант держится на уровне сервиса в одной транзакции.
2. **Фиксированный справочник ролей.** Нельзя завести человека или назначить на проект роль вне каталога. Защита трёхуровневая: UI даёт только preset-чипы → OpenAPI описывает роль как `enum` → бэкенд (`RoleCatalog`) отклоняет обход с кодом `400` и подсказкой `allowedRoles`.
3. **Каскадный vs рестриктивный FK.** Удаление проекта/участника каскадно сносит роли и связки (`CASCADE`). Удаление автора требования или конспекта **запрещено** (`RESTRICT`) — история анализа не теряется.
4. **Вывод из команды.** `DELETE /projects/{id}/participants/{userId}` удаляет все проектные роли человека, но не трогает его запись в `users` — он остаётся в системе и может быть возвращён.
5. **Требование = приоритет + статус + автор.** Все три поля валидируются по ENUM; статус и приоритет фильтруются на сервере через query-параметры.
6. **Конспект = Markdown + дата + автор.** Хранится как текст, рендерится с сохранением переносов; сортировка «новые сверху» на уровне индекса БД.

## 🚀 Быстрый старт

Требования: JDK 17+, Node.js 18+, Docker Desktop.

```bash
# 1. PostgreSQL
cd db && docker-compose up -d && cd ..

# 2. Бэкенд (http://localhost:8080, Swagger: /swagger)
cd backend && ./gradlew run &

# 3. Фронтенд (http://localhost:5173)
cd frontend && npm install && npm run dev

```
📞 Контакты
Telegram: @therandomname
Email: iamthealeksei@gmail.com