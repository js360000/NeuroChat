import { useEffect, useState } from 'react';
import { Search, Filter, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { adminApi, type AdminUser } from '@/lib/api/admin';
import { toast } from 'sonner';

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    try {
      const response = await adminApi.getUsers({ 
        limit: 50, 
        search: search || undefined 
      });
      setUsers(response.users);
      setTotal(response.total);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-neutral-500">{total} total users</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">User</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Role</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Plan</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Joined</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role || 'user'}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge variant={user.subscription.plan === 'free' ? 'secondary' : 'default'}>
                    {user.subscription.plan}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-neutral-300'}`} />
                    <span className="text-sm">{user.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-neutral-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
