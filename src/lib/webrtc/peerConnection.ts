import { RTC_CONFIG, type CallKind } from './config';

export interface PeerCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
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
      ev.streams[0]?.getTracks().forEach((t) => {
        if (!this.remoteStream.getTracks().find((x) => x.id === t.id)) {
          this.remoteStream.addTrack(t);
        }
      });
      this.cb.onRemoteStream(this.remoteStream);
    };

    this.pc.onicecandidate = (ev) => {
      if (ev.candidate) this.cb.onIceCandidate(ev.candidate.toJSON());
    };

    this.pc.onconnectionstatechange = () => {
      this.cb.onConnectionStateChange(this.pc.connectionState);
    };
  }

  static async getUserMedia(kind: CallKind): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: kind === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    });
  }

  attachLocalStream(stream: MediaStream) {
    this.localStream = stream;
    stream.getTracks().forEach((track) => this.pc.addTrack(track, stream));
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(remoteOffer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async setRemoteAnswer(answer: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
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
    this.pc.close();
  }
}
