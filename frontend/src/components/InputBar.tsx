import { Camera, Image as ImageIcon, Mic, Paperclip, SendHorizontal, Smile } from 'lucide-react'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  onSend: (text: string) => void
  disabled?: boolean
}

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  start: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike
const MAX_IMAGE_MESSAGE_LENGTH = 4800

export function InputBar({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    const t = value.trim()
    if (!t || disabled) return
    onSend(t)
    setValue('')
  }

  const appendText = (text: string) => {
    setValue((prev) => `${prev}${text}`)
  }

  const sendFileMessage = (file: File | null) => {
    if (!file || disabled) return
    const sizeKb = Math.max(1, Math.round(file.size / 1024))
    // Current backend accepts only plain text content, so files are sent as metadata.
    onSend(`[file] ${file.name} (${sizeKb} KB)`)
    toast.success('File info sent')
  }

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })

  const dataUrlToImage = (dataUrl: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Failed to load image'))
      image.src = dataUrl
    })

  const buildImagePayload = async (file: File): Promise<string | null> => {
    const rawDataUrl = await fileToDataUrl(file)
    const image = await dataUrlToImage(rawDataUrl)
    const canvas = document.createElement('canvas')

    const maxSide = 320
    const ratio = Math.min(1, maxSide / Math.max(image.width, image.height))
    canvas.width = Math.max(1, Math.round(image.width * ratio))
    canvas.height = Math.max(1, Math.round(image.height * ratio))

    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    const qualities = [0.75, 0.6, 0.45, 0.3]
    for (const quality of qualities) {
      const compressed = canvas.toDataURL('image/jpeg', quality)
      if (compressed.length <= MAX_IMAGE_MESSAGE_LENGTH) return compressed
    }
    return null
  }

  const sendImageMessage = async (file: File | null) => {
    if (!file || disabled) return
    try {
      const payload = await buildImagePayload(file)
      if (!payload) {
        toast.error('Image is too large for current chat backend')
        return
      }
      onSend(payload)
      toast.success('Image sent')
    } catch {
      toast.error('Could not process image')
    }
  }

  const startVoiceInput = () => {
    if (disabled) return
    const win = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor
      webkitSpeechRecognition?: SpeechRecognitionCtor
    }
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      toast.error('Voice input is not supported in this browser')
      return
    }
    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'ru-RU'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim()
      if (transcript) {
        setValue((prev) => `${prev}${prev ? ' ' : ''}${transcript}`)
        toast.success('Voice text added')
      }
    }
    recognition.onerror = () => {
      toast.error('Voice input failed')
    }
    recognition.start()
  }

  const onEmojiSelect = (emojiData: EmojiClickData) => {
    appendText(emojiData.emoji)
    setEmojiOpen(false)
  }

  return (
    <div className="border-t border-[#2a2f3f] bg-[#1a1d29]/95 p-3 backdrop-blur md:p-4">
      <div className="mx-auto flex max-w-[52rem] items-end gap-2 rounded-2xl bg-[#222635] p-2 ring-1 ring-white/5 transition-shadow focus-within:ring-[#5d87ff]/40">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            sendFileMessage(e.target.files?.[0] ?? null)
            e.currentTarget.value = ''
          }}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void sendImageMessage(e.target.files?.[0] ?? null)
            e.currentTarget.value = ''
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            void sendImageMessage(e.target.files?.[0] ?? null)
            e.currentTarget.value = ''
          }}
        />
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
        <div className="relative flex shrink-0 items-center gap-1 pr-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full p-2 text-[#8b92a8] transition hover:bg-white/5 hover:text-white disabled:opacity-40"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => imageInputRef.current?.click()}
            className="rounded-full p-2 text-[#8b92a8] transition hover:bg-white/5 hover:text-white disabled:opacity-40"
            title="Attach image"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setEmojiOpen((v) => !v)}
            className="rounded-full p-2 text-[#8b92a8] transition hover:bg-white/5 hover:text-white disabled:opacity-40"
            title="Emoji"
          >
            <Smile className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={startVoiceInput}
            className="rounded-full p-2 text-[#8b92a8] transition hover:bg-white/5 hover:text-white disabled:opacity-40"
            title="Speech-to-text"
          >
            <Mic className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => cameraInputRef.current?.click()}
            className="rounded-full p-2 text-[#8b92a8] transition hover:bg-white/5 hover:text-white disabled:opacity-40"
            title="Camera"
          >
            <Camera className="h-5 w-5" />
          </button>
          {emojiOpen && (
            <div className="absolute bottom-12 right-14 z-20 overflow-hidden rounded-xl ring-1 ring-white/10">
              <EmojiPicker
                onEmojiClick={onEmojiSelect}
                lazyLoadEmojis
                width={320}
                height={420}
                searchDisabled={false}
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
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
