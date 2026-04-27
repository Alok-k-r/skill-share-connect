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
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { PeerConnection } from '@/lib/webrtc/peerConnection';
import { sendSignal, subscribeSignals } from '@/lib/webrtc/signaling';
import type { CallKind, CallPeer, CallStatus, SignalEvent } from '@/lib/webrtc/config';
import { CallDialog } from '@/components/calls/CallDialog';
import { IncomingCallDialog } from '@/components/calls/IncomingCallDialog';
import {
  createCallHistory,
  updateCallHistory,
  type CallStatusValue,
} from '@/hooks/useCallHistory';

interface ActiveCall {
  callId: string;
  kind: CallKind;
  peer: CallPeer;
  isCaller: boolean;
  historyId?: string | null;
  startedAt?: number; // ms epoch when status hit 'connected'
}

interface CallContextValue {
  status: CallStatus;
  active: ActiveCall | null;
  micOn: boolean;
  camOn: boolean;
  durationSec: number;
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

const RING_TIMEOUT_MS = 35_000;

export function CallProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<CallStatus>('idle');
  const [active, setActive] = useState<ActiveCall | null>(null);
  const [incoming, setIncoming] = useState<{
    callId: string;
    kind: CallKind;
    peer: CallPeer;
    historyId?: string | null;
  } | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [durationSec, setDurationSec] = useState(0);

  const pcRef = useRef<PeerConnection | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteSetRef = useRef(false);
  const activeRef = useRef<ActiveCall | null>(null);
  const incomingRef = useRef<typeof incoming>(null);
  const ringTimerRef = useRef<number | null>(null);
  const durationTimerRef = useRef<number | null>(null);
  const historyFinalizedRef = useRef(false);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { incomingRef.current = incoming; }, [incoming]);

  // ---------- Helpers ----------
  const stopDurationTimer = () => {
    if (durationTimerRef.current) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };
  const startDurationTimer = (startedAt: number) => {
    stopDurationTimer();
    setDurationSec(0);
    durationTimerRef.current = window.setInterval(() => {
      setDurationSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
  };
  const clearRingTimer = () => {
    if (ringTimerRef.current) {
      window.clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  };

  const finalizeHistory = useCallback(
    async (finalStatus: CallStatusValue) => {
      const a = activeRef.current;
      if (!a || !a.historyId || historyFinalizedRef.current) return;
      historyFinalizedRef.current = true;
      const duration = a.startedAt
        ? Math.max(0, Math.floor((Date.now() - a.startedAt) / 1000))
        : 0;
      await updateCallHistory(a.historyId, {
        call_status: finalStatus,
        call_duration: duration,
        ended_at: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['call-history'] });
    },
    [queryClient]
  );

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    pendingIceRef.current = [];
    remoteSetRef.current = false;
    setLocalStream(null);
    setRemoteStream(null);
    setMicOn(true);
    setCamOn(true);
    stopDurationTimer();
    clearRingTimer();
  }, []);

  const finalizeEnd = useCallback(
    (msg: string | undefined, finalStatus: CallStatusValue) => {
      void finalizeHistory(finalStatus);
      cleanup();
      setStatus('ended');
      if (msg) toast(msg);
      setTimeout(() => {
        setActive(null);
        setStatus('idle');
        setDurationSec(0);
        historyFinalizedRef.current = false;
      }, 800);
    },
    [cleanup, finalizeHistory]
  );

  // ---------- ICE flush ----------
  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const queued = pendingIceRef.current;
    pendingIceRef.current = [];
    for (const c of queued) await pc.addIceCandidate(c);
    if (queued.length) console.log('[call] flushed', queued.length, 'queued ICE candidates');
  }, []);

  // ---------- PeerConnection factory ----------
  const buildPeer = useCallback(
    (kind: CallKind, callId: string, peer: CallPeer) => {
      const pc = new PeerConnection({
        onRemoteStream: (stream) => {
          console.log('[call] remote stream attached, tracks:', stream.getTracks().map((t) => t.kind));
          setRemoteStream(stream);
        },
        onIceCandidate: (candidate) => {
          void sendSignal(peer.id, {
            type: 'ice',
            callId,
            from: user!.id,
            candidate,
          });
        },
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            const a = activeRef.current;
            if (a && !a.startedAt) {
              const startedAt = Date.now();
              activeRef.current = { ...a, startedAt };
              setActive((prev) => (prev ? { ...prev, startedAt } : prev));
              startDurationTimer(startedAt);
            }
            setStatus('connected');
          }
          if (state === 'failed') {
            toast.error('Network failure');
            void endCallInternal('Call failed', 'failed');
          }
          if (state === 'disconnected') {
            // Some networks recover; wait briefly.
            setTimeout(() => {
              if (pcRef.current?.pc.connectionState === 'disconnected') {
                void endCallInternal('Call disconnected', 'failed');
              }
            }, 5000);
          }
        },
        onIceConnectionStateChange: (state) => {
          if (state === 'failed') {
            toast.error('ICE connection failed');
            void endCallInternal('Connection failed', 'failed');
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
    async (msg: string | undefined, finalStatus: CallStatusValue) => {
      const a = activeRef.current;
      if (a && user) {
        try {
          await sendSignal(a.peer.id, { type: 'end', callId: a.callId, from: user.id });
        } catch {}
      }
      finalizeEnd(msg, finalStatus);
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
      if (activeRef.current) {
        toast('Already in a call');
        return;
      }
      const callId = newCallId();

      // Insert call history immediately so we always have a record.
      const historyId = await createCallHistory({
        caller_id: user.id,
        receiver_id: peer.id,
        call_type: kind,
        call_status: 'ongoing',
      });

      const next: ActiveCall = { callId, kind, peer, isCaller: true, historyId };
      activeRef.current = next;
      setActive(next);
      setStatus('calling');

      let stream: MediaStream;
      try {
        stream = await PeerConnection.getUserMedia(kind);
      } catch (err: any) {
        console.error('[call] getUserMedia failed', err);
        toast.error(
          err?.name === 'NotAllowedError'
            ? 'Permission denied for microphone/camera'
            : 'Could not access media devices'
        );
        if (historyId) await updateCallHistory(historyId, { call_status: 'failed', ended_at: new Date().toISOString() });
        queryClient.invalidateQueries({ queryKey: ['call-history'] });
        activeRef.current = null;
        setActive(null);
        setStatus('idle');
        return;
      }
      setLocalStream(stream);

      const pc = buildPeer(kind, callId, peer);
      pc.attachLocalStream(stream);

      try {
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
        const offer = await pc.createOffer();
        await sendSignal(peer.id, { type: 'sdp', callId, from: user.id, sdp: offer });

        // Auto-cancel if no answer
        ringTimerRef.current = window.setTimeout(() => {
          if (activeRef.current?.callId === callId && (status === 'calling' || activeRef.current?.startedAt === undefined)) {
            const cur = activeRef.current;
            if (cur && !cur.startedAt && pcRef.current?.pc.connectionState !== 'connected') {
              toast('No answer');
              void endCallInternal('No answer', 'missed');
            }
          }
        }, RING_TIMEOUT_MS);
      } catch (err) {
        console.error('[call] start failed', err);
        toast.error('Failed to start call');
        if (historyId) await updateCallHistory(historyId, { call_status: 'failed', ended_at: new Date().toISOString() });
        queryClient.invalidateQueries({ queryKey: ['call-history'] });
        cleanup();
        activeRef.current = null;
        setActive(null);
        setStatus('idle');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile, buildPeer, cleanup, queryClient]
  );

  const acceptCall = useCallback(async () => {
    const inc = incomingRef.current;
    if (!inc || !user) return;
    setIncoming(null);

    const next: ActiveCall = {
      callId: inc.callId,
      kind: inc.kind,
      peer: inc.peer,
      isCaller: false,
      historyId: inc.historyId ?? null,
    };
    activeRef.current = next; // CRITICAL: set ref synchronously, not via setState
    setActive(next);
    setStatus('connecting');

    let stream: MediaStream;
    try {
      stream = await PeerConnection.getUserMedia(inc.kind);
    } catch (err: any) {
      console.error('[call] callee getUserMedia failed', err);
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
      if (inc.historyId)
        await updateCallHistory(inc.historyId, {
          call_status: 'failed',
          ended_at: new Date().toISOString(),
        });
      queryClient.invalidateQueries({ queryKey: ['call-history'] });
      activeRef.current = null;
      setActive(null);
      setStatus('idle');
      return;
    }
    setLocalStream(stream);

    const pc = buildPeer(inc.kind, inc.callId, inc.peer);
    pc.attachLocalStream(stream);

    await sendSignal(inc.peer.id, { type: 'accept', callId: inc.callId, from: user.id });

    // Try the buffered offer right now (will be a no-op if it hasn't arrived yet;
    // the signal handler will retry when the offer lands).
    await tryConsumeBufferedOfferRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, buildPeer, queryClient]);

  const rejectCall = useCallback(
    async (reason?: string) => {
      const inc = incomingRef.current;
      if (!inc || !user) return;
      await sendSignal(inc.peer.id, {
        type: 'reject',
        callId: inc.callId,
        from: user.id,
        reason,
      });
      if (inc.historyId) {
        await updateCallHistory(inc.historyId, {
          call_status: 'rejected',
          ended_at: new Date().toISOString(),
        });
        queryClient.invalidateQueries({ queryKey: ['call-history'] });
      }
      setIncoming(null);
      toast('Call rejected');
    },
    [user, queryClient]
  );

  const endCall = useCallback(async () => {
    const a = activeRef.current;
    const finalStatus: CallStatusValue = a?.startedAt ? 'completed' : 'cancelled';
    await endCallInternal('Call ended', finalStatus);
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

  // ---------- Signaling ----------
  const bufferedOfferRef = useRef<{ callId: string; sdp: RTCSessionDescriptionInit } | null>(null);
  const tryConsumeBufferedOfferRef = useRef<(() => Promise<void>) | null>(null);

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
        await flushPendingIce();
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
        await endCallInternal('Call failed', 'failed');
      }
    };
    tryConsumeBufferedOfferRef.current = tryConsumeBufferedOffer;

    const handle = async (e: SignalEvent) => {
      switch (e.type) {
        case 'invite': {
          if (activeRef.current || incomingRef.current) {
            await sendSignal(e.from.id, {
              type: 'reject',
              callId: e.callId,
              from: user.id,
              reason: 'busy',
            });
            return;
          }
          // Insert ongoing history entry on receiver side too so missed/rejected get logged.
          const historyId = await createCallHistory({
            caller_id: e.from.id,
            receiver_id: user.id,
            call_type: e.kind,
            call_status: 'ongoing',
          });
          setIncoming({ callId: e.callId, kind: e.kind, peer: e.from, historyId });
          setStatus('ringing');

          // Auto-mark as missed if the user doesn't answer.
          window.setTimeout(async () => {
            const cur = incomingRef.current;
            if (cur && cur.callId === e.callId) {
              setIncoming(null);
              if (cur.historyId) {
                await updateCallHistory(cur.historyId, {
                  call_status: 'missed',
                  ended_at: new Date().toISOString(),
                });
                queryClient.invalidateQueries({ queryKey: ['call-history'] });
              }
            }
          }, RING_TIMEOUT_MS);
          break;
        }
        case 'sdp': {
          if (e.sdp.type === 'offer') {
            // Always buffer; consume when callee has accepted (pc exists).
            bufferedOfferRef.current = { callId: e.callId, sdp: e.sdp };
            await tryConsumeBufferedOffer();
          } else if (e.sdp.type === 'answer') {
            const a = activeRef.current;
            const pc = pcRef.current;
            if (a && a.isCaller && pc && a.callId === e.callId) {
              try {
                await pc.setRemoteAnswer(e.sdp);
                remoteSetRef.current = true;
                await flushPendingIce();
                setStatus('connecting');
              } catch (err) {
                console.error('[call] setRemoteAnswer failed', err);
                await endCallInternal('Call failed', 'failed');
              }
            }
          }
          break;
        }
        case 'ice': {
          const a = activeRef.current;
          const pc = pcRef.current;
          if (!a || !pc || a.callId !== e.callId) {
            // Buffer even before pc exists in case of very early candidates.
            pendingIceRef.current.push(e.candidate);
            return;
          }
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
            finalizeEnd(reason, 'rejected');
          }
          break;
        }
        case 'cancel':
        case 'end': {
          const a = activeRef.current;
          if (a && a.callId === e.callId) {
            const finalStatus: CallStatusValue = a.startedAt ? 'completed' : 'cancelled';
            finalizeEnd('Call ended', finalStatus);
          }
          const inc = incomingRef.current;
          if (inc && inc.callId === e.callId) {
            setIncoming(null);
            if (inc.historyId) {
              await updateCallHistory(inc.historyId, {
                call_status: 'missed',
                ended_at: new Date().toISOString(),
              });
              queryClient.invalidateQueries({ queryKey: ['call-history'] });
            }
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
      const a = activeRef.current;
      if (a && user) {
        void sendSignal(a.peer.id, {
          type: 'end',
          callId: a.callId,
          from: user.id,
        });
        if (a.historyId) {
          // Best-effort sync update
          const finalStatus: CallStatusValue = a.startedAt ? 'completed' : 'cancelled';
          const duration = a.startedAt ? Math.floor((Date.now() - a.startedAt) / 1000) : 0;
          void updateCallHistory(a.historyId, {
            call_status: finalStatus,
            call_duration: duration,
            ended_at: new Date().toISOString(),
          });
        }
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
      durationSec,
      localStream,
      remoteStream,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMic,
      toggleCam,
    }),
    [status, active, micOn, camOn, durationSec, localStream, remoteStream, startCall, acceptCall, rejectCall, endCall, toggleMic, toggleCam]
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
