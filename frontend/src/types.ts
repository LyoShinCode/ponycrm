export interface Project {
    id: string
    name: string
    description: string | null
    status: string
}

export interface User {
    id: string
    lastName: string
    firstName: string
    middleName: string | null
    email: string | null
    roles: string[]
}

export interface Participant {
    userId: string
    fio: string
    projectRole: string
    isLead: boolean
}