'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Nav() {
  const pathname = usePathname();

  const routes = [
    { href: '/', label: 'Dashboard' },
    { href: '/attendance', label: 'Mark Attendance' },
    { href: '/history', label: 'History' },
  ];

  return (
    <nav className="bg-indigo-600 dark:bg-indigo-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-white font-bold text-xl mr-8">Ambrish Sabha Attendance</span>
            <div className="hidden sm:flex space-x-1">
              {routes.map((route) => {
                const isActive = pathname === route.href;
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-indigo-800 text-white' 
                        : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                    }`}
                  >
                    {route.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
