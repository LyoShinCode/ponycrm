import { useState } from 'react'

const PRESET_ROLES = [
    'Системный аналитик', 'Бизнес-аналитик', 'Архитектор', 'Дизайнер',
    'Бэкенд-разработчик', 'Фронтенд-разработчик', 'QA-инженер', 'Тимлид', 'Юрист',
]

const inputCls =
    'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

interface Props {
    onClose: () => void
    onCreated: () => void
}

function UserModal({ onClose, onCreated }: Props) {
    const [lastName, setLastName] = useState('')
    const [firstName, setFirstName] = useState('')
    const [middleName, setMiddleName] = useState('')
    const [email, setEmail] = useState('')
    const [roles, setRoles] = useState<string[]>([])
    const [customRole, setCustomRole] = useState('')
    const [error, setError] = useState('')

    const toggleRole = (role: string) =>
        setRoles(prev => (prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]))

    const addCustomRole = () => {
        const r = customRole.trim()
        if (r && !roles.includes(r)) setRoles(prev => [...prev, r])
        setCustomRole('')
    }

    const submit = async () => {
        if (!lastName.trim() || !firstName.trim()) { setError('Фамилия и имя обязательны'); return }
        if (roles.length === 0) { setError('Выбери минимум одну роль'); return }
        const res = await fetch('http://localhost:8080/api/v1/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lastName: lastName.trim(),
                firstName: firstName.trim(),
                middleName: middleName.trim() || null,
                email: email.trim() || null,
                roles,
            }),
        })
        if (res.ok) { onCreated(); onClose() } else setError('Не удалось сохранить участника')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 m-4 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4">Новый участник</h2>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Фамилия *</label>
                        <input className={inputCls} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Иванов" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Имя *</label>
                        <input className={inputCls} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Иван" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Отчество</label>
                        <input className={inputCls} value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="Иванович" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                        <input className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="ivan@ponycrm.ru" />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                        Роли (можно несколько) *
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {PRESET_ROLES.map(role => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => toggleRole(role)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                    roles.includes(role)
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-emerald-400'
                                }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                        <input
                            className={inputCls}
                            value={customRole}
                            onChange={e => setCustomRole(e.target.value)}
                            placeholder="Своя роль (например, DevOps)"
                            onKeyDown={e => e.key === 'Enter' && addCustomRole()}
                        />
                        <button
                            type="button"
                            onClick={addCustomRole}
                            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                            Добавить
                        </button>
                    </div>
                </div>

                {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={submit}
                        className="px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition"
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    )
}

export default UserModal