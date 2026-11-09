import { useEffect, useState } from 'react'
import type { User } from '../types'
import UserModal from '../components/UserModal'

const CHIP_COLORS = [
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
]

function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState<{ mode: 'create' | 'edit'; user?: User } | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<User | null>(null)
    const [deleting, setDeleting] = useState(false)

    const load = () => {
        fetch('http://localhost:8080/api/v1/users')
        .then(res => res.json())
        .then(data => {
            setUsers(data)
            setLoading(false)
        })
        .catch(() => setLoading(false))
    }

    useEffect(() => {
        load()
    }, [])

    const deleteUser = async (user: User) => {
        setDeleting(true)
        const res = await fetch(`http://localhost:8080/api/v1/users/${user.id}`, { method: 'DELETE' })
        setDeleting(false)
        if (res.ok || res.status === 204) {
            setConfirmDelete(null)
            load()
        }
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Участники</h1>
                <button
                    onClick={() => setModal({ mode: 'create' })}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm"
                >
                    + Добавить участника
                </button>
            </div>

            {loading ? (
                <p className="text-slate-500 dark:text-slate-400">Загрузка...</p>
            ) : users.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
                    Участников пока нет. Добавь первого!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {users.map(u => (
                        <div key={u.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                                <div className="w-11 h-11 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-semibold">
                                    {u.lastName[0]}{u.firstName[0]}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold truncate">
                                        {u.lastName} {u.firstName} {u.middleName ?? ''}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                        {u.email ?? 'email не указан'}
                                    </p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button
                                        onClick={() => setModal({ mode: 'edit', user: u })}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-700 transition"
                                        title="Редактировать"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete(u)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-slate-700 transition"
                                        title="Удалить"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {u.roles.map((role, i) => (
                                    <span key={role} className={`px-2.5 py-1 rounded-full text-xs font-medium ${CHIP_COLORS[i % CHIP_COLORS.length]}`}>
                    {role}
                  </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal && (
                <UserModal
                    mode={modal.mode}
                    initialUser={modal.user}
                    onClose={() => setModal(null)}
                    onSaved={load}
                />
            )}

            {confirmDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
                    onClick={() => !deleting && setConfirmDelete(null)}
                >
                    <div
                        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 m-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold mb-2">Удалить участника?</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Будет удалён <strong>{confirmDelete.lastName} {confirmDelete.firstName}</strong>.
                            Также каскадно удалятся все его связки с проектами (в том числе роль руководителя).
                            Это действие необратимо.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                disabled={deleting}
                                className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={() => deleteUser(confirmDelete)}
                                disabled={deleting}
                                className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {deleting ? 'Удаляем...' : 'Удалить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UsersPage