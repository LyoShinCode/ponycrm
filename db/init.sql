-- ============================================
-- Pony CRM - Database Schema
-- PostgreSQL 14+
-- ============================================

-- 1. ENUM типы для статусов
CREATE TYPE project_status AS ENUM ('active', 'archived', 'planning');
CREATE TYPE requirement_status AS ENUM ('draft', 'approved', 'in_development', 'done');
CREATE TYPE requirement_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE artifact_type AS ENUM ('confluence', 'figma', 'jira', 'swagger', 'other');

-- 2. Таблица участников (users) — только персональные данные
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       first_name VARCHAR(100) NOT NULL,
                       last_name VARCHAR(100) NOT NULL,
                       middle_name VARCHAR(100),
                       email VARCHAR(255) UNIQUE,
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.1. Должности человека (M:N): у одного ФИО может быть НЕСКОЛЬКО ролей
CREATE TABLE user_roles (
                            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            role VARCHAR(100) NOT NULL,
                            PRIMARY KEY (user_id, role)
);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- 3. Таблица проектов (projects)
CREATE TABLE projects (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          name VARCHAR(255) NOT NULL,
                          description TEXT,
                          start_date DATE,
                          end_date DATE,
                          status project_status DEFAULT 'planning',
                          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Связь M:N между проектами и участниками
CREATE TABLE project_participants (
                                      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                                      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                                      project_role VARCHAR(100) NOT NULL,
                                      is_lead BOOLEAN DEFAULT FALSE,
                                      joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                      PRIMARY KEY (project_id, user_id, project_role)
);

-- 5. Реестр требований (requirements)
CREATE TABLE requirements (
                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                              title VARCHAR(500) NOT NULL,
                              description TEXT,
                              status requirement_status DEFAULT 'draft',
                              priority requirement_priority DEFAULT 'medium',
                              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Артефакты (ссылки на внешние системы)
CREATE TABLE artifacts (
                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                           type artifact_type NOT NULL,
                           name VARCHAR(255) NOT NULL,
                           url TEXT NOT NULL,
                           created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Индексы для ускорения запросов
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_requirements_project_id ON requirements(project_id);
CREATE INDEX idx_requirements_status ON requirements(status);
CREATE INDEX idx_artifacts_project_id ON artifacts(project_id);
CREATE INDEX idx_users_email ON users(email);

-- 8. Комментарии
COMMENT ON TABLE users IS 'Участники системы (аналитики, разработчики, дизайнеры)';
COMMENT ON TABLE projects IS 'Проекты, над которыми работают аналитики';
COMMENT ON TABLE project_participants IS 'Связь проектов и участников с ролями';
COMMENT ON TABLE requirements IS 'Реестр требований по проектам';
COMMENT ON TABLE artifacts IS 'Ссылки на внешние артефакты (Confluence, Figma, Jira)';