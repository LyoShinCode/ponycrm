import { useState, useEffect } from 'react'
import type { User } from '../types'

interface Props {
    projectId: string
    onClose: () => void
    onAdded: () => void
}

export default function ProjectMemberModal({ projectId, onClose, onAdded }: Props) {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<string | null>(null)
    const [projectRole, setProjectRole] = useState('')
    const [isLead, setIsLead] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetch('http://localhost:8080/api/v1/users')
        .then(res => res.json())
        .then(data => {
            setUsers(data)
            setLoading(false)
        })
        .catch(() => setLoading(false))
    }, [])

    const submit = async () => {
        if (!selectedUser || !projectRole) {
            setError('Выбери пользователя и роль')
            return
        }
        const res = await fetch(
            `http://localhost:8080/api/v1/projects/${projectId}/participants`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUser,
                    projectRole,
                    isLead,
                }),
            }
        )
        if (res.ok) {
            onAdded()
            onClose()
        } else if (res.status === 409) {
            setError('Этот участник уже добавлен с такой ролью')
        } else {
            setError('Не удалось добавить участника')
        }
    }

    const inputCls =
        'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 m-4 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4">Добавить участника в проект</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Пользователь
                    </label>
                    {loading ? (
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Загрузка...</p>
                    ) : (
                        <select
                            className={inputCls}
                            value={selectedUser || ''}
                            onChange={e => setSelectedUser(e.target.value)}
                        >
                            <option value="">Выберите пользователя</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.lastName} {u.firstName} {u.middleName || ''}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Роль на проекте
                    </label>
                    <input
                        type="text"
                        className={inputCls}
                        placeholder="Архитектор, Системный аналитик..."
                        value={projectRole}
                        onChange={e => setProjectRole(e.target.value)}
                    />
                </div>

                <div className="flex items-center mb-4">
                    <input
                        type="checkbox"
                        id="isLead"
                        checked={isLead}
                        onChange={e => setIsLead(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <label
                        htmlFor="isLead"
                        className="ml-2 text-sm text-slate-700 dark:text-slate-300"
                    >
                        Руководитель проекта
                    </label>
                </div>

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
                )}

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        className="px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition"
                    >
                        Добавить
                    </button>
                </div>
            </div>
        </div>
    )
}