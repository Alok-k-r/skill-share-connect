import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

let sharedNotificationsChannel: ReturnType<typeof supabase.channel> | null = null;
let sharedNotificationsUserId: string | null = null;
let notificationsSubscriberCount = 0;

const removeSharedNotificationsChannel = async () => {
  if (!sharedNotificationsChannel) return;

  await supabase.removeChannel(sharedNotificationsChannel);
  sharedNotificationsChannel = null;
  sharedNotificationsUserId = null;
};

export interface NotificationWithActor {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  post_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  actor: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const actorIds = [...new Set((data || []).map((n: any) => n.actor_id))];
      const { data: actors } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', actorIds);

      const actorMap = new Map((actors || []).map(a => [a.id, a]));

      return (data || []).map((notif: any) => ({
        ...notif,
        actor: actorMap.get(notif.actor_id) || {
          id: notif.actor_id,
          username: 'unknown',
          display_name: 'Unknown',
          avatar_url: null,
        },
      })) as NotificationWithActor[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    notificationsSubscriberCount += 1;

    const channelName = `notifications-realtime-${user.id}`;

    if (sharedNotificationsChannel && sharedNotificationsUserId !== user.id) {
      void removeSharedNotificationsChannel();
    }

    if (!sharedNotificationsChannel) {
      const existingChannel = supabase
        .getChannels()
        .find((channel) => channel.topic === `realtime:${channelName}`);

      if (existingChannel) {
        void supabase.removeChannel(existingChannel);
      }

      sharedNotificationsChannel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        })
        .subscribe();

      sharedNotificationsUserId = user.id;
    }

    return () => {
      notificationsSubscriberCount = Math.max(notificationsSubscriberCount - 1, 0);

      if (notificationsSubscriberCount === 0) {
        void removeSharedNotificationsChannel();
      }
    };
  }, [user?.id, queryClient]);

  return query;
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
