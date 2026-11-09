import { useState } from 'react'
import type { Project } from '../types'

const STATUS_OPTIONS = [
    { value: 'planning', label: 'Планирование' },
    { value: 'active', label: 'Активный' },
    { value: 'archived', label: 'В архиве' },
]

interface Props {
    project: Project
    onClose: () => void
    onUpdated: () => void
}

export default function ProjectEditModal({ project, onClose, onUpdated }: Props) {
    const [name, setName] = useState(project.name)
    const [description, setDescription] = useState(project.description || '')
    const [status, setStatus] = useState(project.status)
    const [error, setError] = useState('')

    const submit = async () => {
        if (!name.trim()) {
            setError('Название обязательно')
            return
        }
        const res = await fetch(`http://localhost:8080/api/v1/projects/${project.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name.trim(),
                description: description.trim() || null,
                status,
            }),
        })
        if (res.ok) {
            onUpdated()
            onClose()
        } else {
            setError('Не удалось сохранить изменения')
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
                className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 m-4"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4">Редактировать проект</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Название
                    </label>
                    <input
                        type="text"
                        className={inputCls}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Название проекта"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Описание
                    </label>
                    <textarea
                        className={`${inputCls} min-h-[80px] resize-y`}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Краткое описание проекта"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Статус
                    </label>
                    <select
                        className={inputCls}
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                    >
                        {STATUS_OPTIONS.map(s => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
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
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    )
}