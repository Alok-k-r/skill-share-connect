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
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      // Batch fetch all profiles
      const userIds = [...new Set(posts.map((p: any) => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Batch fetch counts and likes
      const postIds = posts.map((p: any) => p.id);
      const [likesRes, commentsRes, userLikesRes] = await Promise.all([
        supabase.from('likes').select('post_id', { count: 'exact' }).in('post_id', postIds),
        supabase.from('comments').select('post_id', { count: 'exact' }).in('post_id', postIds),
        user
          ? supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds)
          : Promise.resolve({ data: [] }),
      ]);

      // Count per post
      const likeCounts: Record<string, number> = {};
      const commentCounts: Record<string, number> = {};
      (likesRes.data || []).forEach((l: any) => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
      (commentsRes.data || []).forEach((c: any) => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });

      const userLikedPosts = new Set((userLikesRes.data || []).map((l: any) => l.post_id));

      return posts.map((post: any) => ({
        ...post,
        profiles: profileMap.get(post.user_id) || { id: post.user_id, username: 'unknown', display_name: 'Unknown', avatar_url: null },
        likes_count: likeCounts[post.id] || 0,
        comments_count: commentCounts[post.id] || 0,
        is_liked: userLikedPosts.has(post.id),
      })) as PostWithProfile[];
    },
    enabled: isReady,
  });
}

export function useUserPosts(userId: string | undefined) {
  const { user, isReady } = useAuth();

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
      if (!posts || posts.length === 0) return [];

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      const postIds = posts.map((p: any) => p.id);
      const [likesRes, commentsRes, userLikesRes] = await Promise.all([
        supabase.from('likes').select('post_id').in('post_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds),
        user
          ? supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds)
          : Promise.resolve({ data: [] }),
      ]);

      const likeCounts: Record<string, number> = {};
      const commentCounts: Record<string, number> = {};
      (likesRes.data || []).forEach((l: any) => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
      (commentsRes.data || []).forEach((c: any) => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });
      const userLikedPosts = new Set((userLikesRes.data || []).map((l: any) => l.post_id));

      const profile = profileData || { id: userId, username: 'unknown', display_name: 'Unknown', avatar_url: null };

      return posts.map((post: any) => ({
        ...post,
        profiles: profile,
        likes_count: likeCounts[post.id] || 0,
        comments_count: commentCounts[post.id] || 0,
        is_liked: userLikedPosts.has(post.id),
      })) as PostWithProfile[];
    },
    enabled: isReady && !!userId,
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
        .insert({
          skill_offered: post.skill_offered,
          skill_wanted: post.skill_wanted,
          description: post.description,
          image_url: post.image_url || null,
          user_id: post.user_id,
        })
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
