//  src/app/availability/layout.tsx
import { Inter } from 'next/font/google'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const inter = Inter({ subsets: ['latin'] })

export default async function AvailabilityLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className={`${inter.className} min-h-screen bg-gray-50`}>
      <header className="bg-blue-900 text-white p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
        <h1 className="text-xl font-bold">Cinema</h1>
        <div className="flex items-center space-x-2">
          <Link href="/profile">
            <Button variant="secondary" className="p-0 h-10 w-10">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <form action="/api/auth/signout" method="POST">
            <Button variant="secondary" className="p-0 h-10 w-10">
              <LogOut className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </header>
      
      <main className="p-4 mt-16 pb-20">
        {children}
      </main>
    </div>
  )
}