'use client'
// src/components/Public/NotificationToggle.tsx

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import {
  isPushNotificationSupported,
  askPermission,
  getSubscription,
  urlBase64ToUint8Array,
} from '@/lib/push-client'

export default function NotificationToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  // Al mount: verifica se c'è già una subscription attiva
  useEffect(() => {
    if (!isPushNotificationSupported()) {
      setLoading(false)
      return
    }
    getSubscription()
      .then(sub => setIsSubscribed(!!sub))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!isPushNotificationSupported()) return null

  const handleToggle = async () => {
    setLoading(true)
    try {
      if (isSubscribed) {
        // Disattiva
        const sub = await getSubscription()
        if (sub) {
          await fetch('/api/public/push/subscription', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
        }
        setIsSubscribed(false)
      } else {
        // Attiva: richiedi permesso → registra SW → subscribe
        const granted = await askPermission()
        if (!granted) return

        let registration = await navigator.serviceWorker.getRegistration()
        if (!registration) {
          registration = await navigator.serviceWorker.register('/sw-cinema.js')
          await new Promise(resolve => setTimeout(resolve, 2000))
          registration = await navigator.serviceWorker.getRegistration()
        }

        if (!registration) throw new Error('Service Worker non disponibile')

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        })

        await fetch('/api/public/push/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        })

        setIsSubscribed(true)
      }
    } catch (err) {
      console.error('Errore toggle notifiche pubbliche:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={isSubscribed ? 'Notifiche attive — tocca per disattivare' : 'Notifiche disattivate — tocca per attivare'}
      title={isSubscribed ? 'Notifiche attive — tocca per disattivare' : 'Notifiche disattivate — tocca per attivare'}
      style={{
        background: 'none',
        border: 'none',
        cursor: loading ? 'default' : 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        flexShrink: 0,
      }}
    >
      {loading ? (
        <Loader2 size={20} color="#9ca3af" className="animate-spin" />
      ) : isSubscribed ? (
        <Bell size={20} color="#D4AF37" />
      ) : (
        <BellOff size={20} color="#9ca3af" />
      )}
    </button>
  )
}
