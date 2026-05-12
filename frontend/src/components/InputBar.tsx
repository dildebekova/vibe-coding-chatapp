import { Camera, Image as ImageIcon, Mic, Paperclip, SendHorizontal, Smile } from 'lucide-react'
import { useState } from 'react'

type Props = {
  onSend: (text: string) => void
  disabled?: boolean
}

export function InputBar({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')

  const submit = () => {
    const t = value.trim()
    if (!t || disabled) return
    onSend(t)
    setValue('')
  }

  return (
    <div className="border-t border-[#2a2f3f] bg-[#1a1d29]/95 p-3 backdrop-blur md:p-4">
      <div className="mx-auto flex max-w-[52rem] items-end gap-2 rounded-2xl bg-[#222635] p-2 ring-1 ring-white/5 transition-shadow focus-within:ring-[#5d87ff]/40">
        <div className="flex flex-1 items-center">
          <textarea
            rows={1}
            placeholder="Say something..."
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-[#8b92a8] outline-none"
          />
        </div>
        <div className="flex shrink-0 items-center gap-1 pr-1">
          {[Paperclip, ImageIcon, Smile, Mic, Camera].map((Icon, i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              className="rounded-full p-2 text-[#8b92a8] transition hover:bg-white/5 hover:text-white disabled:opacity-40"
              title="Coming soon"
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
          <button
            type="button"
            disabled={disabled || !value.trim()}
            onClick={submit}
            className="ml-1 flex h-11 w-11 items-center justify-center rounded-full bg-[#5d87ff] text-white shadow-lg shadow-[#5d87ff]/25 transition hover:bg-[#4a74f0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
