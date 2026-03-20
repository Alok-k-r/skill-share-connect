import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ArrowRightLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PostWithProfile } from '@/hooks/usePosts';
import { useToggleLike } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SkillPostCardProps {
  post: PostWithProfile;
  index?: number;
}

export function SkillPostCard({ post, index = 0 }: SkillPostCardProps) {
  const { user } = useAuth();
  const toggleLike = useToggleLike();
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    if (!user) return;
    toggleLike.mutate({ postId: post.id, userId: user.id, isLiked: post.is_liked });
  };

  return (
    <article
      className="bg-card rounded-2xl border overflow-hidden card-hover animate-slide-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/user/${post.profiles.username}`} className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={post.profiles.avatar_url || ''} alt={post.profiles.display_name} />
            <AvatarFallback>{post.profiles.display_name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold hover:text-primary transition-colors">
              {post.profiles.display_name}
            </p>
            <p className="text-sm text-muted-foreground">@{post.profiles.username}</p>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Skill Exchange Banner */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10">
          <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
            {post.skill_offered}
          </Badge>
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="bg-accent/20 text-accent border-0">
            {post.skill_wanted}
          </Badge>
        </div>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={post.image_url}
            alt={`${post.skill_offered} skill`}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleLike}
            disabled={!user}
          >
            <Heart
              className={cn(
                "h-6 w-6 transition-all",
                post.is_liked && "fill-accent text-accent scale-110"
              )}
            />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MessageCircle className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Share2 className="h-6 w-6" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setIsSaved(!isSaved)}
        >
          <Bookmark
            className={cn(
              "h-6 w-6 transition-all",
              isSaved && "fill-foreground"
            )}
          />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="font-semibold mb-1">{post.likes_count.toLocaleString()} likes</p>
        <p className="text-sm">
          <Link to={`/user/${post.profiles.username}`} className="font-semibold hover:text-primary">
            {post.profiles.username}
          </Link>{' '}
          {post.description}
        </p>
        <button className="text-sm text-muted-foreground mt-2 hover:text-foreground transition-colors">
          View all {post.comments_count} comments
        </button>
        <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wide">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </p>
      </div>
    </article>
  );
}
