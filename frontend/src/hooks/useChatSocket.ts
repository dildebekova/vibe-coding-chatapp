import { useCallback, useEffect, useRef, useState } from 'react'

import { getWebSocketUrl } from '../services/api'
import { getAccessToken } from '../services/storage'
import { parseWsPayload, type WsPayload } from '../services/websocket'

export function useChatConnection(onEvent: (payload: WsPayload) => void) {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const cb = useRef(onEvent)
  cb.current = onEvent

  useEffect(() => {
    const token = getAccessToken()
    if (!token) return

    const ws = new WebSocket(getWebSocketUrl(token))
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => {
      setConnected(false)
      wsRef.current = null
    }
    ws.onerror = () => setConnected(false)

    ws.onmessage = (ev) => {
      const payload = parseWsPayload(ev.data)
      if (payload) cb.current(payload)
    }

    return () => {
      ws.close()
      wsRef.current = null
      setConnected(false)
    }
  }, [])

  const send = useCallback((payload: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  return { connected, send }
}
