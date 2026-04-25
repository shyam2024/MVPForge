import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const getAuthToken = () => {
  if (typeof window === 'undefined') return null
  const authData = localStorage.getItem('auth-storage')
  if (!authData) return null
  try {
    const parsed = JSON.parse(authData)
    return parsed.state?.token || null
  } catch {
    return null
  }
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage') // his format
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Projects
export const projectsApi = {
  create: (data: { name: string; description?: string }) =>
    api.post('/projects', data),
  list: () => api.get('/projects'),
  get: (id: string) => api.get(`/projects/${id}`),
  delete: (id: string) => api.delete(`/projects/${id}`),
}

// Stage 1
export const stage1Api = {
  chat: (projectId: string, message: string) =>
    api.post(`/projects/${projectId}/stage1/chat`, { message }),
  proceed: (projectId: string, force = false) =>
    api.post(`/projects/${projectId}/stage1/proceed`, { force }),
}

// Stage 2
export const stage2Api = {
  generate: (projectId: string) =>
    api.post(`/projects/${projectId}/stage2/generate`),
  toggleFeature: (projectId: string, epic_id: string, feature_id: string, enabled: boolean) =>
    api.patch(`/projects/${projectId}/stage2/feature`, { epic_id, feature_id, enabled }),
  confirm: (projectId: string) =>
    api.post(`/projects/${projectId}/stage2/confirm`),
}

// Stage 3
export const stage3Api = {
  generate: (projectId: string) =>
    api.post(`/projects/${projectId}/stage3/generate`),
  moveStory: (projectId: string, story_id: string, new_status: string) =>
    api.patch(`/projects/${projectId}/stage3/story/move`, { story_id, new_status }),
  editStory: (projectId: string, story_id: string, field: string, value: unknown) =>
    api.patch(`/projects/${projectId}/stage3/story/edit`, { story_id, field, value }),
  regenerateStory: (projectId: string, story_id: string, prompt: string) =>
    api.post(`/projects/${projectId}/stage3/story/regenerate`, { story_id, prompt }),
  confirm: (projectId: string) =>
    api.post(`/projects/${projectId}/stage3/confirm`),
}

// Stage 4
export const stage4Api = {
  generate: (projectId: string) =>
    api.post(`/projects/${projectId}/stage4/generate`),
  modify: (projectId: string, prompt: string) =>
    api.post(`/projects/${projectId}/stage4/modify`, { prompt }),
  confirm: (projectId: string) =>
    api.post(`/projects/${projectId}/stage4/confirm`),
}

// Stage 5
export const stage5Api = {
  generate: (projectId: string) =>
    api.post(`/projects/${projectId}/stage5/generate`),
  editScreen: (projectId: string, screen_id: string, prompt: string) =>
    api.post(`/projects/${projectId}/stage5/screen/edit`, { screen_id, prompt }),
  approveScreen: (projectId: string, screen_id: string) =>
    api.post(`/projects/${projectId}/stage5/screen/approve`, { screen_id }),
  confirm: (projectId: string) =>
    api.post(`/projects/${projectId}/stage5/confirm`),
}

// Stage 6
export const stage6Api = {
  generate: (projectId: string) =>
    api.post(`/projects/${projectId}/stage6/generate`),
  validate: (projectId: string) =>
    api.post(`/projects/${projectId}/stage6/validate`),
  editTask: (projectId: string, task_id: string, updates: Record<string, unknown>) =>
    api.patch(`/projects/${projectId}/stage6/task`, { task_id, updates }),
  editManifest: (projectId: string, updates: Record<string, unknown>) =>
    api.patch(`/projects/${projectId}/stage6/manifest`, { updates }),
  confirm: (projectId: string) =>
    api.post(`/projects/${projectId}/stage6/confirm`),
}

// Stage 7
export const stage7Api = {
  generate: (projectId: string) =>
    api.post(`/projects/${projectId}/stage7/generate`, { confirm: true }),
  listFiles: (projectId: string) =>
    api.get(`/projects/${projectId}/stage7/files`),
  getFile: (projectId: string, index: number) =>
    api.get(`/projects/${projectId}/stage7/files/${index}`),
}
