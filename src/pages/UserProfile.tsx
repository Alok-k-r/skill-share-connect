import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid3X3, MessageCircle, Phone, Video } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkillPostCard } from '@/components/posts/SkillPostCard';
import { useProfileByUsername } from '@/hooks/useProfiles';
import { useUserPosts } from '@/hooks/usePosts';
import { useFollowUser } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { FollowersModal } from '@/components/profile/FollowersModal';
import { supabase } from '@/integrations/supabase/client';
import { useCall } from '@/hooks/useCall';

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfileByUsername(username);
  const { data: userPosts, isLoading: postsLoading } = useUserPosts(profile?.id);
  const followMutation = useFollowUser();
  const [followersModal, setFollowersModal] = useState<{ open: boolean; type: 'followers' | 'following' }>({ open: false, type: 'followers' });
  const [messagingLoading, setMessagingLoading] = useState(false);
  const { startCall } = useCall();

  const callPeer = profile
    ? { id: profile.id, display_name: profile.display_name, username: profile.username, avatar_url: profile.avatar_url }
    : null;

  const handleFollow = () => {
    if (!user || !profile) return;
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

  const handleMessage = async () => {
    if (!user || !profile) return;
    setMessagingLoading(true);
    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        navigate('/messages');
        return;
      }

      // Create new conversation
      const { error } = await supabase
        .from('conversations')
        .insert({ user1_id: user.id, user2_id: profile.id });

      if (error) throw error;
      navigate('/messages');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setMessagingLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-muted-foreground">This profile doesn't exist</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-card rounded-2xl border p-6 mb-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-primary/20">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name} />
              <AvatarFallback className="text-3xl">{profile.display_name?.[0] || '?'}</AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-4">
                <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                {user && user.id !== profile.id && (
                  <div className="flex gap-2">
                    <Button
                      variant={profile.is_following ? "outline" : "gradient"}
                      onClick={handleFollow}
                      disabled={followMutation.isPending}
                    >
                      {profile.is_following ? 'Following' : 'Follow'}
                    </Button>
                    <Button variant="outline" onClick={handleMessage} disabled={messagingLoading}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {messagingLoading ? 'Opening...' : 'Message'}
                    </Button>
                    <Button variant="outline" size="icon" aria-label="Voice call" onClick={() => callPeer && startCall(callPeer, 'voice')}>
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" aria-label="Video call" onClick={() => callPeer && startCall(callPeer, 'video')}>
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-6 mb-4">
                <div className="text-center sm:text-left">
                  <p className="font-bold text-xl">{profile.posts_count}</p>
                  <p className="text-sm text-muted-foreground">posts</p>
                </div>
                <button onClick={() => setFollowersModal({ open: true, type: 'followers' })} className="text-center sm:text-left hover:opacity-70 transition-opacity">
                  <p className="font-bold text-xl">{profile.followers_count.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">followers</p>
                </button>
                <button onClick={() => setFollowersModal({ open: true, type: 'following' })} className="text-center sm:text-left hover:opacity-70 transition-opacity">
                  <p className="font-bold text-xl">{profile.following_count}</p>
                  <p className="text-sm text-muted-foreground">following</p>
                </button>
              </div>

              <p className="text-muted-foreground mb-4">@{profile.username}</p>
              <p className="mb-4">{profile.bio}</p>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Skills they teach</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills_teaching.map((skill) => (
                      <Badge key={skill} className="gradient-primary text-primary-foreground border-0">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Skills they want to learn</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills_learning.map((skill) => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b">
            <Grid3X3 className="h-5 w-5" />
            <h2 className="font-semibold">Posts</h2>
          </div>

          {postsLoading ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : userPosts && userPosts.length > 0 ? (
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
                {profile.display_name} hasn't shared any skills yet
              </p>
            </div>
          )}
        </div>
      </div>

      <FollowersModal
        isOpen={followersModal.open}
        onClose={() => setFollowersModal(prev => ({ ...prev, open: false }))}
        userId={profile.id}
        type={followersModal.type}
      />
    </Layout>
  );
}
