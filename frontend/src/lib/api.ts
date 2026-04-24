import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Get token from localStorage
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

// Get axios instance with auth header
const getAxios = () => {
  const instance = axios.create({
    baseURL: API_URL,
  })

  instance.interceptors.request.use((config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  return instance
}

// Projects API
export const projectsApi = {
  list: () => getAxios().get('/projects'),
  get: (id: string) => getAxios().get(`/projects/${id}`),
  create: (data: { name: string; description?: string }) =>
    getAxios().post('/projects', data),
  update: (id: string, data: any) =>
    getAxios().put(`/projects/${id}`, data),
  delete: (id: string) => getAxios().delete(`/projects/${id}`),
}

// Stage 1 API
export const stage1Api = {
  chat: (projectId: string, message: string) =>
    getAxios().post(`/projects/${projectId}/stage/1/chat`, { message }),
  proceed: (projectId: string, force = false) =>
    getAxios().post(`/projects/${projectId}/stage/1/proceed`, { force }),
}

// Stage 2 API
export const stage2Api = {
  generate: (projectId: string) =>
    getAxios().post(`/projects/${projectId}/stage/2/generate`),
  updateEpic: (projectId: string, epicId: string, data: any) =>
    getAxios().put(`/projects/${projectId}/stage/2/epic/${epicId}`, data),
  toggleFeature: (projectId: string, epicId: string, featureId: string, enabled: boolean) =>
    getAxios().post(`/projects/${projectId}/stage/2/epic/${epicId}/feature/${featureId}/toggle`, {
      enabled,
    }),
  confirm: (projectId: string) =>
    getAxios().post(`/projects/${projectId}/stage/2/confirm`),
}

// Stage 3 API
export const stage3Api = {
  generate: (projectId: string) =>
    getAxios().post(`/projects/${projectId}/stage/3/generate`),
  moveStory: (projectId: string, storyId: string, status: string) =>
    getAxios().post(`/projects/${projectId}/stage/3/story/${storyId}/move`, {
      status,
    }),
  editStory: (projectId: string, storyId: string, field: string, value: any) =>
    getAxios().put(`/projects/${projectId}/stage/3/story/${storyId}`, {
      [field]: value,
    }),
  regenerateStory: (projectId: string, storyId: string, prompt: string) =>
    getAxios().post(`/projects/${projectId}/stage/3/story/${storyId}/regenerate`, {
      prompt,
    }),
  confirm: (projectId: string) =>
    getAxios().post(`/projects/${projectId}/stage/3/confirm`),
}

// Stage 4 API
export const stage4Api = {
  generate: (projectId: string) =>
    getAxios().post(`/projects/${projectId}/stage/4/generate`),
  updateArchitecture: (projectId: string, data: any) =>
    getAxios().put(`/projects/${projectId}/stage/4`, data),
  modify: (projectId: string, prompt: string) =>
    getAxios().post(`/projects/${projectId}/stage/4/modify`, { prompt }),
  confirm: (projectId: string) =>
    getAxios().post(`/projects/${projectId}/stage/4/confirm`),
}

// Stage 5 API
export const stage5Api = {
  generate: (projectId: string) =>
    getAxios().post(`/projects/${projectId}/stage/5/generate`),
  updateScreen: (projectId: string, screenId: string, data: any) =>
    getAxios().put(`/projects/${projectId}/stage/5/screen/${screenId}`, data),
  editScreen: (projectId: string, screenId: string, prompt: string) =>
    getAxios().post(`/projects/${projectId}/stage/5/screen/${screenId}/edit`, { prompt }),
  approveScreen: (projectId: string, screenId: string) =>
    getAxios().post(`/projects/${projectId}/stage/5/screen/${screenId}/approve`),
  confirm: (projectId: string) =>
    getAxios().post(`/projects/${projectId}/stage/5/confirm`),
}

// Stage 6 API
export const stage6Api = {
  generate: (projectId: string) =>
    getAxios().post(`/projects/${projectId}/stage/6/generate`),
  updatePlan: (projectId: string, data: any) =>
    getAxios().put(`/projects/${projectId}/stage/6`, data),
  validate: (projectId: string) =>
    getAxios().post(`/projects/${projectId}/stage/6/validate`),
  editTask: (projectId: string, taskId: string, data: any) =>
    getAxios().put(`/projects/${projectId}/stage/6/task/${taskId}`, data),
  confirm: (projectId: string) =>
    getAxios().post(`/projects/${projectId}/stage/6/confirm`),
}

// Stage 7 API
export const stage7Api = {
  generate: (projectId: string) =>
    getAxios().post(`/projects/${projectId}/stage/7/generate`),
  getFile: (projectId: string, index: number) =>
    getAxios().get(`/projects/${projectId}/stage/7/file/${index}`),
  downloadAll: (projectId: string) =>
    getAxios().get(`/projects/${projectId}/stage/7/download`, {
      responseType: 'blob',
    }),
}
