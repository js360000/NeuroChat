import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })

    socket.on('connect', () => {
      console.log('[WS] Connected:', socket?.id)
      // Register current user from stored auth
      try {
        const user = JSON.parse(localStorage.getItem('neurochat_user') || '{}')
        socket?.emit('register', user.id || 'anonymous')
      } catch {
        socket?.emit('register', 'anonymous')
      }
    })

    socket.on('disconnect', () => {
      console.log('[WS] Disconnected')
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
