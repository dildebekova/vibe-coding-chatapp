import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ChatWindow } from '../components/ChatWindow'
import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { getPeerUser } from '../hooks/useChat'
import { useChatConnection } from '../hooks/useChatSocket'
import type { WsNewMessage, WsPayload, WsStatus } from '../services/websocket'
import {
  createDirectChat,
  fetchContacts,
  fetchDirectChats,
  fetchMessages,
  type ApiMessage,
  type ContactUser,
  type DirectChat,
} from '../services/chatApi'

function mergeMessages(a: ApiMessage[], b: ApiMessage[]): ApiMessage[] {
  const map = new Map<string, ApiMessage>()
  for (const m of a) map.set(m.message_guid, m)
  for (const m of b) map.set(m.message_guid, m)
  return [...map.values()].sort(
    (x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime(),
  )
}

function wsNewToApi(m: WsNewMessage): ApiMessage {
  return {
    message_guid: m.message_guid,
    user_guid: m.user_guid,
    chat_guid: m.chat_guid,
    content: m.content,
    created_at: m.created_at,
    is_read: m.is_read,
  }
}

export default function ChatPage() {
  const { user, logout } = useAuth()
  if (!user) return null

  const [tab, setTab] = useState<'direct' | 'group' | 'public'>('direct')
  const [search, setSearch] = useState('')
  const [chats, setChats] = useState<DirectChat[]>([])
  const [contacts, setContacts] = useState<ContactUser[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [selectedChatGuid, setSelectedChatGuid] = useState<string | null>(null)
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [presence, setPresence] = useState<Record<string, 'online' | 'offline' | 'inactive'>>({})

  const reloadLists = useCallback(async () => {
    const [dc, cont] = await Promise.all([fetchDirectChats(), fetchContacts()])
    setChats(dc.chats)
    setContacts(cont)
  }, [])

  useEffect(() => {
    let cancelled = false
    setListLoading(true)
    reloadLists()
      .catch(() => {
        if (!cancelled) toast.error('Failed to load chats or contacts')
      })
      .finally(() => {
        if (!cancelled) setListLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadLists])

  const handleWs = useCallback(
    (payload: WsPayload) => {
      if ('status' in payload && payload.status === 'error' && 'message' in payload) {
        toast.error(String((payload as { message: string }).message))
        return
      }
      const p = payload as { type?: string }
      if (p.type === 'status') {
        const s = payload as WsStatus
        setPresence((prev) => ({ ...prev, [s.user_guid]: s.status }))
        return
      }
      if (p.type === 'new') {
        const n = payload as WsNewMessage
        setMessages((prev) => {
          if (prev.some((m) => m.message_guid === n.message_guid)) return prev
          if (n.chat_guid !== selectedChatGuid) return prev
          return mergeMessages(prev, [wsNewToApi(n)])
        })
        void reloadLists()
        return
      }
      if (p.type === 'new_chat_created') {
        void reloadLists()
      }
    },
    [selectedChatGuid, reloadLists],
  )

  const { connected, send } = useChatConnection(handleWs)

  useEffect(() => {
    if (!selectedChatGuid) {
      setMessages([])
      return
    }
    let cancelled = false
    setMsgLoading(true)
    fetchMessages(selectedChatGuid)
      .then((r) => {
        if (!cancelled) setMessages(mergeMessages([], r.messages))
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load messages')
      })
      .finally(() => {
        if (!cancelled) setMsgLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedChatGuid])

  useEffect(() => {
    if (!selectedChatGuid || connected) return
    const id = window.setInterval(() => {
      fetchMessages(selectedChatGuid)
        .then((r) => {
          setMessages((prev) => mergeMessages(prev, r.messages))
        })
        .catch(() => {})
    }, 2800)
    return () => clearInterval(id)
  }, [selectedChatGuid, connected])

  const openOrCreateWithUser = async (userGuid: string) => {
    // Temporary diagnostics to surface silent failures in UI (remove once stable).
    console.debug('[chat] openOrCreateWithUser', { userGuid })
    const hit = chats.find((c) => c.users.some((u) => u.guid === userGuid))
    if (hit) {
      console.debug('[chat] opening existing (in-state) chat', { chatGuid: hit.chat_guid })
      setSelectedChatGuid(hit.chat_guid)
      return
    }
    try {
      const { guid } = await createDirectChat(userGuid)
      console.debug('[chat] created chat', { guid })
      await reloadLists()
      console.debug('[chat] reloaded lists after create')
      setSelectedChatGuid(guid)
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        console.debug('[chat] create returned 409, refetching chats')
        const dc = await fetchDirectChats()
        setChats(dc.chats)
        const found = dc.chats.find((c) => c.users.some((u) => u.guid === userGuid))
        if (found) {
          console.debug('[chat] found existing chat after 409', { chatGuid: found.chat_guid })
          setSelectedChatGuid(found.chat_guid)
          toast.info('Opening existing conversation')
        }
      } else {
        console.error('[chat] createDirectChat failed', e)
        toast.error('Could not start chat')
      }
    }
  }

  const selectedChat = useMemo(
    () => chats.find((c) => c.chat_guid === selectedChatGuid),
    [chats, selectedChatGuid],
  )
  const peer = selectedChat ? getPeerUser(selectedChat, user.user_guid) : null
  const peerMeta = peer ? contacts.find((c) => c.guid === peer.guid) : undefined

  const peerOnline = peer ? presence[peer.guid] === 'online' : false

  const onSend = (text: string) => {
    if (!selectedChatGuid) return
    if (!connected) {
      toast.error('Not connected (WebSocket). Try again in a moment.')
      return
    }

    // Optimistic append so user immediately sees the message,
    // then reconcile with the backend via HTTP.
    const tempGuid =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `client-${crypto.randomUUID()}`
        : `client-${Math.random().toString(16).slice(2)}`
    const nowIso = new Date().toISOString()
    setMessages((prev) =>
      mergeMessages(prev, [
        {
          message_guid: tempGuid,
          user_guid: user.user_guid,
          chat_guid: selectedChatGuid,
          content: text,
          created_at: nowIso,
          is_read: true,
        },
      ]),
    )

    send({
      type: 'new_message',
      user_guid: user.user_guid,
      chat_guid: selectedChatGuid,
      content: text,
    })

    window.setTimeout(() => {
      fetchMessages(selectedChatGuid)
        .then((r) => {
          setMessages((prev) => mergeMessages(prev, r.messages))
        })
        .catch(() => {})
    }, 500)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#141722]">
      <div
        className={
          selectedChatGuid
            ? 'hidden h-full min-h-0 w-full md:flex md:max-w-[20rem] md:shrink-0'
            : 'flex h-full min-h-0 w-full md:max-w-[20rem] md:shrink-0'
        }
      >
        <Sidebar
          user={user}
          tab={tab}
          onTab={setTab}
          search={search}
          onSearch={setSearch}
          chats={chats}
          contacts={contacts}
          selectedChatGuid={selectedChatGuid}
          onSelectChat={setSelectedChatGuid}
          onPickContact={openOrCreateWithUser}
          onLogout={() => {
            void logout().then(() => toast.success('Signed out'))
          }}
          loading={listLoading}
        />
      </div>

      <div
        className={
          selectedChatGuid
            ? 'relative flex min-h-0 min-w-0 flex-1 flex-col'
            : 'relative hidden min-h-0 min-w-0 flex-1 flex-col md:flex'
        }
      >
        <ChatWindow
          peer={peer ?? null}
          peerLastLogin={peerMeta?.last_login}
          peerOnline={peerOnline}
          messages={messages}
          currentUser={user}
          loading={msgLoading}
          onSend={onSend}
          canSend={Boolean(selectedChatGuid && connected)}
          onBack={() => setSelectedChatGuid(null)}
          wsDisconnected={Boolean(selectedChatGuid && !connected)}
        />
      </div>
    </div>
  )
}
