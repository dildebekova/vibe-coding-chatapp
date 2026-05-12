export type WsNewMessage = {
  type: 'new'
  message_guid: string
  user_guid: string
  chat_guid: string
  content: string
  created_at: string
  is_read?: boolean
  is_new?: boolean
}

export type WsStatus = {
  type: 'status'
  user_guid: string
  username: string
  status: 'online' | 'offline' | 'inactive'
}

export type WsError = { status: 'error'; message: string }

export type WsPayload = WsNewMessage | WsStatus | WsError | Record<string, unknown>

export function parseWsPayload(raw: string): WsPayload | null {
  try {
    return JSON.parse(raw) as WsPayload
  } catch {
    return null
  }
}
