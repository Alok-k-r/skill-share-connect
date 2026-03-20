import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileWithStats } from '@/hooks/useProfiles';
import { useFollowUser } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface UserCardProps {
  profile: ProfileWithStats;
  compact?: boolean;
}

export function UserCard({ profile, compact = false }: UserCardProps) {
  const { user } = useAuth();
  const followMutation = useFollowUser();

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    followMutation.mutate(
      { followerId: user.id, followingId: profile.id, isFollowing: profile.is_following },
      {
        onSuccess: () => {
          toast({
            title: profile.is_following ? "Unfollowed" : "Following!",
            description: profile.is_following
              ? `You unfollowed ${profile.display_name}`
              : `You're now following ${profile.display_name}`,
          });
        },
      }
    );
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
        <Link to={`/user/${profile.username}`} className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/10">
            <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name} />
            <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{profile.display_name}</p>
            <p className="text-xs text-muted-foreground">@{profile.username}</p>
          </div>
        </Link>
        {user && user.id !== profile.id && (
          <Button
            variant={profile.is_following ? "outline" : "default"}
            size="sm"
            onClick={handleFollow}
            disabled={followMutation.isPending}
          >
            {profile.is_following ? 'Following' : 'Follow'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border p-4 card-hover">
      <div className="flex items-start gap-4">
        <Link to={`/user/${profile.username}`}>
          <Avatar className="h-14 w-14 ring-2 ring-primary/20">
            <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name} />
            <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/user/${profile.username}`}>
            <h3 className="font-semibold hover:text-primary transition-colors">{profile.display_name}</h3>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </Link>
          <p className="text-sm mt-2 line-clamp-2">{profile.bio}</p>
        </div>
        {user && user.id !== profile.id && (
          <Button
            variant={profile.is_following ? "outline" : "gradient"}
            size="sm"
            onClick={handleFollow}
            disabled={followMutation.isPending}
          >
            {profile.is_following ? 'Following' : 'Follow'}
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Teaching</p>
          <div className="flex flex-wrap gap-1">
            {profile.skills_teaching.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Learning</p>
          <div className="flex flex-wrap gap-1">
            {profile.skills_learning.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-4 pt-4 border-t text-sm">
        <div>
          <span className="font-semibold">{profile.followers_count.toLocaleString()}</span>{' '}
          <span className="text-muted-foreground">followers</span>
        </div>
        <div>
          <span className="font-semibold">{profile.posts_count}</span>{' '}
          <span className="text-muted-foreground">posts</span>
        </div>
      </div>
    </div>
  );
}
