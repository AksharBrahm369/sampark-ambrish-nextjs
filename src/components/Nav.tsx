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
        <div className="flex flex-col sm:flex-row justify-between py-2 sm:py-0 sm:h-16">
          <div className="flex items-center justify-center sm:justify-start py-2 sm:py-0">
            <span className="text-white font-bold text-lg sm:text-xl sm:mr-8 text-center sm:text-left whitespace-nowrap">Ambrish Sabha Attendance</span>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-start gap-1 pb-2 sm:pb-0 sm:items-center pt-1 sm:pt-0">
            {routes.map((route) => {
              const isActive = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`px-2 py-2 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
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
    </nav>
  );
}
