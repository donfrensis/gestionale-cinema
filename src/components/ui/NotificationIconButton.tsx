'use client'
// Pulsante notifiche icon-only per la navbar availability
import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { isPushNotificationSupported, getSubscription, subscribeToPush, unsubscribeFromPush, syncSubscription } from '@/lib/push-client'
import { toast } from '@/components/ui/use-toast'

export default function NotificationIconButton() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isPushNotificationSupported()) { setIsLoading(false); return }
    const sub = getSubscription()
    const timeout = new Promise<null>((_, r) => setTimeout(() => r(null), 3000))
    Promise.race([sub, timeout])
      .then(s => {
        setIsSubscribed(!!s)
        if (s) syncSubscription().catch(() => {})
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (!isPushNotificationSupported()) return null

  const toggle = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      if (isSubscribed) {
        await unsubscribeFromPush()
        setIsSubscribed(false)
        toast({ title: 'Notifiche disattivate', description: 'Non riceverai più notifiche push da questo dispositivo.' })
      } else {
        await subscribeToPush()
        setIsSubscribed(true)
        toast({ title: 'Notifiche attivate', description: 'Riceverai notifiche push su questo dispositivo.' })
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Errore', description: error instanceof Error ? error.message : 'Impossibile gestire le notifiche' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={isLoading}
      title={isSubscribed ? 'Notifiche attive — tocca per disattivare' : 'Notifiche disattivate — tocca per attivare'}
      className="p-0 h-10 w-10 flex items-center justify-center bg-transparent border-0 cursor-pointer disabled:cursor-default"
    >
      {isLoading
        ? <Loader2 className="h-5 w-5 text-white animate-spin" />
        : isSubscribed
          ? <Bell className="h-5 w-5 text-yellow-400" />
          : <BellOff className="h-5 w-5 text-white" />}
    </button>
  )
}
