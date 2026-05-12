import { ArrowLeft, MoreHorizontal, Phone, Video } from 'lucide-react'
import { useEffect, useRef } from 'react'

import type { ApiMessage } from '../services/chatApi'
import { displayName, formatLastSeen } from '../hooks/useChat'
import type { AuthUser } from '../services/auth'
import { MessageBubble } from './MessageBubble'
import { InputBar } from './InputBar'
import { Avatar } from './Avatar'

type Props = {
  peer: { guid: string; first_name: string; last_name: string; username: string; user_image: string | null } | null
  peerLastLogin: string | null | undefined
  peerOnline: boolean
  messages: ApiMessage[]
  currentUser: AuthUser
  loading: boolean
  onSend: (text: string) => void
  canSend: boolean
  wsDisconnected?: boolean
  onBack?: () => void
}

export function ChatWindow({
  peer,
  peerLastLogin,
  peerOnline,
  messages,
  currentUser,
  loading,
  onSend,
  canSend,
  wsDisconnected,
  onBack,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, peer?.guid])

  const myName = displayName({
    first_name: currentUser.first_name,
    last_name: currentUser.last_name,
    username: currentUser.username,
  })

  if (!peer) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#141722] px-6 text-center">
        <div className="max-w-sm rounded-3xl bg-[#1a1d29] p-10 ring-1 ring-white/5">
          <p className="text-lg font-semibold text-white">Select a user to start chatting</p>
          <p className="mt-2 text-sm text-[#8b92a8]">
            Pick someone from your direct chats or start a new conversation from the sidebar.
          </p>
        </div>
      </div>
    )
  }

  const peerName = displayName(peer)
  const statusLine = peerOnline ? 'Online' : `Last seen ${formatLastSeen(peerLastLogin ?? null)}`

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#141722]">
      <header className="flex shrink-0 items-center gap-3 border-b border-[#2a2f3f] bg-[#1a1d29]/90 px-3 py-3 backdrop-blur md:px-5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-full p-2 text-[#8b92a8] hover:bg-white/5 hover:text-white md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <Avatar src={peer.user_image} name={peerName} size="md" online={peerOnline} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-white">{peerName}</h2>
          <p className="truncate text-xs text-[#8b92a8]">{statusLine}</p>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            className="rounded-full p-2.5 text-[#8b92a8] transition hover:bg-white/5 hover:text-white"
            title="Call"
          >
            <Phone className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-full p-2.5 text-[#8b92a8] transition hover:bg-white/5 hover:text-white"
            title="Video"
          >
            <Video className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-full p-2.5 text-[#8b92a8] transition hover:bg-white/5 hover:text-white"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5d87ff] border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#8b92a8]">No messages yet. Say hello!</p>
        ) : (
          <div className="mx-auto flex max-w-[52rem] flex-col gap-4">
            {messages.map((m) => (
              <MessageBubble
                key={m.message_guid}
                message={m}
                isMine={m.user_guid === currentUser.user_guid}
                peerName={peerName}
                peerImage={peer.user_image}
                myName={myName}
                myImage={currentUser.user_image}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {wsDisconnected && (
        <div className="border-t border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-[11px] text-amber-100/95">
          WebSocket reconnecting — new messages still arrive via polling (~3s).
        </div>
      )}
      {!canSend && !wsDisconnected && (
        <div className="border-t border-amber-500/20 bg-amber-500/5 px-4 py-2 text-center text-xs text-amber-100/90">
          Connect to the server to send messages (WebSocket).
        </div>
      )}
      <InputBar onSend={onSend} disabled={!canSend} />
    </div>
  )
}
