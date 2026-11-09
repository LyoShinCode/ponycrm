import { useEffect, useState } from 'react'
import type { Project } from './types'
import ProjectsPage from './pages/ProjectsPage'
import UsersPage from './pages/UsersPage'
import ProjectDetailPage from './pages/ProjectDetailPage'

type Page = 'projects' | 'users'

function App() {
    const [page, setPage] = useState<Page>('projects')
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [dark, setDark] = useState(() => localStorage.getItem('ponycrm-theme') === 'dark')

    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark)
        localStorage.setItem('ponycrm-theme', dark ? 'dark' : 'light')
    }, [dark])

    const goProjects = () => {
        setSelectedProject(null)
        setPage('projects')
    }

    const navBtn = (active: boolean) =>
        `w-full text-left px-3 py-2 rounded-lg transition ${
            active
                ? 'bg-emerald-50 text-emerald-700 font-medium dark:bg-slate-700 dark:text-emerald-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
        }`

    let content
    if (page === 'users') {
        content = <UsersPage />
    } else if (selectedProject) {
        content = <ProjectDetailPage project={selectedProject} onBack={goProjects} />
    } else {
        content = <ProjectsPage onSelect={setSelectedProject} />
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors">
            <div className="flex">
                <aside className="w-60 min-h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2 px-2 py-3 mb-2 cursor-pointer" onClick={goProjects}>
                        <span className="text-2xl">🐴</span>
                        <span className="text-lg font-bold">PonyCRM</span>
                    </div>
                    <button className={navBtn(page === 'projects' && !selectedProject)} onClick={goProjects}>
                        📁 Проекты
                    </button>
                    <button
                        className={navBtn(page === 'users')}
                        onClick={() => { setSelectedProject(null); setPage('users') }}
                    >
                        👥 Участники
                    </button>
                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            className="w-full text-left px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition"
                            onClick={() => setDark(!dark)}
                        >
                            {dark ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
                        </button>
                    </div>
                </aside>

                <main className="flex-1 p-8">{content}</main>
            </div>
        </div>
    )
}

export default App