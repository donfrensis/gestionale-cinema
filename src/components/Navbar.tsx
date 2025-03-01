// src/components/Navbar.tsx
'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
 // Home, 
 Calendar, 
 Users, 
 Film, 
 TvMinimalPlay,
 LogOut,
 LayoutDashboard,
 FileText,
 Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

type NavigationItem = {
 name: string;
 href: string;
 icon: React.ElementType;
};

export default function Navbar() {
 const { data: session } = useSession();
 const pathname = usePathname();

 // Se l'utente non è autenticato o siamo nella pagina di login, non mostrare la navbar
 if (!session || pathname === '/login') {
   return null;
 }

 const navigation: NavigationItem[] = [
   // { name: 'Home', href: '/', icon: Home },
   { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
   ...(session.user?.isAdmin ? [
     { name: 'Shows', href: '/shows', icon: TvMinimalPlay },
     { name: 'Films', href: '/films', icon: Film },
     { name: 'Users', href: '/users', icon: Users },
     { name: 'Reports', href: '/reports', icon: FileText },
     { name: 'Prel./Vers.', href: '/withdrawals', icon: Banknote },
   ] : []),
   { name: 'Availability', href: '/availability', icon: Calendar },
 ];

 const handleLogout = () => {
   signOut({
     callbackUrl: `${window.location.origin}/login`
   });
 };

 return (
   <nav className="bg-white shadow">
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       <div className="flex justify-between h-16">
         <div className="flex">
           <div className="flex-shrink-0 flex items-center">
             <span className="text-xl font-bold">Gestione Cassa</span>
           </div>
           <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
             {navigation.map((item) => {
               const Icon = item.icon;
               return (
                 <Link
                   key={item.name}
                   href={item.href}
                   className={`
                     inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                     ${pathname === item.href
                       ? 'border-indigo-500 text-gray-900'
                       : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                     }
                   `}
                 >
                   <Icon className="h-4 w-4 mr-2" />
                   {item.name}
                 </Link>
               );
             })}
           </div>
         </div>
         <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
           <span className="text-sm text-gray-500">
             {session.user?.username}
           </span>
           <Button
             variant="outline"
             size="sm"
             className="gap-2"
             onClick={handleLogout}
           >
             <LogOut className="h-4 w-4" />
             Logout
           </Button>
         </div>
       </div>
     </div>

     {/* Mobile menu */}
     <div className="sm:hidden">
       <div className="pt-2 pb-3 space-y-1">
         {navigation.map((item) => {
           const Icon = item.icon;
           return (
             <Link
               key={item.name}
               href={item.href}
               className={`
                 flex items-center px-3 py-2 text-base font-medium
                 ${pathname === item.href
                   ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                   : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                 }
               `}
             >
               <Icon className="h-4 w-4 mr-2" />
               {item.name}
             </Link>
           );
         })}
         <div className="flex items-center justify-between px-3 py-2">
           <span className="text-sm text-gray-500">
             {session.user?.username}
           </span>
           <Button
             variant="outline"
             size="sm"
             className="gap-2"
             onClick={handleLogout}
           >
             <LogOut className="h-4 w-4" />
             Logout
           </Button>
         </div>
       </div>
     </div>
   </nav>
 );
}