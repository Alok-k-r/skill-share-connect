import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { PeerConnection } from '@/lib/webrtc/peerConnection';
import { sendSignal, subscribeSignals } from '@/lib/webrtc/signaling';
import type { CallKind, CallPeer, CallStatus, SignalEvent } from '@/lib/webrtc/config';
import { CallDialog } from '@/components/calls/CallDialog';
import { IncomingCallDialog } from '@/components/calls/IncomingCallDialog';

interface ActiveCall {
  callId: string;
  kind: CallKind;
  peer: CallPeer;
  isCaller: boolean;
}

interface CallContextValue {
  status: CallStatus;
  active: ActiveCall | null;
  micOn: boolean;
  camOn: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (peer: CallPeer, kind: CallKind) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: (reason?: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMic: () => void;
  toggleCam: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
}

function newCallId() {
  return crypto.randomUUID();
}

export function CallProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();

  const [status, setStatus] = useState<CallStatus>('idle');
  const [active, setActive] = useState<ActiveCall | null>(null);
  const [incoming, setIncoming] = useState<{
    callId: string;
    kind: CallKind;
    peer: CallPeer;
  } | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<PeerConnection | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteSetRef = useRef(false);
  const activeRef = useRef<ActiveCall | null>(null);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    pendingIceRef.current = [];
    remoteSetRef.current = false;
    setLocalStream(null);
    setRemoteStream(null);
    setMicOn(true);
    setCamOn(true);
  }, []);

  const finalizeEnd = useCallback(
    (msg?: string) => {
      cleanup();
      setStatus('ended');
      if (msg) toast(msg);
      // brief visual on "ended" before clearing
      setTimeout(() => {
        setActive(null);
        setStatus('idle');
      }, 800);
    },
    [cleanup]
  );

  const buildPeer = useCallback(
    (kind: CallKind, callId: string, peer: CallPeer) => {
      const pc = new PeerConnection({
        onRemoteStream: (stream) => setRemoteStream(stream),
        onIceCandidate: (candidate) => {
          void sendSignal(peer.id, {
            type: 'ice',
            callId,
            from: user!.id,
            candidate,
          });
        },
        onConnectionStateChange: (state) => {
          if (state === 'connected') setStatus('connected');
          if (state === 'failed') {
            toast.error('Network failure');
            void endCallInternal('Call ended (network failure)');
          }
          if (state === 'disconnected') {
            // Give it a moment; some browsers recover
            setTimeout(() => {
              if (pcRef.current?.pc.connectionState === 'disconnected') {
                void endCallInternal('Call disconnected');
              }
            }, 4000);
          }
        },
      });
      pcRef.current = pc;
      return pc;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  );

  const endCallInternal = useCallback(
    async (msg?: string) => {
      const a = activeRef.current;
      if (a && user) {
        try {
          await sendSignal(a.peer.id, { type: 'end', callId: a.callId, from: user.id });
        } catch {}
      }
      finalizeEnd(msg ?? 'Call ended');
    },
    [user, finalizeEnd]
  );

  // ---------- Public API ----------
  const startCall = useCallback(
    async (peer: CallPeer, kind: CallKind) => {
      if (!user || !profile) {
        toast.error('You must be signed in to call');
        return;
      }
      if (active) {
        toast('Already in a call');
        return;
      }
      const callId = newCallId();
      setActive({ callId, kind, peer, isCaller: true });
      setStatus('calling');

      let stream: MediaStream;
      try {
        stream = await PeerConnection.getUserMedia(kind);
      } catch (err: any) {
        toast.error(
          err?.name === 'NotAllowedError'
            ? 'Permission denied for microphone/camera'
            : 'Could not access media devices'
        );
        setActive(null);
        setStatus('idle');
        return;
      }
      setLocalStream(stream);

      const pc = buildPeer(kind, callId, peer);
      pc.attachLocalStream(stream);

      try {
        const offer = await pc.createOffer();
        await sendSignal(peer.id, {
          type: 'invite',
          callId,
          from: {
            id: user.id,
            display_name: profile.display_name,
            username: profile.username,
            avatar_url: profile.avatar_url,
          },
          kind,
        });
        await sendSignal(peer.id, { type: 'sdp', callId, from: user.id, sdp: offer });
        toast('Calling…');
      } catch (err) {
        console.error(err);
        toast.error('Failed to start call');
        cleanup();
        setActive(null);
        setStatus('idle');
      }
    },
    [user, profile, active, buildPeer, cleanup]
  );

  const acceptCall = useCallback(async () => {
    if (!incoming || !user) return;
    const inc = incoming;
    setIncoming(null);
    setActive({ callId: inc.callId, kind: inc.kind, peer: inc.peer, isCaller: false });
    setStatus('connecting');

    let stream: MediaStream;
    try {
      stream = await PeerConnection.getUserMedia(inc.kind);
    } catch (err: any) {
      toast.error(
        err?.name === 'NotAllowedError'
          ? 'Permission denied for microphone/camera'
          : 'Could not access media devices'
      );
      await sendSignal(inc.peer.id, {
        type: 'reject',
        callId: inc.callId,
        from: user.id,
        reason: 'permission_denied',
      });
      setActive(null);
      setStatus('idle');
      return;
    }
    setLocalStream(stream);

    const pc = buildPeer(inc.kind, inc.callId, inc.peer);
    pc.attachLocalStream(stream);

    await sendSignal(inc.peer.id, { type: 'accept', callId: inc.callId, from: user.id });
    // Offer has likely already arrived and been buffered by the signal handler.
    // The handler will create the answer once both pc and offer are ready.
    pendingOfferTryRef.current?.();
  }, [incoming, user, buildPeer]);

  const rejectCall = useCallback(
    async (reason?: string) => {
      if (!incoming || !user) return;
      await sendSignal(incoming.peer.id, {
        type: 'reject',
        callId: incoming.callId,
        from: user.id,
        reason,
      });
      setIncoming(null);
      toast('Call rejected');
    },
    [incoming, user]
  );

  const endCall = useCallback(async () => {
    await endCallInternal('Call ended');
  }, [endCallInternal]);

  const toggleMic = useCallback(() => {
    setMicOn((v) => {
      const next = !v;
      pcRef.current?.setMicEnabled(next);
      return next;
    });
  }, []);

  const toggleCam = useCallback(() => {
    setCamOn((v) => {
      const next = !v;
      pcRef.current?.setCamEnabled(next);
      return next;
    });
  }, []);

  // ---------- Signaling listener ----------
  // Buffer the offer if it arrives before the callee accepts.
  const bufferedOfferRef = useRef<{ callId: string; sdp: RTCSessionDescriptionInit; from: string } | null>(null);
  const pendingOfferTryRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) return;

    const tryConsumeBufferedOffer = async () => {
      const a = activeRef.current;
      const buf = bufferedOfferRef.current;
      const pc = pcRef.current;
      if (!a || a.isCaller || !buf || !pc || buf.callId !== a.callId) return;
      try {
        const answer = await pc.createAnswer(buf.sdp);
        remoteSetRef.current = true;
        // flush queued ICE
        for (const c of pendingIceRef.current) await pc.addIceCandidate(c);
        pendingIceRef.current = [];
        await sendSignal(a.peer.id, {
          type: 'sdp',
          callId: a.callId,
          from: user.id,
          sdp: answer,
        });
        bufferedOfferRef.current = null;
      } catch (err) {
        console.error('[call] answer error', err);
        toast.error('Failed to answer call');
        await endCallInternal();
      }
    };
    pendingOfferTryRef.current = tryConsumeBufferedOffer;

    const handle = async (e: SignalEvent) => {
      switch (e.type) {
        case 'invite': {
          if (activeRef.current || incoming) {
            // busy → auto reject
            await sendSignal(e.from.id, {
              type: 'reject',
              callId: e.callId,
              from: user.id,
              reason: 'busy',
            });
            return;
          }
          setIncoming({ callId: e.callId, kind: e.kind, peer: e.from });
          setStatus('ringing');
          break;
        }
        case 'sdp': {
          const a = activeRef.current;
          const pc = pcRef.current;
          if (e.sdp.type === 'offer') {
            // Callee path
            bufferedOfferRef.current = { callId: e.callId, sdp: e.sdp, from: e.from };
            if (a && !a.isCaller && pc && a.callId === e.callId) {
              await tryConsumeBufferedOffer();
            }
          } else if (e.sdp.type === 'answer') {
            // Caller path
            if (a && a.isCaller && pc && a.callId === e.callId) {
              try {
                await pc.setRemoteAnswer(e.sdp);
                remoteSetRef.current = true;
                for (const c of pendingIceRef.current) await pc.addIceCandidate(c);
                pendingIceRef.current = [];
                setStatus('connecting');
              } catch (err) {
                console.error(err);
                await endCallInternal('Call failed');
              }
            }
          }
          break;
        }
        case 'ice': {
          const a = activeRef.current;
          const pc = pcRef.current;
          if (!a || !pc || a.callId !== e.callId) return;
          if (remoteSetRef.current) {
            await pc.addIceCandidate(e.candidate);
          } else {
            pendingIceRef.current.push(e.candidate);
          }
          break;
        }
        case 'accept': {
          const a = activeRef.current;
          if (a && a.isCaller && a.callId === e.callId) {
            setStatus('connecting');
            toast('Call accepted');
          }
          break;
        }
        case 'reject': {
          const a = activeRef.current;
          if (a && a.callId === e.callId) {
            const reason =
              e.reason === 'busy'
                ? 'User is busy'
                : e.reason === 'permission_denied'
                ? 'User denied media permissions'
                : 'Call rejected';
            cleanup();
            setStatus('ended');
            toast(reason);
            setTimeout(() => {
              setActive(null);
              setStatus('idle');
            }, 800);
          }
          break;
        }
        case 'cancel':
        case 'end': {
          const a = activeRef.current;
          if (a && a.callId === e.callId) {
            finalizeEnd('Call ended');
          }
          if (incoming && incoming.callId === e.callId) {
            setIncoming(null);
            toast('Caller cancelled');
          }
          break;
        }
      }
    };

    const sub = subscribeSignals(user.id, (e) => {
      void handle(e);
    });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Hang up if user closes/navigates away
  useEffect(() => {
    const onUnload = () => {
      if (activeRef.current && user) {
        // Best-effort signal; not awaited
        void sendSignal(activeRef.current.peer.id, {
          type: 'end',
          callId: activeRef.current.callId,
          from: user.id,
        });
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [user?.id]);

  const value = useMemo<CallContextValue>(
    () => ({
      status,
      active,
      micOn,
      camOn,
      localStream,
      remoteStream,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMic,
      toggleCam,
    }),
    [status, active, micOn, camOn, localStream, remoteStream, startCall, acceptCall, rejectCall, endCall, toggleMic, toggleCam]
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      {active && <CallDialog />}
      {incoming && (
        <IncomingCallDialog
          peer={incoming.peer}
          kind={incoming.kind}
          onAccept={acceptCall}
          onReject={() => rejectCall()}
        />
      )}
    </CallContext.Provider>
  );
}
