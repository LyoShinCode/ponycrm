import { useEffect, useState } from 'react'
import type { Project } from '../types'
import ProjectEditModal from '../components/ProjectEditModal'

const STATUS_STYLES: Record<string, string> = {
    planning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    archived: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

const STATUS_LABELS: Record<string, string> = {
    planning: 'Планирование',
    active: 'Активный',
    archived: 'В архиве',
}

interface Props {
    onSelect: (project: Project) => void
}

function ProjectsPage({ onSelect }: Props) {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [showArchived, setShowArchived] = useState(false)
    const [editModal, setEditModal] = useState<Project | null>(null)

    const load = () => {
        fetch('http://localhost:8080/api/v1/projects')
        .then(res => res.json())
        .then(data => { setProjects(data); setLoading(false) })
        .catch(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const createProject = async () => {
        const res = await fetch('http://localhost:8080/api/v1/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Новый проект', description: null, status: 'planning' }),
        })
        if (res.ok) load()
    }

    const archiveProject = async (project: Project) => {
        const newStatus = project.status === 'archived' ? 'active' : 'archived'
        const res = await fetch(`http://localhost:8080/api/v1/projects/${project.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: project.name, description: project.description, status: newStatus }),
        })
        if (res.ok) load()
    }

    const visible = showArchived ? projects : projects.filter(p => p.status !== 'archived')
    const archivedCount = projects.filter(p => p.status === 'archived').length

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Проекты</h1>
                <button
                    onClick={createProject}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm"
                >
                    + Создать проект
                </button>
            </div>

            {archivedCount > 0 && (
                <div className="flex items-center gap-2 mb-4">
                    <input
                        id="showArchived"
                        type="checkbox"
                        checked={showArchived}
                        onChange={e => setShowArchived(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="showArchived" className="text-sm text-slate-600 dark:text-slate-400">
                        Показать архивные ({archivedCount})
                    </label>
                </div>
            )}

            {loading ? (
                <p className="text-slate-500 dark:text-slate-400">Загрузка...</p>
            ) : visible.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
                    Проектов пока нет
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map(p => (
                        <div
                            key={p.id}
                            onClick={() => onSelect(p)}
                            className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition cursor-pointer ${
                                p.status === 'archived' ? 'opacity-70' : ''
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold">{p.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {p.description || 'Без описания'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditModal(p) }}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                        title="Редактировать"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); archiveProject(p) }}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                        title={p.status === 'archived' ? 'Разархивировать' : 'В архив'}
                                    >
                                        {p.status === 'archived' ? '♻️' : '🗂'}
                                    </button>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[p.status] ?? STATUS_STYLES.archived}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                                </div>
                            </div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3">Открыть проект →</p>
                        </div>
                    ))}
                </div>
            )}

            {editModal && (
                <ProjectEditModal project={editModal} onClose={() => setEditModal(null)} onUpdated={load} />
            )}
        </div>
    )
}

export default ProjectsPage