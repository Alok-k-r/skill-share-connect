import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2 } from 'lucide-react';
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

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CallDialog() {
  const { active, status, durationSec, localStream, remoteStream, micOn, camOn, toggleMic, toggleCam, endCall } = useCall();
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const isVideo = active?.kind === 'video';

  // Attach the remote stream and try to play. If autoplay is blocked, surface a button.
  useEffect(() => {
    if (!remoteStream) return;
    const tryPlay = (el: HTMLMediaElement | null) => {
      if (!el) return;
      el.srcObject = remoteStream;
      const p = el.play();
      if (p && typeof p.then === 'function') {
        p.then(() => setNeedsAudioUnlock(false)).catch((err) => {
          console.warn('[call] remote autoplay blocked', err);
          setNeedsAudioUnlock(true);
        });
      }
    };
    tryPlay(remoteVideoRef.current);
    tryPlay(remoteAudioRef.current);
  }, [remoteStream, isVideo]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => { /* local muted, no autoplay block */ });
    }
  }, [localStream]);

  if (!active) return null;

  const unlockAudio = () => {
    [remoteVideoRef.current, remoteAudioRef.current].forEach((el) => {
      if (el) el.play().catch((e) => console.warn('[call] manual play failed', e));
    });
    setNeedsAudioUnlock(false);
  };

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
            </div>
          )}

          {/* Always render the remote audio element so voice calls have output. */}
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

          <div className="absolute top-0 inset-x-0 p-4 flex items-center gap-3 bg-gradient-to-b from-black/60 to-transparent text-white">
            <Avatar className="h-10 w-10">
              <AvatarImage src={active.peer.avatar_url || ''} alt={active.peer.display_name} />
              <AvatarFallback>{active.peer.display_name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold leading-tight">{active.peer.display_name}</p>
              <p className="text-xs opacity-80">
                {status === 'connected' ? fmt(durationSec) : STATUS_LABEL[status]}
              </p>
            </div>
            <span
              className={cn(
                'ml-auto text-xs px-2 py-1 rounded-full',
                status === 'connected' ? 'bg-green-500/80' : 'bg-white/20'
              )}
            >
              {status === 'connected' ? fmt(durationSec) : STATUS_LABEL[status]}
            </span>
          </div>

          {needsAudioUnlock && (
            <div className="absolute bottom-20 inset-x-0 flex justify-center">
              <Button onClick={unlockAudio} size="sm" className="gap-2 shadow-lg">
                <Volume2 className="h-4 w-4" /> Tap to enable audio
              </Button>
            </div>
          )}
        </div>

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
