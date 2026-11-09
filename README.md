# 🐴 PonyCRM

CRM-система для управления проектами и участниками с ролями. Pet-проект системного аналитика с полным стеком технологий.

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Kotlin](https://img.shields.io/badge/Kotlin-1.9-purple?logo=kotlin)
![Ktor](https://img.shields.io/badge/Ktor-2.3-orange?logo=kotlin)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Docker](https://img.shields.io/badge/Docker-24-blue?logo=docker)

## 🎯 О проекте

PonyCRM — это полнофункциональная CRM-система для управления проектами и их участниками. Проект демонстрирует подход **contract-first**: сначала пишется OpenAPI-спецификация, затем реализуется бэкенд и фронтенд.

### Ключевые особенности

- ✅ **Управление проектами**: создание, редактирование, архивирование
- ✅ **Управление участниками**: CRUD с несколькими ролями (M:N)
- ✅ **Команда проекта**: добавление участников с ролями на проекте
- ✅ **Бизнес-инварианты**: один руководитель на проект, каскадное удаление
- ✅ **Фиксированный справочник ролей**: защита от опечаток на трёх уровнях (фронт, OpenAPI, бэкенд)
- ✅ **Тёмная тема**: переключатель с сохранением в localStorage

## 🏗 Архитектура
┌──────────────┐ ┌──────────────┐ ┌─────────────┐
│ React │─────▶│   Ktor API │────▶│ PostgreSQL  │
│ Frontend     │ │ (Kotlin) │   │      (Docker) │
└──────────────┘ └──────────────┘ └─────────────┘
 :5173            :8080            :5432


### Стек технологий

**Backend:**
- Kotlin 1.9 + Ktor 2.3 (Netty)
- Exposed ORM (DSL)
- PostgreSQL 16 + HikariCP
- Kotlinx Serialization
- Docker Compose

**Frontend:**
- React 18 + TypeScript 5
- Vite
- Tailwind CSS 3

**Документация:**
- OpenAPI 3.0 (Swagger UI)
- Postman-коллекция
- ER-диаграмма

## 🚀 Быстрый старт

### Требования

- JDK 17+
- Node.js 18+
- Docker Desktop

### Запуск

```bash
# 1. Клонируем репозиторий
git clone https://github.com/yourusername/ponycrm.git
cd ponycrm

# 2. Запускаем PostgreSQL
cd db
docker-compose up -d
cd ..

# 3. Запускаем бэкенд
cd backend
./gradlew run
# Откроется на http://localhost:8080

# 4. В другом терминале — фронтенд
cd frontend
npm install
npm run dev
# Откроется на http://localhost:5173
```