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

export function useProfiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const withStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const [statsRes, followRes] = await Promise.all([
            supabase.rpc('get_profile_stats', { profile_id: profile.id }),
            user
              ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          const stats = statsRes.data as { followers_count: number; following_count: number; posts_count: number } | null;

          return {
            ...profile,
            followers_count: stats?.followers_count || 0,
            following_count: stats?.following_count || 0,
            posts_count: stats?.posts_count || 0,
            is_following: !!followRes.data,
          } as ProfileWithStats;
        })
      );

      return withStats;
    },
  });
}

export function useProfileByUsername(username: string | undefined) {
  const { user } = useAuth();

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
        followers_count: stats?.followers_count || 0,
        following_count: stats?.following_count || 0,
        posts_count: stats?.posts_count || 0,
        is_following: !!followRes.data,
      } as ProfileWithStats;
    },
    enabled: !!username,
  });
}
