import { Layout } from '@/components/layout/Layout';
import { SkillPostCard } from '@/components/posts/SkillPostCard';
import { SuggestedUsers } from '@/components/feed/SuggestedUsers';
import { TrendingSkills } from '@/components/feed/TrendingSkills';
import { skillPosts, currentUser } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

export default function Index() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Banner - Desktop Only */}
            <div className="hidden lg:block bg-card rounded-2xl border p-6 animate-fade-in">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-4 ring-primary/20">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
                  <AvatarFallback>{currentUser.displayName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">
                    Welcome back, {currentUser.displayName.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-muted-foreground">
                    Ready to exchange some skills today?
                  </p>
                </div>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-6">
              {skillPosts.map((post, index) => (
                <SkillPostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            {/* Current User Card */}
            <div className="bg-card rounded-2xl border p-4">
              <Link to="/profile" className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
                  <AvatarFallback>{currentUser.displayName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{currentUser.displayName}</p>
                  <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
                </div>
              </Link>
              <div className="flex items-center gap-6 mt-4 pt-4 border-t text-sm">
                <div className="text-center">
                  <p className="font-semibold">{currentUser.postsCount}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{currentUser.followersCount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{currentUser.followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>
            </div>

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
