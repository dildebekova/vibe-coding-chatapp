import clsx from 'clsx'
import { LogOut, Mail, MessageCircle, Plus, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { displayName, getPeerUser } from '../hooks/useChat'
import type { AuthUser } from '../services/auth'
import type { ContactUser, DirectChat } from '../services/chatApi'
import { Avatar } from './Avatar'

type Tab = 'direct' | 'group' | 'public'

type Props = {
  user: AuthUser
  tab: Tab
  onTab: (t: Tab) => void
  search: string
  onSearch: (s: string) => void
  chats: DirectChat[]
  contacts: ContactUser[]
  selectedChatGuid: string | null
  onSelectChat: (chatGuid: string) => void
  onPickContact: (userGuid: string) => void
  onLogout: () => void
  loading: boolean
}

export function Sidebar({
  user,
  tab,
  onTab,
  search,
  onSearch,
  chats,
  contacts,
  selectedChatGuid,
  onSelectChat,
  onPickContact,
  onLogout,
  loading,
}: Props) {
  const [newOpen, setNewOpen] = useState(false)

  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return chats
    return chats.filter((c) => {
      const p = getPeerUser(c, user.user_guid)
      const label = p ? displayName(p) : ''
      return label.toLowerCase().includes(q)
    })
  }, [chats, search, user.user_guid])

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter((c) => displayName(c).toLowerCase().includes(q) || c.username.toLowerCase().includes(q))
  }, [contacts, search])

  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      onClick={() => onTab(t)}
      className={clsx(
        'flex-1 rounded-lg py-2 text-xs font-medium transition',
        tab === t ? 'bg-[#5d87ff] text-white shadow-md shadow-[#5d87ff]/20' : 'text-[#8b92a8] hover:bg-white/5 hover:text-white',
      )}
    >
      {label}
    </button>
  )

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-[#2a2f3f] bg-[#1a1d29] md:max-w-[20rem] md:shrink-0">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#2a2f3f] px-3 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-xl p-2.5 text-[#5d87ff] bg-[#5d87ff]/10"
            title="Chats"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button type="button" className="rounded-xl p-2.5 text-[#8b92a8] hover:bg-white/5 hover:text-white" title="Mail">
            <Mail className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Avatar src={user.user_image} name={displayName(user)} size="sm" />
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full p-2 text-[#8b92a8] transition hover:bg-red-500/10 hover:text-red-400"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between px-4 pt-4">
        <h1 className="text-lg font-bold text-white">Chats</h1>
        <button
          type="button"
          onClick={() => setNewOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5d87ff] text-white shadow-lg shadow-[#5d87ff]/25 transition hover:bg-[#4a74f0]"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex gap-1 px-3">
        {tabBtn('direct', 'Direct')}
        {tabBtn('group', 'Group')}
        {tabBtn('public', 'Public')}
      </div>

      <div className="mt-3 px-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b92a8]" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search"
            className="w-full rounded-xl border border-transparent bg-[#222635] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-[#8b92a8] outline-none ring-1 ring-white/5 transition focus:border-[#5d87ff]/50 focus:ring-[#5d87ff]/30"
          />
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {newOpen && (
          <div className="mb-3 rounded-2xl bg-[#222635] p-3 ring-1 ring-white/5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
              <Users className="h-4 w-4 text-[#5d87ff]" />
              New conversation
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filteredContacts.map((c) => (
                <button
                  key={c.guid}
                  type="button"
                  onClick={() => {
                    onPickContact(c.guid)
                    setNewOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-white/5"
                >
                  <Avatar src={c.user_image} name={displayName(c)} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{displayName(c)}</p>
                    <p className="truncate text-xs text-[#8b92a8]">@{c.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab !== 'direct' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-white/80">Coming soon</p>
            <p className="mt-1 max-w-[12rem] text-xs text-[#8b92a8]">
              {tab === 'group' ? 'Group channels' : 'Public rooms'} will appear here.
            </p>
          </div>
        )}

        {tab === 'direct' && loading && (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#222635]" />
            ))}
          </div>
        )}

        {tab === 'direct' && !loading && filteredChats.length === 0 && !newOpen && (
          <p className="px-2 py-8 text-center text-sm text-[#8b92a8]">No direct chats yet. Start one with +</p>
        )}

        {tab === 'direct' &&
          !loading &&
          filteredChats.map((chat) => {
            const peer = getPeerUser(chat, user.user_guid)
            if (!peer) return null
            const active = chat.chat_guid === selectedChatGuid
            return (
              <button
                key={chat.chat_guid}
                type="button"
                onClick={() => onSelectChat(chat.chat_guid)}
                className={clsx(
                  'mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition',
                  active ? 'bg-[#5d87ff]/15 ring-1 ring-[#5d87ff]/40' : 'hover:bg-[#222635]',
                )}
              >
                <Avatar src={peer.user_image} name={displayName(peer)} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-white">{displayName(peer)}</p>
                    {chat.new_messages_count > 0 && (
                      <span className="shrink-0 rounded-full bg-[#5d87ff] px-2 py-0.5 text-[10px] font-semibold text-white">
                        {chat.new_messages_count}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-[#8b92a8]">Direct message</p>
                </div>
              </button>
            )
          })}
      </div>
    </aside>
  )
}
