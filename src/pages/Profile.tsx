import { Settings, Grid3X3, Bookmark, Heart, Edit2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkillPostCard } from '@/components/posts/SkillPostCard';
import { useAuth } from '@/hooks/useAuth';
import { useUserPosts } from '@/hooks/usePosts';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function Profile() {
  const { profile, user } = useAuth();
  const { data: userPosts, isLoading } = useUserPosts(user?.id);

  const { data: stats } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.rpc('get_profile_stats', { profile_id: user.id });
      return data as { followers_count: number; following_count: number; posts_count: number } | null;
    },
    enabled: !!user,
  });

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-2">Not logged in</h1>
          <p className="text-muted-foreground">Sign in to view your profile</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-card rounded-2xl border p-6 mb-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <Avatar className="h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-primary/20">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name} />
                <AvatarFallback className="text-3xl">{profile.display_name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-1 right-1 w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-md">
                <Edit2 className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-4">
                <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                <div className="flex gap-2">
                  <Button variant="gradient" size="sm">Edit Profile</Button>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-6 mb-4">
                <div className="text-center sm:text-left">
                  <p className="font-bold text-xl">{stats?.posts_count || 0}</p>
                  <p className="text-sm text-muted-foreground">posts</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-bold text-xl">{(stats?.followers_count || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">followers</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-bold text-xl">{stats?.following_count || 0}</p>
                  <p className="text-sm text-muted-foreground">following</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-4">@{profile.username}</p>
              <p className="mb-4">{profile.bio}</p>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Skills I teach</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills_teaching.map((skill) => (
                      <Badge key={skill} className="gradient-primary text-primary-foreground border-0">{skill}</Badge>
                    ))}
                    {profile.skills_teaching.length === 0 && (
                      <p className="text-sm text-muted-foreground">No skills added yet</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Skills I want to learn</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills_learning.map((skill) => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                    {profile.skills_learning.length === 0 && (
                      <p className="text-sm text-muted-foreground">No skills added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="posts" className="animate-slide-up">
          <TabsList className="w-full justify-start mb-6 bg-card border">
            <TabsTrigger value="posts" className="flex-1 sm:flex-none gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 sm:flex-none gap-2">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex-1 sm:flex-none gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Liked</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            {isLoading ? (
              <Skeleton className="h-48 rounded-2xl" />
            ) : userPosts && userPosts.length > 0 ? (
              userPosts.map((post, index) => (
                <SkillPostCard key={post.id} post={post} index={index} />
              ))
            ) : (
              <div className="text-center py-12">
                <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
                <p className="text-muted-foreground">Create your first skill exchange post!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No saved posts yet</h2>
              <p className="text-muted-foreground">Posts you save will appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="liked">
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No liked posts yet</h2>
              <p className="text-muted-foreground">Posts you like will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
