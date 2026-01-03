import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ArrowRightLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkillPost } from '@/types';
import { cn } from '@/lib/utils';

interface SkillPostCardProps {
  post: SkillPost;
  index?: number;
}

export function SkillPostCard({ post, index = 0 }: SkillPostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
  };

  return (
    <article
      className="bg-card rounded-2xl border overflow-hidden card-hover animate-slide-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/user/${post.user.username}`} className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={post.user.avatar} alt={post.user.displayName} />
            <AvatarFallback>{post.user.displayName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold hover:text-primary transition-colors">
              {post.user.displayName}
            </p>
            <p className="text-sm text-muted-foreground">@{post.user.username}</p>
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
            {post.skillOffered}
          </Badge>
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="bg-accent/20 text-accent border-0">
            {post.skillWanted}
          </Badge>
        </div>
      </div>

      {/* Image */}
      {post.image && (
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={post.image}
            alt={`${post.skillOffered} skill`}
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
          >
            <Heart
              className={cn(
                "h-6 w-6 transition-all",
                isLiked && "fill-accent text-accent scale-110"
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
        <p className="font-semibold mb-1">{likesCount.toLocaleString()} likes</p>
        <p className="text-sm">
          <Link to={`/user/${post.user.username}`} className="font-semibold hover:text-primary">
            {post.user.username}
          </Link>{' '}
          {post.description}
        </p>
        <button className="text-sm text-muted-foreground mt-2 hover:text-foreground transition-colors">
          View all {post.commentsCount} comments
        </button>
        <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wide">
          {post.createdAt}
        </p>
      </div>
    </article>
  );
}
