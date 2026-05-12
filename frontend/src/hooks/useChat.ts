import { formatDistanceToNow } from 'date-fns'

import type { ChatUser, DirectChat } from '../services/chatApi'

export function getPeerUser(chat: DirectChat, selfGuid: string): ChatUser | undefined {
  return chat.users.find((u) => u.guid !== selfGuid)
}

export function displayName(u: Pick<ChatUser, 'first_name' | 'last_name' | 'username'>): string {
  const full = `${u.first_name} ${u.last_name}`.trim()
  return full || u.username
}

export function formatLastSeen(iso: string | null | undefined): string {
  if (!iso) return 'Never active'
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
  } catch {
    return ''
  }
}

export function formatMessageTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
