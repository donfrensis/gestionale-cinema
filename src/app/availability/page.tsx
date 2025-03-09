//  src/app/availability/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options';
import AvailabilityCalendar from '@/components/Availability/AvailabilityCalendar'

export default async function AvailabilityPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  return (
    <main className="p-4">
      <AvailabilityCalendar isAdmin={!!session.user.isAdmin} />
    </main>
  )
}