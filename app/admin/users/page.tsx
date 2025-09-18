import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { UserManagementTable } from '@/components/admin/UserManagementTable';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  // This will redirect if not admin
  await requireAdmin();
  
  // Get all users
  const supabase = await createSupabaseServerClient();
  
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Failed to fetch users:', error);
    // Consider showing an error state to the user
    return (
      <div>
        <h1 className="text-3xl font-bold mb-4">User Management</h1>
        <p className="text-red-500">Failed to load users. Please try again later.</p>
      </div>
    );
  }  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>
      
      <p className="text-gray-500 mb-6">
        Manage user accounts, assign roles, and control user access.
      </p>
      
      <UserManagementTable users={users || []} />
    </div>
  );
}