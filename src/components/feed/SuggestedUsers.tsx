import { Link } from 'react-router-dom';
import { users } from '@/data/mockData';
import { UserCard } from '@/components/users/UserCard';

export function SuggestedUsers() {
  const suggestedUsers = users.filter(u => !u.isFollowing).slice(0, 3);

  return (
    <div className="bg-card rounded-2xl border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Suggested for you</h3>
        <Link to="/explore" className="text-sm text-primary hover:underline">
          See all
        </Link>
      </div>
      <div className="space-y-1">
        {suggestedUsers.map((user) => (
          <UserCard key={user.id} user={user} compact />
        ))}
      </div>
    </div>
  );
}
