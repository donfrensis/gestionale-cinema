//  src/app/(mobile)/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function MobileLayout({ children }) {
  return (
    <div className={`${inter.className} min-h-screen bg-gray-50`}>
      <header className="bg-blue-900 text-white p-4">
        <h1 className="text-xl font-bold">Cinema</h1>
      </header>
      {children}
    </div>
  )
}