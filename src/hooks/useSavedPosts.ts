import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { PostWithProfile } from './usePosts';

export function useSavedPosts() {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['saved-posts'],
    queryFn: async () => {
      if (!user) return [];

      const { data: saved, error } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id);

      if (error) throw error;
      if (!saved || saved.length === 0) return [];

      const postIds = saved.map(s => s.post_id);

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

      const [likesRes, commentsRes, userLikesRes] = await Promise.all([
        supabase.from('likes').select('post_id').in('post_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds),
        supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
      ]);

      const likeCounts: Record<string, number> = {};
      const commentCounts: Record<string, number> = {};
      (likesRes.data || []).forEach((l: any) => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
      (commentsRes.data || []).forEach((c: any) => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });
      const userLikedPosts = new Set((userLikesRes.data || []).map((l: any) => l.post_id));

      return posts.map(post => ({
        ...post,
        profiles: profileMap.get(post.user_id) || { id: post.user_id, username: 'unknown', display_name: 'Unknown', avatar_url: null },
        likes_count: likeCounts[post.id] || 0,
        comments_count: commentCounts[post.id] || 0,
        is_liked: userLikedPosts.has(post.id),
      })) as PostWithProfile[];
    },
    enabled: isReady && !!user,
  });
}

export function useSavedPostIds() {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['saved-post-ids'],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data, error } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return new Set((data || []).map(d => d.post_id));
    },
    enabled: isReady && !!user,
  });
}

export function useToggleSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId, isSaved }: { postId: string; userId: string; isSaved: boolean }) => {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
      queryClient.invalidateQueries({ queryKey: ['saved-post-ids'] });
    },
  });
}
