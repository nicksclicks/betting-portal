import { Loader2, Trash2 } from 'lucide-react';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

interface UserManagementMobileCardProps {
  user: ManagedUser;
  currentUserId: string | null;
  deletingUserId: string | null;
  onRemove: (userId: string) => void;
}

function formatMemberSince(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function UserManagementMobileCard({
  user,
  currentUserId,
  deletingUserId,
  onRemove,
}: UserManagementMobileCardProps) {
  const isSelf = user.id === currentUserId;

  return (
    <article className="py-4 border-b border-neutral-800 last:border-b-0">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">{user.name}</h3>
          <p className="text-xs text-neutral-400 break-all mt-1">{user.email}</p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            user.role === 'admin'
              ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20'
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}
        >
          {user.role === 'admin' ? 'Admin' : 'User'}
        </span>
      </div>

      <p className="text-xs text-neutral-500 mb-3">Member since {formatMemberSince(user.created_at)}</p>

      {!isSelf && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onRemove(user.id)}
            disabled={deletingUserId === user.id}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-neutral-800 hover:border-red-500/30 transition-colors disabled:opacity-50"
            title="Remove user"
          >
            {deletingUserId === user.id ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </button>
        </div>
      )}
    </article>
  );
}
