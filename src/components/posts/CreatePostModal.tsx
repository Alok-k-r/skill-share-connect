import { useState } from 'react';
import { X, Image, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePost } from '@/hooks/usePosts';
import { toast } from '@/hooks/use-toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const { profile, user } = useAuth();
  const createPost = useCreatePost();
  const [skillOffered, setSkillOffered] = useState('');
  const [skillWanted, setSkillWanted] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Not logged in", description: "Please sign in to create a post.", variant: "destructive" });
      return;
    }

    createPost.mutate(
      {
        user_id: user.id,
        skill_offered: skillOffered,
        skill_wanted: skillWanted,
        description,
        image_url: imageUrl || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: "Post created!", description: "Your skill exchange post has been published." });
          onClose();
          setSkillOffered('');
          setSkillWanted('');
          setDescription('');
          setImageUrl('');
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create post. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-lg overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create Skill Post</h2>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {profile && (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name} />
                <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{profile.display_name}</p>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">I can teach</label>
              <Input placeholder="e.g., JavaScript, Piano..." value={skillOffered} onChange={(e) => setSkillOffered(e.target.value)} required />
            </div>
            <ArrowRightLeft className="h-5 w-5 text-muted-foreground mt-6" />
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">I want to learn</label>
              <Input placeholder="e.g., Spanish, Photography..." value={skillWanted} onChange={(e) => setSkillWanted(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Description</label>
            <Textarea placeholder="Tell others about your skills and what you're looking for..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Image URL (optional)</label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="https://example.com/image.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="pl-10" />
            </div>
          </div>

          {imageUrl && (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gradient" className="flex-1" disabled={createPost.isPending}>
              {createPost.isPending ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
