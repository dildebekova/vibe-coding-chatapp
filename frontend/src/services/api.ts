import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './storage'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const rt = getRefreshToken()
  if (!rt) return null
  try {
    const { data } = await axios.post<{ access_token: string }>(`${API_URL}/refresh/`, {
      refresh_token: rt,
    })
    const newAccess = data.access_token
    setTokens(newAccess, rt)
    return newAccess
  } catch {
    clearTokens()
    window.location.assign('/login')
    return null
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    if (status === 401 && original && !original._retry) {
      const url = original.url || ''
      if (url.includes('/refresh/') || url.includes('/login/')) {
        return Promise.reject(error)
      }
      original._retry = true
      refreshPromise ??= refreshAccessToken()
      const newToken = await refreshPromise
      refreshPromise = null
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
    }

    if (status && status >= 500) {
      toast.error('Server error. Try again later.')
    }

    return Promise.reject(error)
  },
)

export function getWebSocketUrl(token: string): string {
  const base = API_URL.replace(/^http/, 'ws').replace(/\/$/, '')
  return `${base}/ws/?access_token=${encodeURIComponent(token)}`
}
