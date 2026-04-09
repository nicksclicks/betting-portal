import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { UserManagementMobileCard } from './UserManagementMobileCard';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [addingUser, setAddingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const adminUser = data.find(u => u.role === 'admin') || data[0];
        setCurrentUser(adminUser);
        setUsers(data);
      } else {
        const defaultAdmin: UserData = {
          id: 'default-admin',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          created_at: new Date().toISOString(),
        };
        setCurrentUser(defaultAdmin);
        setUsers([defaultAdmin]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      const defaultAdmin: UserData = {
        id: 'default-admin',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        created_at: new Date().toISOString(),
      };
      setCurrentUser(defaultAdmin);
      setUsers([defaultAdmin]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    setAddingUser(true);
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
        });

      if (error) throw error;

      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('user');
      setShowAddUser(false);
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (userId === currentUser?.id) return;

    setDeletingUserId(userId);
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error removing user:', error);
    } finally {
      setDeletingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isAdmin = currentUser?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">Settings</h1>
        <p className="text-neutral-400 text-sm md:text-base">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="feature-icon">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Profile Information</h2>
              <p className="text-neutral-500 text-sm">Your account details</p>
            </div>
          </div>

          {currentUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <User className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Name</p>
                  <p className="text-white font-medium">{currentUser.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <Mail className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Email</p>
                  <p className="text-white font-medium">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <Calendar className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Member Since</p>
                  <p className="text-white font-medium">{formatDate(currentUser.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <Shield className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Role</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    currentUser.role === 'admin'
                      ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {currentUser.role === 'admin' ? 'Administrator' : 'User'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="card">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="feature-icon shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-white">User Management</h2>
                  <p className="text-neutral-500 text-sm">Add or remove users from the system</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUser(!showAddUser)}
                className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            </div>

            {showAddUser && (
              <div className="mb-6 p-5 bg-neutral-900 border border-neutral-800 rounded-xl">
                <h3 className="text-white font-medium mb-4">Add New User</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="label">Name</label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="input-field"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="input-field"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="label">Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                      className="select-field"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddUser}
                    disabled={addingUser || !newUserName.trim() || !newUserEmail.trim()}
                    className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    {addingUser ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add User'
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="md:hidden border-t border-neutral-800 -mx-4 px-4 sm:-mx-6 sm:px-6">
              {users.map((user) => (
                <UserManagementMobileCard
                  key={user.id}
                  user={user}
                  currentUserId={currentUser?.id ?? null}
                  deletingUserId={deletingUserId}
                  onRemove={handleRemoveUser}
                />
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:thin]">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left py-3 px-3 text-xs font-medium text-neutral-500">Name</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-neutral-500">Email</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-neutral-500">Role</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-neutral-500">Member Since</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-neutral-800/50">
                      <td className="py-3 px-3 text-sm text-white">{user.name}</td>
                      <td className="py-3 px-3 text-sm text-neutral-400">{user.email}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-neutral-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {user.id !== currentUser?.id && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(user.id)}
                            disabled={deletingUserId === user.id}
                            className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            {deletingUserId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
