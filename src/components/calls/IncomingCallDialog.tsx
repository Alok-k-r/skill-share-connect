import { Phone, PhoneOff, Video } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { CallKind, CallPeer } from '@/lib/webrtc/config';

interface Props {
  peer: CallPeer;
  kind: CallKind;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallDialog({ peer, kind, onAccept, onReject }: Props) {
  return (
    <Dialog open onOpenChange={() => { /* require explicit choice */ }}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden border-border [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="p-6 flex flex-col items-center gap-4 bg-card">
          <p className="text-sm text-muted-foreground">
            Incoming {kind === 'video' ? 'video' : 'voice'} call
          </p>
          <Avatar className="h-24 w-24 ring-4 ring-primary/30 animate-pulse">
            <AvatarImage src={peer.avatar_url || ''} alt={peer.display_name} />
            <AvatarFallback className="text-2xl">{peer.display_name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-lg font-semibold">{peer.display_name}</p>
            <p className="text-sm text-muted-foreground">@{peer.username}</p>
          </div>

          <div className="flex items-center justify-center gap-6 mt-2 w-full">
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={onReject}
              className="rounded-full h-14 w-14"
              aria-label="Reject call"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              type="button"
              size="icon"
              onClick={onAccept}
              className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700 text-white"
              aria-label="Accept call"
            >
              {kind === 'video' ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
