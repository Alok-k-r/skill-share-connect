import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ProfileWithStats {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  skills_teaching: string[];
  skills_learning: string[];
  created_at: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following: boolean;
}

export function useProfiles(searchQuery?: string) {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['profiles', searchQuery || ''],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Server-side search filtering
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim();
        query = query.or(`display_name.ilike.%${q}%,username.ilike.%${q}%`);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      const profileIds = (profiles || []).map(p => p.id);
      if (profileIds.length === 0) return [];

      // Batch fetch stats and follows
      const [followersRes, followingRes, postsRes, userFollowsRes] = await Promise.all([
        supabase.from('follows').select('following_id').in('following_id', profileIds),
        supabase.from('follows').select('follower_id').in('follower_id', profileIds),
        supabase.from('posts').select('user_id').in('user_id', profileIds),
        user
          ? supabase.from('follows').select('following_id').eq('follower_id', user.id).in('following_id', profileIds)
          : Promise.resolve({ data: [] }),
      ]);

      const followerCounts: Record<string, number> = {};
      const followingCounts: Record<string, number> = {};
      const postCounts: Record<string, number> = {};
      (followersRes.data || []).forEach((f: any) => { followerCounts[f.following_id] = (followerCounts[f.following_id] || 0) + 1; });
      (followingRes.data || []).forEach((f: any) => { followingCounts[f.follower_id] = (followingCounts[f.follower_id] || 0) + 1; });
      (postsRes.data || []).forEach((p: any) => { postCounts[p.user_id] = (postCounts[p.user_id] || 0) + 1; });
      const userFollowingSet = new Set((userFollowsRes.data || []).map((f: any) => f.following_id));

      return (profiles || []).map(profile => ({
        ...profile,
        bio: profile.bio || '',
        skills_teaching: profile.skills_teaching || [],
        skills_learning: profile.skills_learning || [],
        followers_count: followerCounts[profile.id] || 0,
        following_count: followingCounts[profile.id] || 0,
        posts_count: postCounts[profile.id] || 0,
        is_following: userFollowingSet.has(profile.id),
      })) as ProfileWithStats[];
    },
    enabled: isReady,
  });
}

export function useProfileByUsername(username: string | undefined) {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      if (!username) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      if (!profile) return null;

      const [statsRes, followRes] = await Promise.all([
        supabase.rpc('get_profile_stats', { profile_id: profile.id }),
        user
          ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const stats = statsRes.data as { followers_count: number; following_count: number; posts_count: number } | null;

      return {
        ...profile,
        bio: profile.bio || '',
        skills_teaching: profile.skills_teaching || [],
        skills_learning: profile.skills_learning || [],
        followers_count: stats?.followers_count || 0,
        following_count: stats?.following_count || 0,
        posts_count: stats?.posts_count || 0,
        is_following: !!followRes.data,
      } as ProfileWithStats;
    },
    enabled: isReady && !!username,
  });
}
