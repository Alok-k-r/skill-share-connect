import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { PostWithProfile } from './usePosts';

export function useLikedPosts() {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['liked-posts'],
    queryFn: async () => {
      if (!user) return [];

      const { data: likes, error } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id);

      if (error) throw error;
      if (!likes || likes.length === 0) return [];

      const postIds = likes.map(l => l.post_id);

      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds)
        .order('created_at', { ascending: false });

      if (!posts || posts.length === 0) return [];

      const userIds = [...new Set(posts.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const [likesRes, commentsRes] = await Promise.all([
        supabase.from('likes').select('post_id').in('post_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds),
      ]);

      const likeCounts: Record<string, number> = {};
      const commentCounts: Record<string, number> = {};
      (likesRes.data || []).forEach((l: any) => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
      (commentsRes.data || []).forEach((c: any) => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });

      return posts.map(post => ({
        ...post,
        profiles: profileMap.get(post.user_id) || { id: post.user_id, username: 'unknown', display_name: 'Unknown', avatar_url: null },
        likes_count: likeCounts[post.id] || 0,
        comments_count: commentCounts[post.id] || 0,
        is_liked: true,
      })) as PostWithProfile[];
    },
    enabled: isReady && !!user,
  });
}
