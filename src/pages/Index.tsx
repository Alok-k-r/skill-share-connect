import { Layout } from '@/components/layout/Layout';
import { SkillPostCard } from '@/components/posts/SkillPostCard';
import { SuggestedUsers } from '@/components/feed/SuggestedUsers';
import { TrendingSkills } from '@/components/feed/TrendingSkills';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function Index() {
  const { profile } = useAuth();
  const { data: posts, isLoading } = usePosts();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Banner - Desktop Only */}
            {profile && (
              <div className="hidden lg:block bg-card rounded-2xl border p-6 animate-fade-in">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-4 ring-primary/20">
                    <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name} />
                    <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold">
                      Welcome back, {profile.display_name.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-muted-foreground">
                      Ready to exchange some skills today?
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Posts */}
            <div className="space-y-6">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl border p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-48 w-full rounded-xl" />
                  </div>
                ))
              ) : posts && posts.length > 0 ? (
                posts.map((post, index) => (
                  <SkillPostCard key={post.id} post={post} index={index} />
                ))
              ) : (
                <div className="bg-card rounded-2xl border p-12 text-center">
                  <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
                  <p className="text-muted-foreground">
                    Be the first to share a skill exchange!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            {/* Current User Card */}
            {profile && (
              <div className="bg-card rounded-2xl border p-4">
                <Link to="/profile" className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name} />
                    <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{profile.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  </div>
                </Link>
              </div>
            )}

            <SuggestedUsers />
            <TrendingSkills />

            {/* Footer Links */}
            <div className="text-xs text-muted-foreground space-y-2 px-2">
              <div className="flex flex-wrap gap-2">
                <a href="#" className="hover:underline">About</a>
                <span>·</span>
                <a href="#" className="hover:underline">Help</a>
                <span>·</span>
                <a href="#" className="hover:underline">Privacy</a>
                <span>·</span>
                <a href="#" className="hover:underline">Terms</a>
              </div>
              <p>© 2024 SkillSwap. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
