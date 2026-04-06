import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkillPostCard } from '@/components/posts/SkillPostCard';
import { UserCard } from '@/components/users/UserCard';
import { usePosts } from '@/hooks/usePosts';
import { useProfiles } from '@/hooks/useProfiles';
import { Skeleton } from '@/components/ui/skeleton';

const popularSkills = [
  'JavaScript', 'Photography', 'Piano', 'Spanish', 'Yoga', 
  'Python', 'Guitar', 'Cooking', 'French', 'Design'
];

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const { data: posts, isLoading: postsLoading } = usePosts();
  const { data: profiles, isLoading: profilesLoading } = useProfiles(searchQuery);

  const filteredPosts = posts?.filter(post => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      post.skill_offered.toLowerCase().includes(q) ||
      post.skill_wanted.toLowerCase().includes(q) ||
      post.description.toLowerCase().includes(q) ||
      post.profiles?.display_name?.toLowerCase().includes(q) ||
      post.profiles?.username?.toLowerCase().includes(q);
    const matchesSkill = !selectedSkill ||
      post.skill_offered.toLowerCase().includes(selectedSkill.toLowerCase()) ||
      post.skill_wanted.toLowerCase().includes(selectedSkill.toLowerCase());
    return matchesSearch && matchesSkill;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Explore Skills</h1>
          <p className="text-muted-foreground">
            Discover amazing skills and connect with people ready to exchange knowledge
          </p>
        </div>

        <div className="flex gap-3 mb-6 animate-slide-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search skills, people, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base"
            />
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12">
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Popular Skills</h2>
          <div className="flex flex-wrap gap-2">
            {popularSkills.map((skill) => (
              <Badge
                key={skill}
                variant={selectedSkill === skill ? "default" : "secondary"}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <Tabs defaultValue="posts" className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <TabsList className="mb-6">
            <TabsTrigger value="posts">Skill Posts</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            {postsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            ) : filteredPosts && filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPosts.map((post, index) => (
                  <SkillPostCard key={post.id} post={post} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No posts found
              </div>
            )}
          </TabsContent>

          <TabsContent value="people" className="space-y-4">
            {profilesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-2xl" />
                ))}
              </div>
            ) : profiles && profiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profiles.map((profile) => (
                  <UserCard key={profile.id} profile={profile} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No people found
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
