import { requireAdmin } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Shield, User } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect if not admin
  const { user } = await requireAdmin();
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-8">
          {children}
        </div>
        {/* Admin Footer */}
        <footer className="bg-slate-800 text-white border-t border-slate-700">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-emerald-600 rounded-full">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-400">
                    Logged as Administrator
                  </p>
                  <p className="text-xs text-slate-400">
                    Admin Dashboard Access
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <User className="w-3 h-3" />
                <span>{user?.email}</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}