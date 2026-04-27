import { useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCall } from '@/hooks/useCall';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  calling: 'Calling…',
  ringing: 'Ringing…',
  connecting: 'Connecting…',
  connected: 'Connected',
  ended: 'Call ended',
  idle: '',
};

export function CallDialog() {
  const { active, status, localStream, remoteStream, micOn, camOn, toggleMic, toggleCam, endCall } = useCall();
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  if (!active) return null;
  const isVideo = active.kind === 'video';

  return (
    <Dialog open onOpenChange={() => { /* prevent close via overlay */ }}>
      <DialogContent
        className="max-w-3xl p-0 overflow-hidden bg-background border-border [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative w-full aspect-video bg-gradient-to-br from-muted to-card">
          {isVideo ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover bg-black"
              />
              {/* Local PiP */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 right-4 w-28 sm:w-40 aspect-video rounded-lg border border-border shadow-lg object-cover bg-black"
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Avatar className="h-28 w-28 ring-4 ring-primary/30">
                <AvatarImage src={active.peer.avatar_url || ''} alt={active.peer.display_name} />
                <AvatarFallback className="text-3xl">{active.peer.display_name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <audio ref={remoteAudioRef} autoPlay />
            </div>
          )}

          {/* Header overlay */}
          <div className="absolute top-0 inset-x-0 p-4 flex items-center gap-3 bg-gradient-to-b from-black/60 to-transparent text-white">
            <Avatar className="h-10 w-10">
              <AvatarImage src={active.peer.avatar_url || ''} alt={active.peer.display_name} />
              <AvatarFallback>{active.peer.display_name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold leading-tight">{active.peer.display_name}</p>
              <p className="text-xs opacity-80">{STATUS_LABEL[status]}</p>
            </div>
            <span
              className={cn(
                'ml-auto text-xs px-2 py-1 rounded-full',
                status === 'connected' ? 'bg-green-500/80' : 'bg-white/20'
              )}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 p-4 bg-card border-t">
          <Button
            type="button"
            size="icon"
            variant={micOn ? 'secondary' : 'destructive'}
            onClick={toggleMic}
            className="rounded-full h-12 w-12"
            aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          {isVideo && (
            <Button
              type="button"
              size="icon"
              variant={camOn ? 'secondary' : 'destructive'}
              onClick={toggleCam}
              className="rounded-full h-12 w-12"
              aria-label={camOn ? 'Turn camera off' : 'Turn camera on'}
            >
              {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={endCall}
            className="rounded-full h-12 w-14"
            aria-label="End call"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
