import { useEffect, useState } from 'react'
import type { Participant, Project } from '../types'
import ProjectMemberModal from '../components/ProjectMemberModal'

const STATUS_STYLES: Record<string, string> = {
    planning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    archived: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
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
        const res = await fetch('http://localhost:8080/api/v1/projects', { method: 'POST' })
        if (res.ok) load()
    }

    const handleMemberAdded = (projectId: string) => {
        loadParticipants(projectId)
        setAddMemberModal({ projectId: '', isOpen: false })
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
                        <div
                            key={p.id}
                            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="min-w-0">
                                    <h3 className="font-semibold">{p.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {p.description || 'Без описания'}
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ml-3 ${
                                        STATUS_STYLES[p.status] ?? STATUS_STYLES.archived
                                    }`}
                                >
                  {p.status}
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
        </div>
    )
}

export default ProjectsPage