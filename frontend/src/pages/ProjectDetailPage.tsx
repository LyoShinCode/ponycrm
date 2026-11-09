import { useCallback, useEffect, useState } from 'react'
import type { MeetingNote, Participant, Project, Requirement, User } from '../types'
import ProjectEditModal from '../components/ProjectEditModal'
import ProjectMemberModal from '../components/ProjectMemberModal'

const PRIORITIES = ['critical', 'high', 'medium', 'low']
const STATUSES = ['draft', 'approved', 'in_dev', 'done', 'rejected']

const PRIORITY_STYLE: Record<string, string> = {
    critical: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    high: 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

const STATUS_STYLE: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    approved: 'bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    in_dev: 'bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    done: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    rejected: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const STATUS_RU: Record<string, string> = {
    draft: 'Черновик', approved: 'Согласовано', in_dev: 'В разработке', done: 'Готово', rejected: 'Отклонено',
}
const PRIORITY_RU: Record<string, string> = {
    critical: 'Критический', high: 'Высокий', medium: 'Средний', low: 'Низкий',
}

const inputCls =
    'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

interface Props {
    project: Project
    onBack: () => void
}

type Tab = 'team' | 'requirements' | 'meetings'

function ProjectDetailPage({ project, onBack }: Props) {
    const [tab, setTab] = useState<Tab>('requirements')
    const [currentProject, setCurrentProject] = useState<Project>(project)
    const [users, setUsers] = useState<User[]>([])
    const [participants, setParticipants] = useState<Participant[]>([])
    const [requirements, setRequirements] = useState<Requirement[]>([])
    const [meetings, setMeetings] = useState<MeetingNote[]>([])
    const [loading, setLoading] = useState(true)

    const [memberModal, setMemberModal] = useState(false)
    const [editProject, setEditProject] = useState(false)
    const [reqModal, setReqModal] = useState<{ open: boolean; req?: Requirement }>({ open: false })
    const [meetModal, setMeetModal] = useState<{ open: boolean; note?: MeetingNote }>({ open: false })

    const [statusFilter, setStatusFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')

    const loadBase = useCallback(() => {
        Promise.all([
            fetch('http://localhost:8080/api/v1/users').then(r => r.json()),
            fetch(`http://localhost:8080/api/v1/projects/${project.id}/participants`).then(r => r.json()),
        ])
        .then(([u, p]) => { setUsers(u); setParticipants(p) })
        .finally(() => setLoading(false))
    }, [project.id])

    const loadRequirements = useCallback(() => {
        const qs = new URLSearchParams()
        if (statusFilter) qs.set('status', statusFilter)
        if (priorityFilter) qs.set('priority', priorityFilter)
        fetch(`http://localhost:8080/api/v1/projects/${project.id}/requirements?${qs.toString()}`)
        .then(r => r.json())
        .then(setRequirements)
    }, [project.id, statusFilter, priorityFilter])

    const loadMeetings = useCallback(() => {
        fetch(`http://localhost:8080/api/v1/projects/${project.id}/meetings`)
        .then(r => r.json())
        .then(setMeetings)
    }, [project.id])

    useEffect(() => { loadBase(); loadRequirements(); loadMeetings() }, [loadBase, loadRequirements, loadMeetings])

    const refreshProjectAfterEdit = () => {
        fetch('http://localhost:8080/api/v1/projects')
        .then(r => r.json())
        .then((arr: Project[]) => {
            const fresh = arr.find(p => p.id === project.id)
            if (fresh) setCurrentProject(fresh)
        })
    }

    const deleteRequirement = async (id: string) => {
        if (!window.confirm('Удалить требование?')) return
        const res = await fetch(`http://localhost:8080/api/v1/projects/${project.id}/requirements/${id}`, { method: 'DELETE' })
        if (res.ok) loadRequirements()
    }

    const deleteMeeting = async (id: string) => {
        if (!window.confirm('Удалить конспект?')) return
        const res = await fetch(`http://localhost:8080/api/v1/projects/${project.id}/meetings/${id}`, { method: 'DELETE' })
        if (res.ok) loadMeetings()
    }

    const tabBtn = (t: Tab, label: string, count?: number) => (
        <button
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
        >
            {label}{count !== undefined ? ` (${count})` : ''}
        </button>
    )

    return (
        <div className="max-w-5xl mx-auto">
            <button onClick={onBack} className="text-sm text-slate-500 hover:text-emerald-600 dark:text-slate-400 mb-4 transition">
                ← Назад к проектам
            </button>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6">
                <div className="flex justify-between items-start">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold truncate">{currentProject.name}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {currentProject.description || 'Без описания'}
                        </p>
                    </div>
                    <button
                        onClick={() => setEditProject(true)}
                        className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition shrink-0 ml-3"
                    >
                        ✏️ Редактировать
                    </button>
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                {tabBtn('team', '👥 Команда', participants.length)}
                {tabBtn('requirements', '📋 Требования', requirements.length)}
                {tabBtn('meetings', '📝 Встречи', meetings.length)}
            </div>

            {loading ? (
                <p className="text-slate-500 dark:text-slate-400">Загрузка...</p>
            ) : tab === 'team' ? (
                <TeamTab participants={participants} onAdd={() => setMemberModal(true)} />
            ) : tab === 'requirements' ? (
                <RequirementsTab
                    requirements={requirements}
                    statusFilter={statusFilter}
                    priorityFilter={priorityFilter}
                    onStatus={setStatusFilter}
                    onPriority={setPriorityFilter}
                    onCreate={() => setReqModal({ open: true })}
                    onEdit={(r) => setReqModal({ open: true, req: r })}
                    onDelete={deleteRequirement}
                />
            ) : (
                <MeetingsTab
                    meetings={meetings}
                    onCreate={() => setMeetModal({ open: true })}
                    onEdit={(m) => setMeetModal({ open: true, note: m })}
                    onDelete={deleteMeeting}
                />
            )}

            {memberModal && (
                <ProjectMemberModal projectId={project.id} onClose={() => setMemberModal(false)} onAdded={loadBase} />
            )}
            {editProject && (
                <ProjectEditModal project={currentProject} onClose={() => setEditProject(false)} onUpdated={refreshProjectAfterEdit} />
            )}
            {reqModal.open && (
                <RequirementModal
                    projectId={project.id}
                    users={users}
                    initial={reqModal.req}
                    onClose={() => setReqModal({ open: false })}
                    onSaved={loadRequirements}
                />
            )}
            {meetModal.open && (
                <MeetingModal
                    projectId={project.id}
                    users={users}
                    initial={meetModal.note}
                    onClose={() => setMeetModal({ open: false })}
                    onSaved={loadMeetings}
                />
            )}
        </div>
    )
}

function TeamTab({ participants, onAdd }: { participants: Participant[]; onAdd: () => void }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold">Команда проекта</h2>
                <button onClick={onAdd} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
                    + Добавить участника
                </button>
            </div>
            {participants.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Команда пуста</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {participants.map((p, i) => (
                        <div key={`${p.userId}-${p.projectRole}-${i}`} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-semibold text-xs shrink-0">
                                {p.fio[0]}
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{p.fio}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.projectRole}</p>
                            </div>
                            {p.isLead && (
                                <span className="ml-auto text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                  Lead
                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function RequirementsTab(props: {
    requirements: Requirement[]
    statusFilter: string
    priorityFilter: string
    onStatus: (v: string) => void
    onPriority: (v: string) => void
    onCreate: () => void
    onEdit: (r: Requirement) => void
    onDelete: (id: string) => void
}) {
    const { requirements, statusFilter, priorityFilter, onStatus, onPriority, onCreate, onEdit, onDelete } = props
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <div className="flex gap-2">
                    <select className={inputCls + ' w-auto'} value={statusFilter} onChange={e => onStatus(e.target.value)}>
                        <option value="">Все статусы</option>
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_RU[s]}</option>)}
                    </select>
                    <select className={inputCls + ' w-auto'} value={priorityFilter} onChange={e => onPriority(e.target.value)}>
                        <option value="">Все приоритеты</option>
                        {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_RU[p]}</option>)}
                    </select>
                </div>
                <button onClick={onCreate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm">
                    + Новое требование
                </button>
            </div>

            {requirements.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Требований пока нет</p>
            ) : (
                <div className="space-y-2">
                    {requirements.map(r => (
                        <div key={r.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <h3 className="font-medium text-sm">{r.title}</h3>
                                    {r.description && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap">{r.description}</p>
                                    )}
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Автор: {r.authorFio}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLE[r.priority]}`}>
                    {PRIORITY_RU[r.priority]}
                  </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                    {STATUS_RU[r.status]}
                  </span>
                                    <div className="flex gap-1 mt-1">
                                        <button onClick={() => onEdit(r)} className="text-xs text-slate-500 hover:text-emerald-600 px-1">✏️</button>
                                        <button onClick={() => onDelete(r.id)} className="text-xs text-slate-500 hover:text-red-600 px-1">🗑</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function MeetingsTab(props: {
    meetings: MeetingNote[]
    onCreate: () => void
    onEdit: (m: MeetingNote) => void
    onDelete: (id: string) => void
}) {
    const { meetings, onCreate, onEdit, onDelete } = props
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Конспекты встреч</h2>
                <button onClick={onCreate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm">
                    + Новая встреча
                </button>
            </div>
            {meetings.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Встреч пока нет</p>
            ) : (
                <div className="space-y-3">
                    {meetings.map(m => (
                        <div key={m.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <h3 className="font-medium">{m.title}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        📅 {m.meetingDate} · 👤 {m.authorFio}
                                    </p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button onClick={() => onEdit(m)} className="text-xs text-slate-500 hover:text-emerald-600 px-1">✏️</button>
                                    <button onClick={() => onDelete(m.id)} className="text-xs text-slate-500 hover:text-red-600 px-1">🗑</button>
                                </div>
                            </div>
                            <pre className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {m.content}
              </pre>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function RequirementModal(props: {
    projectId: string
    users: User[]
    initial?: Requirement
    onClose: () => void
    onSaved: () => void
}) {
    const { projectId, users, initial, onClose, onSaved } = props
    const [title, setTitle] = useState(initial?.title || '')
    const [description, setDescription] = useState(initial?.description || '')
    const [priority, setPriority] = useState(initial?.priority || 'medium')
    const [status, setStatus] = useState(initial?.status || 'draft')
    const [authorId, setAuthorId] = useState(initial?.authorId || '')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const submit = async () => {
        if (!title.trim()) { setError('Заголовок обязателен'); return }
        if (!authorId) { setError('Выбери автора'); return }
        setBusy(true); setError('')
        const url = initial
            ? `http://localhost:8080/api/v1/projects/${projectId}/requirements/${initial.id}`
            : `http://localhost:8080/api/v1/projects/${projectId}/requirements`
        const res = await fetch(url, {
            method: initial ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title.trim(), description: description.trim() || null, priority, status, authorId }),
        })
        setBusy(false)
        if (res.ok) { onSaved(); onClose() } else setError('Не удалось сохранить')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 m-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{initial ? 'Редактировать требование' : 'Новое требование'}</h2>
                <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Заголовок *</label>
                    <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Авторизация через Госуслуги" />
                </div>
                <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Описание / User Story</label>
                    <textarea className={inputCls + ' min-h-[100px] resize-y'} value={description} onChange={e => setDescription(e.target.value)} placeholder="Как пользователь, я хочу..., чтобы..." />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Приоритет</label>
                        <select className={inputCls} value={priority} onChange={e => setPriority(e.target.value)}>
                            {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_RU[p]}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Статус</label>
                        <select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}>
                            {STATUSES.map(s => <option key={s} value={s}>{STATUS_RU[s]}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Автор *</label>
                        <select className={inputCls} value={authorId} onChange={e => setAuthorId(e.target.value)}>
                            <option value="">—</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.lastName} {u.firstName}</option>)}
                        </select>
                    </div>
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} disabled={busy} className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50">
                        Отмена
                    </button>
                    <button onClick={submit} disabled={busy} className="px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50">
                        {busy ? 'Сохраняем...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function MeetingModal(props: {
    projectId: string
    users: User[]
    initial?: MeetingNote
    onClose: () => void
    onSaved: () => void
}) {
    const { projectId, users, initial, onClose, onSaved } = props
    const [title, setTitle] = useState(initial?.title || '')
    const [content, setContent] = useState(initial?.content || '')
    const [meetingDate, setMeetingDate] = useState(initial?.meetingDate || new Date().toISOString().slice(0, 10))
    const [authorId, setAuthorId] = useState(initial?.authorId || '')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const submit = async () => {
        if (!title.trim()) { setError('Тема обязательна'); return }
        if (!content.trim()) { setError('Конспект обязателен'); return }
        if (!authorId) { setError('Выбери автора'); return }
        setBusy(true); setError('')
        const url = initial
            ? `http://localhost:8080/api/v1/projects/${projectId}/meetings/${initial.id}`
            : `http://localhost:8080/api/v1/projects/${projectId}/meetings`
        const res = await fetch(url, {
            method: initial ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title.trim(), content, meetingDate, authorId }),
        })
        setBusy(false)
        if (res.ok) { onSaved(); onClose() } else setError('Не удалось сохранить')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 m-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{initial ? 'Редактировать конспект' : 'Новая встреча'}</h2>
                <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Тема встречи *</label>
                    <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Кик-офф с заказчиком" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Дата встречи *</label>
                        <input type="date" className={inputCls} value={meetingDate} onChange={e => setMeetingDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Вёл (автор) *</label>
                        <select className={inputCls} value={authorId} onChange={e => setAuthorId(e.target.value)}>
                            <option value="">—</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.lastName} {u.firstName}</option>)}
                        </select>
                    </div>
                </div>
                <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Конспект (Markdown) *</label>
                    <textarea
                        className={inputCls + ' min-h-[160px] resize-y font-mono'}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder={'## Обсудили\n- ...\n\n## Решения\n- ...'}
                    />
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} disabled={busy} className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50">
                        Отмена
                    </button>
                    <button onClick={submit} disabled={busy} className="px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50">
                        {busy ? 'Сохраняем...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProjectDetailPage