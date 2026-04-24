import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Search, Send, Loader2, Copy, Twitter, Facebook, MessageCircle, Mail, Link as LinkIcon } from 'lucide-react';

interface SharePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postUrl: string;
  shareText: string;
}

interface FollowProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

function useFollowList() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['share-followlist', user?.id],
    queryFn: async () => {
      if (!user) return [] as FollowProfile[];
      const [followingRes, followersRes] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', user.id),
        supabase.from('follows').select('follower_id').eq('following_id', user.id),
      ]);
      const ids = new Set<string>();
      (followingRes.data || []).forEach((f: any) => ids.add(f.following_id));
      (followersRes.data || []).forEach((f: any) => ids.add(f.follower_id));
      if (ids.size === 0) return [] as FollowProfile[];
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', [...ids]);
      return (data || []) as FollowProfile[];
    },
    enabled: !!user,
  });
}

export function SharePostDialog({ open, onOpenChange, postId, postUrl, shareText }: SharePostDialogProps) {
  const { user } = useAuth();
  const { data: friends, isLoading } = useFollowList();
  const [search, setSearch] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const list = friends || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (f) => f.username.toLowerCase().includes(q) || f.display_name.toLowerCase().includes(q)
    );
  }, [friends, search]);

  const handleSendToFriend = async (friend: FollowProfile) => {
    if (!user) {
      toast({ title: 'Sign in required', variant: 'destructive' });
      return;
    }
    setSendingTo(friend.id);
    try {
      // Find or create a conversation
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${friend.id}),and(user1_id.eq.${friend.id},user2_id.eq.${user.id})`
        )
        .maybeSingle();

      let conversationId = existing?.id;
      if (!conversationId) {
        const { data: created, error: createErr } = await supabase
          .from('conversations')
          .insert({ user1_id: user.id, user2_id: friend.id })
          .select('id')
          .single();
        if (createErr) throw createErr;
        conversationId = created.id;
      }

      const message = `${shareText ? shareText + '\n\n' : ''}${postUrl}`;
      const { error: msgErr } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user.id, content: message });
      if (msgErr) throw msgErr;

      setSentTo((prev) => new Set(prev).add(friend.id));
      toast({ title: 'Sent', description: `Shared with ${friend.display_name}.` });
    } catch (err: any) {
      toast({ title: 'Could not send', description: err.message, variant: 'destructive' });
    } finally {
      setSendingTo(null);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(postUrl);
    toast({ title: 'Link copied!' });
  };

  const encodedUrl = encodeURIComponent(postUrl);
  const encodedText = encodeURIComponent(shareText);

  const externalShares = [
    { label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
    { label: 'Twitter', icon: Twitter, href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
    { label: 'Facebook', icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: 'Email', icon: Mail, href: `mailto:?subject=${encodedText}&body=${encodedUrl}` },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle>Share post</DialogTitle>
        </DialogHeader>

        {/* Friend search */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="max-h-[40vh] px-2">
          {!user ? (
            <p className="text-sm text-muted-foreground text-center py-6 px-3">
              Sign in to send this post to friends.
            </p>
          ) : isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 px-3">
              {search ? 'No friends match your search.' : 'Follow people to share posts directly with them.'}
            </p>
          ) : (
            <ul className="py-1">
              {filtered.map((friend) => {
                const isSent = sentTo.has(friend.id);
                const isSending = sendingTo === friend.id;
                return (
                  <li
                    key={friend.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.avatar_url || ''} alt={friend.display_name} />
                      <AvatarFallback>{friend.display_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{friend.display_name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isSent ? 'secondary' : 'default'}
                      className={!isSent ? 'gradient-primary text-primary-foreground' : ''}
                      onClick={() => handleSendToFriend(friend)}
                      disabled={isSending || isSent}
                    >
                      {isSending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isSent ? (
                        'Sent'
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 mr-1.5" /> Send
                        </>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        {/* External share options */}
        <div className="border-t px-5 py-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Share elsewhere
          </p>
          <div className="grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition"
            >
              <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center">
                <LinkIcon className="h-5 w-5" />
              </div>
              <span className="text-[11px]">Copy</span>
            </button>
            {externalShares.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition"
              >
                <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px]">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
