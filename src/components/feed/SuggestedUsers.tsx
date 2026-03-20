import { Link } from 'react-router-dom';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { UserCard } from '@/components/users/UserCard';
import { Skeleton } from '@/components/ui/skeleton';

export function SuggestedUsers() {
  const { user } = useAuth();
  const { data: profiles, isLoading } = useProfiles();

  const suggestedUsers = profiles
    ?.filter(p => p.id !== user?.id && !p.is_following)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!suggestedUsers || suggestedUsers.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Suggested for you</h3>
        <Link to="/explore" className="text-sm text-primary hover:underline">See all</Link>
      </div>
      <div className="space-y-1">
        {suggestedUsers.map((profile) => (
          <UserCard key={profile.id} profile={profile} compact />
        ))}
      </div>
    </div>
  );
}
