import { useState, useRef } from 'react';
import { X, Image, ArrowRightLeft, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePost } from '@/hooks/usePosts';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image must be under 5MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      setImagePreview(publicUrl);
      toast({ title: 'Image uploaded!', description: 'Your image has been uploaded successfully.' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message || 'Failed to upload image.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageUrl('');
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
          setImagePreview('');
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
      <div className="relative w-full max-w-lg max-h-[90vh] bg-card rounded-2xl shadow-lg overflow-hidden animate-scale-in flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold">Create Skill Post</h2>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {profile && (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name} />
                <AvatarFallback>{profile.display_name?.[0] || '?'}</AvatarFallback>
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
            <ArrowRightLeft className="h-5 w-5 text-muted-foreground mt-6 shrink-0" />
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">I want to learn</label>
              <Input placeholder="e.g., Spanish, Photography..." value={skillWanted} onChange={(e) => setSkillWanted(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Description</label>
            <Textarea placeholder="Tell others about your skills and what you're looking for..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Image (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {!imagePreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload an image</span>
                    <span className="text-xs text-muted-foreground">Max 5MB · JPG, PNG, GIF, WebP</span>
                  </>
                )}
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-muted">
                <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground/70 text-background flex items-center justify-center hover:bg-foreground/90 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gradient" className="flex-1" disabled={createPost.isPending || uploading}>
              {createPost.isPending ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
