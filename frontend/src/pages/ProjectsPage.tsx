import { useEffect, useState } from 'react'
import type { Project } from '../types'

const STATUS_STYLES: Record<string, string> = {
    planning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    archived: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)

    const load = () => {
        fetch('http://localhost:8080/api/v1/projects')
        .then(res => res.json())
        .then(data => { setProjects(data); setLoading(false) })
        .catch(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const createProject = async () => {
        const res = await fetch('http://localhost:8080/api/v1/projects', { method: 'POST' })
        if (res.ok) load()
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Проекты</h1>
                <button
                    onClick={createProject}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm"
                >
                    + Создать проект
                </button>
            </div>

            {loading ? (
                <p className="text-slate-500 dark:text-slate-400">Загрузка...</p>
            ) : projects.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
                    Проектов пока нет
                </div>
            ) : (
                <div className="space-y-3">
                    {projects.map(p => (
                        <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold">{p.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{p.description}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[p.status] ?? STATUS_STYLES.archived}`}>
                {p.status}
              </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ProjectsPage