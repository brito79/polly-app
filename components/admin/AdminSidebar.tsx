'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart3, 
  FileBarChart,
  Megaphone,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Polls', href: '/admin/polls', icon: FileBarChart },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
];

export function AdminSidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="w-64 bg-gray-900 text-white p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Portal</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your Polling App</p>
      </div>
      
      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}