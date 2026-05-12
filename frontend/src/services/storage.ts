const ACCESS = 'chat_access_token'
const REFRESH = 'chat_refresh_token'
const USER = 'chat_user_json'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH)
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS, access)
  localStorage.setItem(REFRESH, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
  localStorage.removeItem(USER)
}

export function getStoredUserJson(): string | null {
  return localStorage.getItem(USER)
}

export function setStoredUserJson(json: string) {
  localStorage.setItem(USER, json)
}
