export class PeerConnection {
  private pc: RTCPeerConnection
  private remoteUserId: string
  private localStream: MediaStream | null = null
  private onRemoteStreamCallback?: (stream: MediaStream) => void

  constructor(remoteUserId: string, configuration?: RTCConfiguration) {
    this.remoteUserId = remoteUserId

    // Default STUN server configuration
    const defaultConfig: RTCConfiguration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    }

    this.pc = new RTCPeerConnection(configuration || defaultConfig)

    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[v0] ICE candidate generated:", event.candidate)
      }
    }

    // Handle remote stream
    this.pc.ontrack = (event) => {
      console.log("[v0] Remote track received:", event.track.kind)
      if (this.onRemoteStreamCallback && event.streams[0]) {
        this.onRemoteStreamCallback(event.streams[0])
      }
    }

    // Handle connection state changes
    this.pc.onconnectionstatechange = () => {
      console.log("[v0] Connection state:", this.pc.connectionState)
    }

    // Handle ICE connection state changes
    this.pc.oniceconnectionstatechange = () => {
      console.log("[v0] ICE connection state:", this.pc.iceConnectionState)
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)
    return offer
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    return answer
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(description))
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (error) {
      console.error("[v0] Error adding ICE candidate:", error)
    }
  }

  addLocalStream(stream: MediaStream): void {
    this.localStream = stream
    stream.getTracks().forEach((track) => {
      this.pc.addTrack(track, stream)
    })
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback
  }

  getRemoteUserId(): string {
    return this.remoteUserId
  }

  getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState
  }

  close(): void {
    this.pc.close()
  }
}
