import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
}

export function FollowersModal({ isOpen, onClose, userId, type }: FollowersModalProps) {
  const { data: users, isLoading } = useQuery({
    queryKey: ['follow-list', userId, type],
    queryFn: async () => {
      if (type === 'followers') {
        const { data, error } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', userId);
        if (error) throw error;
        const ids = (data || []).map(f => f.follower_id);
        if (ids.length === 0) return [];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', ids);
        return profiles || [];
      } else {
        const { data, error } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
        if (error) throw error;
        const ids = (data || []).map(f => f.following_id);
        if (ids.length === 0) return [];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', ids);
        return profiles || [];
      }
    },
    enabled: isOpen && !!userId,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm max-h-[70vh] bg-card rounded-2xl shadow-lg overflow-hidden animate-scale-in flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold capitalize">{type}</h2>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : users && users.length > 0 ? (
            users.map((u) => (
              <Link
                key={u.id}
                to={`/user/${u.username}`}
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={u.avatar_url || ''} alt={u.display_name} />
                  <AvatarFallback>{u.display_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{u.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No {type} yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
