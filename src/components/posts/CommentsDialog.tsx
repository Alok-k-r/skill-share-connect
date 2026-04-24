import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useComments, useAddComment, useDeleteComment } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

export function CommentsDialog({ open, onOpenChange, postId }: CommentsDialogProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const { data: comments, isLoading } = useComments(open ? postId : undefined);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to comment.', variant: 'destructive' });
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      toast({ title: 'Too long', description: 'Comments must be under 500 characters.', variant: 'destructive' });
      return;
    }
    try {
      await addComment.mutateAsync({ postId, userId: user.id, content: trimmed });
      setContent('');
    } catch (err: any) {
      toast({ title: 'Could not post comment', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] px-5 py-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !comments || comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No comments yet. Be the first to comment.
            </p>
          ) : (
            <ul className="space-y-4">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <Link to={`/user/${c.profiles.username}`}>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={c.profiles.avatar_url || ''} alt={c.profiles.display_name} />
                      <AvatarFallback>{c.profiles.display_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <Link to={`/user/${c.profiles.username}`} className="font-semibold hover:text-primary">
                        {c.profiles.username}
                      </Link>{' '}
                      <span className="break-words">{c.content}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {user?.id === c.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteComment.mutate({ commentId: c.id, postId })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-3">
          <Input
            placeholder={user ? 'Add a comment...' : 'Sign in to comment'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!user || addComment.isPending}
            maxLength={500}
          />
          <Button
            type="submit"
            size="icon"
            className="gradient-primary text-primary-foreground shrink-0"
            disabled={!user || !content.trim() || addComment.isPending}
          >
            {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
