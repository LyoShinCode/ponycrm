import { useEffect, useState } from 'react'
import type { User } from '../types'
import UserModal from '../components/UserModal'

export const CHIP_COLORS = [
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
]

function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)

    const load = () => {
        fetch('http://localhost:8080/api/v1/users')
        .then(res => res.json())
        .then(data => { setUsers(data); setLoading(false) })
        .catch(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Участники</h1>
                <button
                    onClick={() => setModalOpen(true)}
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
                                <div className="min-w-0">
                                    <h3 className="font-semibold truncate">
                                        {u.lastName} {u.firstName} {u.middleName ?? ''}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                        {u.email ?? 'email не указан'}
                                    </p>
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

            {modalOpen && <UserModal onClose={() => setModalOpen(false)} onCreated={load} />}
        </div>
    )
}

export default UsersPage