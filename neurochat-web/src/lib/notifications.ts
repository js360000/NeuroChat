// Push notification helpers

let swRegistration: ServiceWorkerRegistration | null = null

export async function registerServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js')
    console.log('[SW] Registered:', swRegistration.scope)
    return true
  } catch (err) {
    console.warn('[SW] Registration failed:', err)
    return false
  }
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showLocalNotification(title: string, body: string, url?: string) {
  if (!swRegistration || Notification.permission !== 'granted') return

  swRegistration.showNotification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: `local-${Date.now()}`,
    data: { url: url || '/messages' },
  } as NotificationOptions)
}

// Show a browser Notification (fallback if SW is unavailable)
export function showFallbackNotification(title: string, body: string, url?: string) {
  if (Notification.permission !== 'granted') return
  const n = new Notification(title, {
    body,
    icon: '/favicon.svg',
    tag: `fb-${Date.now()}`,
  })
  n.onclick = () => {
    window.focus()
    if (url) window.location.href = url
    n.close()
  }
}
