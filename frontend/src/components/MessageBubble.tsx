import clsx from 'clsx'

import { formatMessageTime } from '../hooks/useChat'
import { Avatar } from './Avatar'

export type BubbleMessage = {
  message_guid: string
  user_guid: string
  content: string
  created_at: string
}

type Props = {
  message: BubbleMessage
  isMine: boolean
  peerName: string
  peerImage: string | null
  myName: string
  myImage: string | null
}

export function MessageBubble({ message, isMine, peerName, peerImage, myName, myImage }: Props) {
  const isInlineImage = /^data:image\/[a-zA-Z0-9+.-]+;base64,/.test(message.content)
  const fileMatch = message.content.match(/^\[file:([^\]]+)\](data:[\s\S]+)$/)
  const fileName = fileMatch ? decodeURIComponent(fileMatch[1]) : ''
  const fileDataUrl = fileMatch ? fileMatch[2] : ''

  return (
    <div
      className={clsx(
        'flex w-full max-w-[min(100%,52rem)] gap-2 transition-opacity duration-200',
        isMine ? 'ml-auto flex-row-reverse' : 'mr-auto',
      )}
    >
      <Avatar src={isMine ? myImage : peerImage} name={isMine ? myName : peerName} size="sm" />
      <div className={clsx('flex min-w-0 flex-col gap-0.5', isMine ? 'items-end' : 'items-start')}>
        <div className="flex items-baseline gap-2 px-1">
          <span className="text-xs font-medium text-white/90">{isMine ? myName : peerName}</span>
          <span className="text-[10px] text-[#8b92a8]">{formatMessageTime(message.created_at)}</span>
        </div>
        <div
          className={clsx(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-lg/10',
            isMine
              ? 'rounded-tr-sm bg-[#5d87ff] text-white'
              : 'rounded-tl-sm bg-[#2a3142] text-[#e8eaf0] ring-1 ring-white/5',
          )}
        >
          {isInlineImage ? (
            <img src={message.content} alt="sent image" className="max-h-72 max-w-full rounded-xl object-contain" />
          ) : fileMatch ? (
            <a
              href={fileDataUrl}
              download={fileName || 'file'}
              className="inline-flex max-w-full items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-white underline underline-offset-2"
            >
              <span className="truncate">File: {fileName || 'download'}</span>
            </a>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  )
}
