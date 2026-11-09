import { useEffect, useState } from 'react'
import type { Participant, Project } from '../types'
import ProjectMemberModal from '../components/ProjectMemberModal'
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

function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [participants, setParticipants] = useState<Record<string, Participant[]>>({})
    const [loadingParticipants, setLoadingParticipants] = useState<Record<string, boolean>>({})
    const [addMemberModal, setAddMemberModal] = useState<{ projectId: string; isOpen: boolean }>({
        projectId: '',
        isOpen: false,
    })
    const [editModal, setEditModal] = useState<{ project: Project | null }>({ project: null })
    const [showArchived, setShowArchived] = useState(false)

    const loadParticipants = async (projectId: string) => {
        setLoadingParticipants(prev => ({ ...prev, [projectId]: true }))
        try {
            const res = await fetch(`http://localhost:8080/api/v1/projects/${projectId}/participants`)
            if (res.ok) {
                const data = await res.json()
                setParticipants(prev => ({ ...prev, [projectId]: data }))
            }
        } finally {
            setLoadingParticipants(prev => ({ ...prev, [projectId]: false }))
        }
    }

    const load = () => {
        fetch('http://localhost:8080/api/v1/projects')
        .then(res => res.json())
        .then(data => {
            setProjects(data)
            setLoading(false)
        })
        .catch(() => setLoading(false))
    }

    useEffect(() => {
        load()
    }, [])

    useEffect(() => {
        projects.forEach(p => loadParticipants(p.id))
    }, [projects])

    const createProject = async () => {
        const res = await fetch('http://localhost:8080/api/v1/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Новый проект',
                description: null,
                status: 'planning',
            }),
        })
        if (res.ok) load()
    }

    const archiveProject = async (project: Project) => {
        const newStatus = project.status === 'archived' ? 'active' : 'archived'
        const res = await fetch(`http://localhost:8080/api/v1/projects/${project.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: project.name,
                description: project.description,
                status: newStatus,
            }),
        })
        if (res.ok) load()
    }

    const handleMemberAdded = (projectId: string) => {
        loadParticipants(projectId)
        setAddMemberModal({ projectId: '', isOpen: false })
    }

    const visibleProjects = showArchived
        ? projects
        : projects.filter(p => p.status !== 'archived')

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
                        Показать архивные проекты ({archivedCount})
                    </label>
                </div>
            )}

            {loading ? (
                <p className="text-slate-500 dark:text-slate-400">Загрузка...</p>
            ) : visibleProjects.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
                    {showArchived ? 'Проектов пока нет' : 'Активных проектов нет'}
                </div>
            ) : (
                <div className="space-y-3">
                    {visibleProjects.map(p => (
                        <div
                            key={p.id}
                            className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow ${
                                p.status === 'archived' ? 'opacity-70' : ''
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{p.name}</h3>
                                        <button
                                            onClick={() => setEditModal({ project: p })}
                                            className="text-xs text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                            title="Редактировать"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => archiveProject(p)}
                                            className="text-xs text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                            title={p.status === 'archived' ? 'Разархивировать' : 'В архив'}
                                        >
                                            {p.status === 'archived' ? '♻️' : '🗂'}
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {p.description || 'Без описания'}
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ml-3 ${
                                        STATUS_STYLES[p.status] ?? STATUS_STYLES.archived
                                    }`}
                                >
                  {STATUS_LABELS[p.status] ?? p.status}
                </span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300">
                                        Команда
                                    </h4>
                                    <button
                                        onClick={() => setAddMemberModal({ projectId: p.id, isOpen: true })}
                                        className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition"
                                    >
                                        + Добавить участника
                                    </button>
                                </div>

                                {loadingParticipants[p.id] ? (
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Загрузка...</p>
                                ) : !participants[p.id] || participants[p.id].length === 0 ? (
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Команда пока пуста</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                        {participants[p.id].map((part, idx) => (
                                            <div
                                                key={`${part.userId}-${part.projectRole}-${idx}`}
                                                className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-semibold text-xs shrink-0">
                                                    {part.fio[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate">{part.fio}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {part.projectRole}
                                                    </p>
                                                </div>
                                                {part.isLead && (
                                                    <span className="ml-auto text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                            Lead
                          </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {addMemberModal.isOpen && (
                <ProjectMemberModal
                    projectId={addMemberModal.projectId}
                    onClose={() => setAddMemberModal({ projectId: '', isOpen: false })}
                    onAdded={() => handleMemberAdded(addMemberModal.projectId)}
                />
            )}

            {editModal.project && (
                <ProjectEditModal
                    project={editModal.project}
                    onClose={() => setEditModal({ project: null })}
                    onUpdated={load}
                />
            )}
        </div>
    )
}

export default ProjectsPage