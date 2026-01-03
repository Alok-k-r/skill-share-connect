import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';

interface UserCardProps {
  user: User;
  compact?: boolean;
}

export function UserCard({ user, compact = false }: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Unfollowed" : "Following!",
      description: isFollowing
        ? `You unfollowed ${user.displayName}`
        : `You're now following ${user.displayName}`,
    });
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
        <Link to={`/user/${user.username}`} className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/10">
            <AvatarImage src={user.avatar} alt={user.displayName} />
            <AvatarFallback>{user.displayName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{user.displayName}</p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </Link>
        <Button
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          onClick={handleFollow}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border p-4 card-hover">
      <div className="flex items-start gap-4">
        <Link to={`/user/${user.username}`}>
          <Avatar className="h-14 w-14 ring-2 ring-primary/20">
            <AvatarImage src={user.avatar} alt={user.displayName} />
            <AvatarFallback>{user.displayName[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/user/${user.username}`}>
            <h3 className="font-semibold hover:text-primary transition-colors">
              {user.displayName}
            </h3>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </Link>
          <p className="text-sm mt-2 line-clamp-2">{user.bio}</p>
        </div>
        <Button
          variant={isFollowing ? "outline" : "gradient"}
          size="sm"
          onClick={handleFollow}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Teaching</p>
          <div className="flex flex-wrap gap-1">
            {user.skillsTeaching.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Learning</p>
          <div className="flex flex-wrap gap-1">
            {user.skillsLearning.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-4 pt-4 border-t text-sm">
        <div>
          <span className="font-semibold">{user.followersCount.toLocaleString()}</span>{' '}
          <span className="text-muted-foreground">followers</span>
        </div>
        <div>
          <span className="font-semibold">{user.postsCount}</span>{' '}
          <span className="text-muted-foreground">posts</span>
        </div>
      </div>
    </div>
  );
}
