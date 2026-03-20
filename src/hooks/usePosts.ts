import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PostWithProfile {
  id: string;
  user_id: string;
  skill_offered: string;
  skill_wanted: string;
  description: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export function usePosts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately since types may not reflect joins
      const postsWithCounts = await Promise.all(
        (posts || []).map(async (post: any) => {
          const [profileRes, likesRes, commentsRes, isLikedRes] = await Promise.all([
            supabase.from('profiles').select('id, username, display_name, avatar_url').eq('id', post.user_id).maybeSingle(),
            supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
            user
              ? supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...post,
            profiles: profileRes.data || { id: post.user_id, username: 'unknown', display_name: 'Unknown', avatar_url: null },
            likes_count: likesRes.count || 0,
            comments_count: commentsRes.count || 0,
            is_liked: !!isLikedRes.data,
          } as PostWithProfile;
        })
      );

      return postsWithCounts;
    },
  });
}

export function useUserPosts(userId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithCounts = await Promise.all(
        (posts || []).map(async (post: any) => {
          const [profileRes, likesRes, commentsRes, isLikedRes] = await Promise.all([
            supabase.from('profiles').select('id, username, display_name, avatar_url').eq('id', post.user_id).maybeSingle(),
            supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
            user
              ? supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...post,
            profiles: profileRes.data || { id: post.user_id, username: 'unknown', display_name: 'Unknown', avatar_url: null },
            likes_count: likesRes.count || 0,
            comments_count: commentsRes.count || 0,
            is_liked: !!isLikedRes.data,
          } as PostWithProfile;
        })
      );

      return postsWithCounts;
    },
    enabled: !!userId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: {
      skill_offered: string;
      skill_wanted: string;
      description: string;
      image_url?: string;
      user_id: string;
    }) => {
      const { data, error } = await supabase
        .from('posts')
        .insert(post)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId, isLiked }: { postId: string; userId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
