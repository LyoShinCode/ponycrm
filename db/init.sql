-- ============================================
-- Pony CRM - Database Schema
-- PostgreSQL 14+
-- ============================================

-- 1. ENUM типы
CREATE TYPE project_status AS ENUM ('active', 'archived', 'planning');
CREATE TYPE requirement_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE requirement_status AS ENUM ('draft', 'approved', 'in_dev', 'done', 'rejected');

-- 2. Таблица участников
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       first_name VARCHAR(100) NOT NULL,
                       last_name VARCHAR(100) NOT NULL,
                       middle_name VARCHAR(100),
                       email VARCHAR(255) UNIQUE,
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.1. Роли участников (M:N)
CREATE TABLE user_roles (
                            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            role VARCHAR(100) NOT NULL,
                            PRIMARY KEY (user_id, role)
);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- 3. Таблица проектов
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

-- 4. Связь M:N: проект ↔ участник
CREATE TABLE project_participants (
                                      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                                      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                                      project_role VARCHAR(100) NOT NULL,
                                      is_lead BOOLEAN DEFAULT FALSE,
                                      joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                      PRIMARY KEY (project_id, user_id, project_role)
);

-- 5. Требования
CREATE TABLE requirements (
                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                              title VARCHAR(500) NOT NULL,
                              description TEXT,
                              priority requirement_priority NOT NULL DEFAULT 'medium',
                              status requirement_status NOT NULL DEFAULT 'draft',
                              author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_requirements_project ON requirements(project_id);
CREATE INDEX idx_requirements_status ON requirements(status);

-- 6. Конспекты встреч
CREATE TABLE meeting_notes (
                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                               title VARCHAR(500) NOT NULL,
                               content TEXT NOT NULL,
                               meeting_date DATE NOT NULL,
                               author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                               created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                               updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_meeting_notes_project ON meeting_notes(project_id);
CREATE INDEX idx_meeting_notes_date ON meeting_notes(meeting_date DESC);

-- 7. Комментарии
COMMENT ON TABLE users IS 'Участники системы';
COMMENT ON TABLE projects IS 'Проекты';
COMMENT ON TABLE project_participants IS 'Связь проектов и участников с ролями';
COMMENT ON TABLE requirements IS 'Реестр требований по проектам';
COMMENT ON TABLE meeting_notes IS 'Конспекты встреч со стейкхолдерами';