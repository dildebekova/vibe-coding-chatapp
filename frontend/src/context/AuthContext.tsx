import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { type AuthUser, login as loginRequest, logoutApi, register as registerRequest } from '../services/auth'
import { clearTokens, getAccessToken, getStoredUserJson } from '../services/storage'

type AuthContextValue = {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<void>
  register: (form: {
    email: string
    username: string
    password: string
    first_name: string
    last_name: string
    uploaded_image?: File | null
  }) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readUser(): AuthUser | null {
  const raw = getStoredUserJson()
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => (getAccessToken() ? readUser() : null))

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginRequest(username, password)
    const { access_token: _a, refresh_token: _r, ...rest } = data
    setUser(rest)
  }, [])

  const register = useCallback(
    async (form: {
      email: string
      username: string
      password: string
      first_name: string
      last_name: string
      uploaded_image?: File | null
    }) => {
      await registerRequest(form)
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      clearTokens()
    }
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      isAuthenticated: Boolean(getAccessToken() && user),
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
