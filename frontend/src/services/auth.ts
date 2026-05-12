import { api } from './api'
import { clearTokens, setStoredUserJson, setTokens } from './storage'

export interface AuthUser {
  user_guid: string
  username: string
  email: string
  first_name: string
  last_name: string
  user_image: string | null
  settings: Record<string, unknown>
}

export interface LoginResponse extends AuthUser {
  access_token: string
  refresh_token: string
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const body = new URLSearchParams()
  body.set('username', username)
  body.set('password', password)
  const { data } = await api.post<LoginResponse>('/login/', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const { access_token, refresh_token, ...userOnly } = data
  setTokens(access_token, refresh_token)
  setStoredUserJson(JSON.stringify(userOnly))
  return data
}

export async function register(form: {
  email: string
  username: string
  password: string
  first_name: string
  last_name: string
  uploaded_image?: File | null
}): Promise<void> {
  const fd = new FormData()
  fd.append('email', form.email)
  fd.append('username', form.username)
  fd.append('password', form.password)
  fd.append('first_name', form.first_name)
  fd.append('last_name', form.last_name)
  if (form.uploaded_image) {
    fd.append('uploaded_image', form.uploaded_image)
  }
  await api.post('/register/', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function logoutApi(): Promise<void> {
  try {
    await api.get('/logout/')
  } finally {
    clearTokens()
  }
}
