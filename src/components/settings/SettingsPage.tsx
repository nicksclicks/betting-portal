import { useState, useEffect, useCallback } from 'react';
import { Shield, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserManagementMobileCard } from './UserManagementMobileCard';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

function roleLabel(role: 'admin' | 'user') {
  return role === 'admin' ? 'Admin' : 'Basic';
}

export function SettingsPage() {
  const { profile, refreshProfile, isAdmin, isLocalMock } = useAuth();
  const currentUser = profile;

  const [users, setUsers] = useState<UserData[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [addingUser, setAddingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);

  const [editName, setEditName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    setEditName(currentUser.name);
  }, [currentUser]);

  const fetchUsersList = useCallback(async () => {
    if (!isAdmin || isLocalMock) {
      setUsers([]);
      return;
    }
    setListLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setUsers((data as UserData[]) ?? []);
    } catch (e) {
      console.error('Error fetching users:', e);
      setUsers([]);
    } finally {
      setListLoading(false);
    }
  }, [isAdmin, isLocalMock]);

  useEffect(() => {
    void fetchUsersList();
  }, [fetchUsersList, currentUser?.id]);

  const handleAddUser = async () => {
    setAdminActionError(null);

    if (isLocalMock) {
      setAdminActionError(
        'Inviting users needs a real Supabase project. Set VITE_LOCAL_MOCK=false in .env and restart the dev server.'
      );
      return;
    }
    if (!newUserName.trim()) {
      setAdminActionError('Please enter a name.');
      return;
    }
    if (!newUserEmail.trim()) {
      setAdminActionError('Please enter an email.');
      return;
    }
    if (!newUserPassword) {
      setAdminActionError('Please enter a temporary password.');
      return;
    }

    setAddingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ error?: string }>('admin-invite-user', {
        body: {
          email: newUserEmail.trim(),
          password: newUserPassword,
          name: newUserName.trim(),
          role: newUserRole,
        },
      });

      if (error) {
        setAdminActionError(error.message);
        return;
      }
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        setAdminActionError(String(data.error));
        return;
      }

      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setShowAddUser(false);
      await fetchUsersList();
    } catch (e) {
      console.error('Error adding user:', e);
      setAdminActionError('Could not create user. Deploy admin-invite-user and check logs.');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (userId === currentUser?.id) return;

    setDeletingUserId(userId);
    setAdminActionError(null);
    try {
      const { data, error } = await supabase.functions.invoke<{ error?: string }>('admin-delete-user', {
        body: { userId },
      });

      if (error) {
        setAdminActionError(error.message);
        return;
      }
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        setAdminActionError(String(data.error));
        return;
      }

      await fetchUsersList();
    } catch (e) {
      console.error('Error removing user:', e);
      setAdminActionError('Could not remove user. Deploy admin-delete-user and check logs.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setProfileError(null);
    setProfileMessage(null);

    if (isLocalMock) {
      setProfileMessage('Profile editing is not persisted in local mock mode.');
      return;
    }

    setSavingProfile(true);
    try {
      const name = editName.trim();
      if (!name) {
        setProfileError('Name is required.');
        return;
      }

      const { error: dbErr } = await supabase
        .from('users')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', currentUser.id);

      if (dbErr) {
        setProfileError(dbErr.message);
        return;
      }

      setProfileMessage('Profile updated.');
      await refreshProfile();
    } finally {
      setSavingProfile(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!currentUser) {
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
          <h2 className="text-lg font-semibold text-white text-center mb-6">Profile Information</h2>

          <div className="max-w-xl mx-auto w-full space-y-6">
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="profile-name">
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field"
                  autoComplete="name"
                />
              </div>
            </div>

            {profileError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {profileError}
              </p>
            )}
            {profileMessage && (
              <p className="text-sm text-lime-400 bg-lime-500/10 border border-lime-500/20 rounded-lg px-3 py-2">
                {profileMessage}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm min-w-0">
                <span className="text-xs text-neutral-500">Member since</span>
                <span className="text-white font-medium">{formatDate(currentUser.created_at)}</span>
              </div>
              <button
                type="button"
                onClick={() => void handleSaveProfile()}
                disabled={savingProfile}
                className="self-end sm:self-auto shrink-0 rounded-full border border-lime-500/30 bg-black px-4 py-2 text-sm font-medium text-lime-400 transition-colors hover:border-lime-400/50 disabled:pointer-events-none disabled:opacity-40"
              >
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
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
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUser(!showAddUser)}
                className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                Invite user
              </button>
            </div>

            {adminActionError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
                {adminActionError}
              </p>
            )}

            {showAddUser && (
              <div className="mb-6 p-5 bg-neutral-900 border border-neutral-800 rounded-xl">
                <h3 className="text-white font-medium mb-4">Invite user</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                    <label className="label">Temporary password</label>
                    <input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="input-field"
                      placeholder="Temporary password"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="label">Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                      className="select-field"
                    >
                      <option value="user">Basic</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="relative z-10 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pb-2 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleAddUser()}
                    disabled={addingUser}
                    className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingUser ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      'Create user'
                    )}
                  </button>
                </div>
              </div>
            )}

            {listLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
              </div>
            ) : (
              <>
                <div className="md:hidden border-t border-neutral-800 -mx-4 px-4 sm:-mx-6 sm:px-6">
                  {users.map((user) => (
                    <UserManagementMobileCard
                      key={user.id}
                      user={user}
                      currentUserId={currentUser?.id ?? null}
                      deletingUserId={deletingUserId}
                      onRemove={handleRemoveUser}
                      roleLabel={roleLabel}
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
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin'
                                  ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}
                            >
                              {roleLabel(user.role)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-sm text-neutral-400">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {user.id !== currentUser?.id && (
                              <button
                                type="button"
                                onClick={() => void handleRemoveUser(user.id)}
                                disabled={deletingUserId === user.id || isLocalMock}
                                className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Remove user"
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
