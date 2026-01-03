import { useState } from 'react';
import { Settings, Grid3X3, Bookmark, Heart, Edit2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkillPostCard } from '@/components/posts/SkillPostCard';
import { currentUser, skillPosts } from '@/data/mockData';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('posts');

  const userPosts = skillPosts.slice(0, 2);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-card rounded-2xl border p-6 mb-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-primary/20">
                <AvatarImage src={currentUser.avatar} alt={currentUser.displayName} />
                <AvatarFallback className="text-3xl">{currentUser.displayName[0]}</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-1 right-1 w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-md">
                <Edit2 className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-4">
                <h1 className="text-2xl font-bold">{currentUser.displayName}</h1>
                <div className="flex gap-2">
                  <Button variant="gradient" size="sm">
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6 mb-4">
                <div className="text-center sm:text-left">
                  <p className="font-bold text-xl">{currentUser.postsCount}</p>
                  <p className="text-sm text-muted-foreground">posts</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-bold text-xl">{currentUser.followersCount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">followers</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-bold text-xl">{currentUser.followingCount}</p>
                  <p className="text-sm text-muted-foreground">following</p>
                </div>
              </div>

              {/* Bio */}
              <p className="text-muted-foreground mb-4">@{currentUser.username}</p>
              <p className="mb-4">{currentUser.bio}</p>

              {/* Skills */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Skills I teach</p>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.skillsTeaching.map((skill) => (
                      <Badge key={skill} className="gradient-primary text-primary-foreground border-0">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Skills I want to learn</p>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.skillsLearning.map((skill) => (
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

        {/* Tabs */}
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
            {userPosts.map((post, index) => (
              <SkillPostCard key={post.id} post={post} index={index} />
            ))}
          </TabsContent>

          <TabsContent value="saved">
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No saved posts yet</h2>
              <p className="text-muted-foreground">
                Posts you save will appear here
              </p>
            </div>
          </TabsContent>

          <TabsContent value="liked">
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No liked posts yet</h2>
              <p className="text-muted-foreground">
                Posts you like will appear here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
