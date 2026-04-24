import { create } from 'zustand'
import { projectsApi } from '@/lib/api'

export interface Project {
  id: string
  owner_id: string
  name: string
  description?: string
  current_stage: number
  created_at: string
  updated_at: string
  stage1?: any
  stage2?: any
  stage3?: any
  stage4?: any
  stage5?: any
  stage6?: any
  stage7?: any
}

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean

  fetchProjects: () => Promise<void>
  fetchProject: (id: string) => Promise<void>
  createProject: (data: { name: string; description?: string }) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project) => void
  updateCurrentProject: (project: Project) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true })
    try {
      const res = await projectsApi.list()
      const data = Array.isArray(res.data) ? res.data : res.data?.data || []
      set({ projects: data })
    } catch (error) {
      console.error('Error fetching projects:', error)
      set({ projects: [] })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchProject: async (id) => {
    set({ isLoading: true })
    try {
      const res = await projectsApi.get(id)
      set({ currentProject: res.data })
      // Also update in list
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? res.data : p)),
      }))
    } finally {
      set({ isLoading: false })
    }
  },

  createProject: async (data) => {
    const res = await projectsApi.create(data)
    const project = res.data
    set((state) => ({ projects: [project, ...state.projects] }))
    return project
  },

  deleteProject: async (id) => {
    await projectsApi.delete(id)
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }))
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  updateCurrentProject: (project) => {
    set({ currentProject: project })
    set((state) => ({
      projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    }))
  },
}))
