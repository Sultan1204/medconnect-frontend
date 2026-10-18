import Echo from 'laravel-echo'
import Pusher, { type AuthorizerCallback } from 'pusher-js'
import { ref } from 'vue'
import { env } from '@/config/env'
import { http } from '@/services/api/http'

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'unavailable' | 'disconnected'

/** Reactive connection status for reconnection indicators in chat / consultation screens. */
export const realtimeStatus = ref<RealtimeStatus>('idle')

let echo: Echo<'reverb'> | null = null

/**
 * Lazily creates the Laravel Echo client for Reverb. Private/presence channels are
 * authorised by the backend at the broadcast auth endpoint using the session cookie —
 * the browser never holds a channel secret.
 * Returns null when realtime is not configured (e.g. mock mode or missing app key).
 */
export function getEcho(): Echo<'reverb'> | null {
  if (echo) return echo
  if (env.isMock || !env.reverb.key) {
    realtimeStatus.value = 'unavailable'
    return null
  }

  ;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher
  realtimeStatus.value = 'connecting'

  echo = new Echo({
    broadcaster: 'reverb',
    key: env.reverb.key,
    wsHost: env.reverb.host,
    wsPort: env.reverb.port,
    wssPort: env.reverb.port,
    forceTLS: env.reverb.scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: AuthorizerCallback) => {
        http
          .post<Parameters<AuthorizerCallback>[1]>(env.reverb.authEndpoint, { socket_id: socketId, channel_name: channel.name }, { baseURL: env.apiBaseUrl })
          .then((res) => callback(null, res.data))
          .catch((err: Error) => callback(err, null))
      },
    }),
  })

  const connection = (echo.connector as unknown as { pusher: Pusher }).pusher.connection
  connection.bind('state_change', ({ current }: { current: string }) => {
    realtimeStatus.value =
      current === 'connected' ? 'connected' : current === 'connecting' ? 'connecting' : current === 'unavailable' || current === 'failed' ? 'unavailable' : 'disconnected'
  })

  return echo
}

/** Disconnects and forgets the client (call on logout so no channel outlives the session). */
export function disconnectEcho() {
  echo?.disconnect()
  echo = null
  realtimeStatus.value = 'idle'
}
