// WebRTC ICE configuration. Add TURN servers here when available.
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Example TURN (uncomment + configure when ready):
  // { urls: 'turn:turn.example.com:3478', username: '...', credential: '...' },
];

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 4,
};

export type CallKind = 'voice' | 'video';

export type CallStatus =
  | 'idle'
  | 'calling'   // outgoing, waiting for callee
  | 'ringing'   // incoming, waiting for local user
  | 'connecting'
  | 'connected'
  | 'ended';

export interface CallPeer {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

// Signaling payload types sent over Supabase Realtime broadcast
export type SignalEvent =
  | { type: 'invite'; callId: string; from: CallPeer; kind: CallKind }
  | { type: 'accept'; callId: string; from: string }
  | { type: 'reject'; callId: string; from: string; reason?: string }
  | { type: 'cancel'; callId: string; from: string }
  | { type: 'end'; callId: string; from: string }
  | { type: 'sdp'; callId: string; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice'; callId: string; from: string; candidate: RTCIceCandidateInit };
