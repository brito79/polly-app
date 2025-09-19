'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
    MoreHorizontal, 
    Shield, 
    User, 
    Trash2, 
    Mail,
    Ban,
    CheckCircle,
} from 'lucide-react';
import { updateUserRole } from '@/lib/actions/admin/users';

interface Profile {
    id: string;
    user_id: string;
    username: string;
    full_name?: string;
    email?: string;
    role: string;
    created_at: string;
    avatar_url?: string;
}

interface UserManagementTableProps {
    users: Profile[];
}

export function UserManagementTable({ users }: UserManagementTableProps) {
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    
    const handleRoleChange = async (userId: string, role: 'admin' | 'user') => {
        setLoading((prev) => ({ ...prev, [userId]: true }));
        
        try {
            await updateUserRole(userId, role);
            // We could show a toast notification here
        } catch (error) {
            console.error('Error updating user role:', error);
            // We could show an error toast here
        } finally {
            setLoading((prev) => ({ ...prev, [userId]: false }));
        }
    };
    
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 relative overflow-hidden">
                                        {user.avatar_url ? (
                                            <Image
                                                src={user.avatar_url} 
                                                alt={user.full_name || user.username}
                                                fill
                                                className="object-cover"
                                                sizes="40px"
                                            />
                                        ) : (
                                            <span className="text-gray-600 font-semibold">
                                                {(user.full_name || user.username || '?').charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium">{user.full_name || user.username}</div>
                                        <div className="text-xs text-gray-500">@{user.username}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{user.email || 'Not provided'}</TableCell>
                            <TableCell>
                                <div className="flex items-center">
                                    {user.role === 'admin' ? (
                                        <Shield className="h-4 w-4 mr-1 text-blue-500" />
                                    ) : (
                                        <User className="h-4 w-4 mr-1 text-gray-500" />
                                    )}
                                    <span className={`capitalize ${user.role === 'admin' ? 'text-blue-600 font-medium' : ''}`}>
                                        {user.role}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {user.role === 'admin' ? (
                                            <DropdownMenuItem
                                                onClick={() => handleRoleChange(user.user_id, 'user')}
                                                disabled={loading[user.user_id]}
                                                className="text-amber-600"
                                            >
                                                <User className="h-4 w-4 mr-2" />
                                                Remove Admin Role
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem
                                                onClick={() => handleRoleChange(user.user_id, 'admin')}
                                                disabled={loading[user.user_id]}
                                                className="text-blue-600"
                                            >
                                                <Shield className="h-4 w-4 mr-2" />
                                                Make Admin
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem>
                                            <Mail className="h-4 w-4 mr-2" />
                                            Email User (Coming Soon)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" disabled>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Account (Coming Soon)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" disabled>
                                            <Ban className="h-4 w-4 mr-2" />
                                            Suspend Account (Coming Soon)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-green-600" disabled>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Verify Account (Coming Soon)
                                        </DropdownMenuItem>                  </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}