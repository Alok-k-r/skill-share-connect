import { RTC_CONFIG, type CallKind } from './config';

export interface PeerCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
}

/**
 * Thin, modular wrapper around RTCPeerConnection so we can swap in TURN
 * config or extend to N-peer (group) calls later without touching UI.
 */
export class PeerConnection {
  pc: RTCPeerConnection;
  localStream: MediaStream | null = null;
  remoteStream: MediaStream;

  constructor(private cb: PeerCallbacks) {
    this.pc = new RTCPeerConnection(RTC_CONFIG);
    this.remoteStream = new MediaStream();

    this.pc.ontrack = (ev) => {
      console.log('[webrtc] ◀ ontrack', ev.track.kind, 'streams=', ev.streams.length);
      // Prefer the stream object that arrives with the event when present
      const incoming = ev.streams[0];
      if (incoming) {
        incoming.getTracks().forEach((t) => {
          if (!this.remoteStream.getTracks().find((x) => x.id === t.id)) {
            this.remoteStream.addTrack(t);
          }
        });
      } else if (!this.remoteStream.getTracks().find((x) => x.id === ev.track.id)) {
        this.remoteStream.addTrack(ev.track);
      }
      this.cb.onRemoteStream(this.remoteStream);
    };

    this.pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        console.log('[webrtc] ▶ ice candidate', ev.candidate.candidate);
        this.cb.onIceCandidate(ev.candidate.toJSON());
      } else {
        console.log('[webrtc] ice gathering complete');
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log('[webrtc] connectionState →', this.pc.connectionState);
      this.cb.onConnectionStateChange(this.pc.connectionState);
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log('[webrtc] iceConnectionState →', this.pc.iceConnectionState);
      this.cb.onIceConnectionStateChange?.(this.pc.iceConnectionState);
    };

    this.pc.onicegatheringstatechange = () => {
      console.log('[webrtc] iceGatheringState →', this.pc.iceGatheringState);
    };

    this.pc.onsignalingstatechange = () => {
      console.log('[webrtc] signalingState →', this.pc.signalingState);
    };
  }

  static async getUserMedia(kind: CallKind): Promise<MediaStream> {
    console.log('[webrtc] requesting user media', kind);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: kind === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    });
    console.log(
      '[webrtc] media obtained: audio=',
      stream.getAudioTracks().length,
      'video=',
      stream.getVideoTracks().length
    );
    return stream;
  }

  attachLocalStream(stream: MediaStream) {
    this.localStream = stream;
    stream.getTracks().forEach((track) => {
      console.log('[webrtc] addTrack', track.kind, 'enabled=', track.enabled);
      this.pc.addTrack(track, stream);
    });
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.pc.setLocalDescription(offer);
    console.log('[webrtc] offer created & set local');
    return offer;
  }

  async createAnswer(remoteOffer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
    console.log('[webrtc] remote offer set');
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    console.log('[webrtc] answer created & set local');
    return answer;
  }

  async setRemoteAnswer(answer: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    console.log('[webrtc] remote answer set');
  }

  async addIceCandidate(c: RTCIceCandidateInit) {
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(c));
    } catch (err) {
      console.warn('[webrtc] addIceCandidate failed', err);
    }
  }

  setMicEnabled(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  setCamEnabled(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
  }

  close() {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.remoteStream.getTracks().forEach((t) => t.stop());
    try {
      this.pc.getSenders().forEach((s) => s.track && s.track.stop());
    } catch {}
    this.pc.onicecandidate = null;
    this.pc.ontrack = null;
    this.pc.onconnectionstatechange = null;
    this.pc.oniceconnectionstatechange = null;
    this.pc.onicegatheringstatechange = null;
    this.pc.onsignalingstatechange = null;
    this.pc.close();
  }
}
