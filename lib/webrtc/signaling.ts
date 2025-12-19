import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { PeerConnection } from "./peer-connection"

export type SignalingMessage =
  | { type: "offer"; offer: RTCSessionDescriptionInit; from: string; to: string }
  | { type: "answer"; answer: RTCSessionDescriptionInit; from: string; to: string }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit; from: string; to: string }
  | { type: "user-joined"; userId: string }
  | { type: "user-left"; userId: string }

export class SignalingService {
  private roomId: string
  private userId: string
  private channel: RealtimeChannel | null = null
  private peers: Map<string, PeerConnection> = new Map()
  private onPeerConnectedCallback?: (userId: string, stream: MediaStream) => void
  private onPeerDisconnectedCallback?: (userId: string) => void
  private localStream: MediaStream | null = null

  constructor(roomId: string, userId: string) {
    this.roomId = roomId
    this.userId = userId
  }

  async init(localStream: MediaStream): Promise<void> {
    this.localStream = localStream
    const supabase = createClient()

    this.channel = supabase.channel(`webrtc:${this.roomId}`).on("broadcast", { event: "signaling" }, (payload) => {
      this.handleSignalingMessage(payload.payload as SignalingMessage)
    })

    await this.channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[v0] Signaling channel subscribed")
        // Announce presence
        this.broadcast({ type: "user-joined", userId: this.userId })
      }
    })
  }

  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    // Ignore messages from self
    if ("from" in message && message.from === this.userId) return

    console.log("[v0] Received signaling message:", message.type)

    switch (message.type) {
      case "user-joined":
        if (message.userId !== this.userId) {
          await this.createPeerConnection(message.userId, true)
        }
        break

      case "user-left":
        this.removePeerConnection(message.userId)
        break

      case "offer":
        if (message.to === this.userId) {
          await this.handleOffer(message.from, message.offer)
        }
        break

      case "answer":
        if (message.to === this.userId) {
          await this.handleAnswer(message.from, message.answer)
        }
        break

      case "ice-candidate":
        if (message.to === this.userId) {
          await this.handleIceCandidate(message.from, message.candidate)
        }
        break
    }
  }

  private async createPeerConnection(remoteUserId: string, shouldCreateOffer: boolean): Promise<void> {
    if (this.peers.has(remoteUserId)) return

    console.log("[v0] Creating peer connection with:", remoteUserId)
    const peer = new PeerConnection(remoteUserId)

    // Add local stream
    if (this.localStream) {
      peer.addLocalStream(this.localStream)
    }

    // Handle remote stream
    peer.onRemoteStream((stream) => {
      if (this.onPeerConnectedCallback) {
        this.onPeerConnectedCallback(remoteUserId, stream)
      }
    })

    this.peers.set(remoteUserId, peer)

    // Create and send offer if we initiated the connection
    if (shouldCreateOffer) {
      const offer = await peer.createOffer()
      this.broadcast({
        type: "offer",
        offer,
        from: this.userId,
        to: remoteUserId,
      })
    }
  }

  private async handleOffer(from: string, offer: RTCSessionDescriptionInit): Promise<void> {
    let peer = this.peers.get(from)

    if (!peer) {
      await this.createPeerConnection(from, false)
      peer = this.peers.get(from)
    }

    if (peer) {
      await peer.setRemoteDescription(offer)
      const answer = await peer.createAnswer()
      this.broadcast({
        type: "answer",
        answer,
        from: this.userId,
        to: from,
      })
    }
  }

  private async handleAnswer(from: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(from)
    if (peer) {
      await peer.setRemoteDescription(answer)
    }
  }

  private async handleIceCandidate(from: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(from)
    if (peer) {
      await peer.addIceCandidate(candidate)
    }
  }

  private removePeerConnection(userId: string): void {
    const peer = this.peers.get(userId)
    if (peer) {
      peer.close()
      this.peers.delete(userId)

      if (this.onPeerDisconnectedCallback) {
        this.onPeerDisconnectedCallback(userId)
      }
    }
  }

  private broadcast(message: SignalingMessage): void {
    if (this.channel) {
      this.channel.send({
        type: "broadcast",
        event: "signaling",
        payload: message,
      })
    }
  }

  onPeerConnected(callback: (userId: string, stream: MediaStream) => void): void {
    this.onPeerConnectedCallback = callback
  }

  onPeerDisconnected(callback: (userId: string) => void): void {
    this.onPeerDisconnectedCallback = callback
  }

  updateLocalStream(stream: MediaStream): void {
    this.localStream = stream

    // Update all peer connections with new stream
    this.peers.forEach((peer) => {
      // Remove old tracks
      const senders = (peer as any).pc.getSenders()
      senders.forEach((sender: RTCRtpSender) => {
        if (sender.track) {
          ;(peer as any).pc.removeTrack(sender)
        }
      })

      // Add new tracks
      peer.addLocalStream(stream)
    })
  }

  disconnect(): void {
    // Announce leaving
    this.broadcast({ type: "user-left", userId: this.userId })

    // Close all peer connections
    this.peers.forEach((peer) => peer.close())
    this.peers.clear()

    // Unsubscribe from channel
    if (this.channel) {
      const supabase = createClient()
      supabase.removeChannel(this.channel)
      this.channel = null
    }
  }
}
