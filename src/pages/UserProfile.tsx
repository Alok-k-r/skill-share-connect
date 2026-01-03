import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Grid3X3, MessageCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkillPostCard } from '@/components/posts/SkillPostCard';
import { users, skillPosts } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

export default function UserProfile() {
  const { username } = useParams();
  const user = users.find(u => u.username === username) || users[0];
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);

  const userPosts = skillPosts.filter(p => p.user.id === user.id);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Unfollowed" : "Following!",
      description: isFollowing
        ? `You unfollowed ${user.displayName}`
        : `You're now following ${user.displayName}`,
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-card rounded-2xl border p-6 mb-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-primary/20">
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback className="text-3xl">{user.displayName[0]}</AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-4">
                <h1 className="text-2xl font-bold">{user.displayName}</h1>
                <div className="flex gap-2">
                  <Button
                    variant={isFollowing ? "outline" : "gradient"}
                    onClick={handleFollow}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6 mb-4">
                <div className="text-center sm:text-left">
                  <p className="font-bold text-xl">{user.postsCount}</p>
                  <p className="text-sm text-muted-foreground">posts</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-bold text-xl">{user.followersCount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">followers</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-bold text-xl">{user.followingCount}</p>
                  <p className="text-sm text-muted-foreground">following</p>
                </div>
              </div>

              {/* Bio */}
              <p className="text-muted-foreground mb-4">@{user.username}</p>
              <p className="mb-4">{user.bio}</p>

              {/* Skills */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Skills they teach</p>
                  <div className="flex flex-wrap gap-2">
                    {user.skillsTeaching.map((skill) => (
                      <Badge key={skill} className="gradient-primary text-primary-foreground border-0">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Skills they want to learn</p>
                  <div className="flex flex-wrap gap-2">
                    {user.skillsLearning.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b">
            <Grid3X3 className="h-5 w-5" />
            <h2 className="font-semibold">Posts</h2>
          </div>

          {userPosts.length > 0 ? (
            <div className="space-y-6">
              {userPosts.map((post, index) => (
                <SkillPostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                {user.displayName} hasn't shared any skills yet
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
