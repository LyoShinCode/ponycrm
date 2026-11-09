import { useEffect, useState } from 'react'

interface Project {
    id: string
    name: string
    description: string | null
    status: string
}

function App() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)

    // Загрузка проектов с бэкенда
    useEffect(() => {
        fetch('http://localhost:8080/api/v1/projects')
        .then(res => res.json())
        .then(data => {
            setProjects(data)
            setLoading(false)
        })
        .catch(err => {
            console.error("Ошибка загрузки:", err)
            setLoading(false)
        })
    }, [])

    // Создание тестового проекта
    const createProject = () => {
        fetch('http://localhost:8080/api/v1/projects', { method: 'POST' })
        .then(() => window.location.reload()) // Перезагружаем для простоты
    }

    return (
        <div className="min-h-screen bg-pony-bg p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-pony-text">🐴 PonyCRM</h1>
                    <button
                        onClick={createProject}
                        className="px-4 py-2 bg-pony-accent text-white rounded-lg hover:bg-pony-accentHover transition shadow-sm"
                    >
                        + Создать проект
                    </button>
                </header>

                <div className="bg-pony-card p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-semibold text-pony-text mb-4">Мои проекты</h2>

                    {loading ? (
                        <p className="text-pony-muted">Загрузка...</p>
                    ) : projects.length === 0 ? (
                        <p className="text-pony-muted">Проектов пока нет. Нажми кнопку выше, чтобы создать тестовый.</p>
                    ) : (
                        <ul className="space-y-3">
                            {projects.map((project) => (
                                <li key={project.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-medium text-pony-text">{project.name}</h3>
                                        <p className="text-sm text-pony-muted">{project.description}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                    {project.status}
                  </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}

export default App