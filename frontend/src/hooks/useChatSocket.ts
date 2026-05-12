import { useCallback, useEffect, useRef, useState } from 'react'

import { getWebSocketUrl } from '../services/api'
import { getAccessToken } from '../services/storage'
import { parseWsPayload, type WsPayload } from '../services/websocket'

export function useChatConnection(onEvent: (payload: WsPayload) => void) {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const cb = useRef(onEvent)
  cb.current = onEvent
  const reconnectTimerRef = useRef<number | null>(null)
  const reconnectAttemptRef = useRef(0)

  useEffect(() => {
    let disposed = false

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }

    const scheduleReconnect = () => {
      clearReconnectTimer()
      if (disposed) return
      const token = getAccessToken()
      if (!token) return
      const attempt = reconnectAttemptRef.current
      const delay = Math.min(10_000, 500 * Math.pow(2, attempt))
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectAttemptRef.current = Math.min(8, reconnectAttemptRef.current + 1)
        connect()
      }, delay)
    }

    const connect = () => {
      if (disposed) return
      const token = getAccessToken()
      if (!token) {
        scheduleReconnect()
        return
      }

      // Avoid duplicate sockets.
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return
      }

      try {
        const ws = new WebSocket(getWebSocketUrl(token))
        wsRef.current = ws

        ws.onopen = () => {
          reconnectAttemptRef.current = 0
          setConnected(true)
        }
        ws.onclose = () => {
          setConnected(false)
          wsRef.current = null
          scheduleReconnect()
        }
        ws.onerror = () => {
          setConnected(false)
          // onclose will schedule reconnect in most cases
        }
        ws.onmessage = (ev) => {
          const payload = parseWsPayload(ev.data)
          if (payload) cb.current(payload)
        }
      } catch {
        setConnected(false)
        wsRef.current = null
        scheduleReconnect()
      }
    }

    // Initial connect + keep trying if token appears a bit later.
    connect()
    const tokenPoll = window.setInterval(() => {
      if (disposed) return
      if (!wsRef.current) connect()
    }, 1500)

    return () => {
      disposed = true
      clearReconnectTimer()
      window.clearInterval(tokenPoll)
      wsRef.current?.close()
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
