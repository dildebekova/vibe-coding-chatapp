import { api } from './api'

export interface ChatUser {
  guid: string
  username: string
  first_name: string
  last_name: string
  user_image: string | null
}

export interface DirectChat {
  chat_guid: string
  chat_type: string
  created_at: string
  updated_at: string
  users: ChatUser[]
  new_messages_count: number
}

export interface DirectChatsResponse {
  chats: DirectChat[]
  total_unread_messages_count: number
}

export interface ContactUser {
  guid: string
  username: string
  email: string
  first_name: string
  last_name: string
  created_at: string
  last_login: string | null
  user_image: string | null
}

export interface ApiMessage {
  message_guid: string
  user_guid: string
  chat_guid: string
  content: string
  created_at: string
  is_read?: boolean
}

export interface MessagesResponse {
  messages: ApiMessage[]
  has_more_messages: boolean
  last_read_message?: { guid: string; content: string; created_at: string } | null
}

export async function fetchDirectChats(): Promise<DirectChatsResponse> {
  const { data } = await api.get<DirectChatsResponse>('/chats/direct/')
  return data
}

export async function fetchContacts(): Promise<ContactUser[]> {
  const { data } = await api.get<ContactUser[]>('/users/')
  return data
}

export async function fetchMessages(chatGuid: string, size = 50): Promise<MessagesResponse> {
  const { data } = await api.get<MessagesResponse>(`/chat/${chatGuid}/messages/`, {
    params: { size },
  })
  return data
}

export async function createDirectChat(recipientUserGuid: string): Promise<{ guid: string }> {
  const { data } = await api.post<{ guid: string; chat_type: string; users: ChatUser[] }>('/chat/direct/', {
    recipient_user_guid: recipientUserGuid,
  })
  return { guid: data.guid }
}
