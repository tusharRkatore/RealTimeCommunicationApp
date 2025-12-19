"use client"

import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types/database"
import { SignalingService } from "@/lib/webrtc/signaling"
import { MicOff, VideoOff } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface VideoGridProps {
  roomId: string
  userId: string
  profile: Profile | null
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  screenStream?: MediaStream | null
}

interface RemoteParticipant {
  userId: string
  name: string
  stream: MediaStream
}

export function VideoGrid({ roomId, userId, profile, isVideoEnabled, isAudioEnabled, screenStream }: VideoGridProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([])
  const signalingServiceRef = useRef<SignalingService | null>(null)
  const [participantNames, setParticipantNames] = useState<Map<string, string>>(new Map())

  // Initialize local media stream
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        setLocalStream(stream)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // Initialize WebRTC signaling
        const signaling = new SignalingService(roomId, userId)
        await signaling.init(stream)

        signaling.onPeerConnected(async (peerId, remoteStream) => {
          console.log("[ ] Peer connected:", peerId)

          // Fetch participant name
          const supabase = createClient()
          const { data: participantProfile } = await supabase
            .from("profiles")
            .select("display_name, email")
            .eq("id", peerId)
            .single()

          const name = participantProfile?.display_name || participantProfile?.email || "Unknown"

          setParticipantNames((prev) => new Map(prev).set(peerId, name))

          setRemoteParticipants((prev) => {
            const existing = prev.find((p) => p.userId === peerId)
            if (existing) {
              return prev.map((p) => (p.userId === peerId ? { ...p, stream: remoteStream } : p))
            }
            return [...prev, { userId: peerId, name, stream: remoteStream }]
          })
        })

        signaling.onPeerDisconnected((peerId) => {
          console.log("[ ] Peer disconnected:", peerId)
          setRemoteParticipants((prev) => prev.filter((p) => p.userId !== peerId))
          setParticipantNames((prev) => {
            const newMap = new Map(prev)
            newMap.delete(peerId)
            return newMap
          })
        })

        signalingServiceRef.current = signaling
      } catch (error) {
        console.error("[ ] Error accessing media devices:", error)
      }
    }

    initLocalStream()

    // Cleanup
    return () => {
      if (signalingServiceRef.current) {
        signalingServiceRef.current.disconnect()
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [roomId, userId])

  // Toggle video track
  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = isVideoEnabled
      }
    }
  }, [isVideoEnabled, localStream])

  // Toggle audio track
  useEffect(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = isAudioEnabled
      }
    }
  }, [isAudioEnabled, localStream])

  // Handle screen sharing
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream
    }
  }, [screenStream])

  // Calculate grid layout
  const totalParticipants = remoteParticipants.length + (screenStream ? 2 : 1) // +1 for local, +1 for screen if sharing
  const gridCols = totalParticipants === 1 ? 1 : totalParticipants === 2 ? 2 : totalParticipants <= 4 ? 2 : 3

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div
        className="grid h-full w-full gap-4"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        }}
      >
        {/* Screen Share (if active) */}
        {screenStream && (
          <Card className="relative flex items-center justify-center overflow-hidden bg-black">
            <video ref={screenVideoRef} autoPlay playsInline className="h-full w-full object-contain" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Your Screen</span>
              </div>
            </div>
          </Card>
        )}

        {/* Local Video */}
        <Card className="relative flex items-center justify-center overflow-hidden bg-muted">
          {isVideoEnabled ? (
            <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
                {(profile?.display_name || profile?.email || "U").charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">{profile?.display_name || "You"} (You)</span>
              <div className="flex items-center gap-2">
                {!isAudioEnabled && <MicOff className="h-4 w-4 text-white" />}
                {!isVideoEnabled && <VideoOff className="h-4 w-4 text-white" />}
              </div>
            </div>
          </div>
        </Card>

        {/* Remote Participants */}
        {remoteParticipants.map((participant) => (
          <RemoteVideoCard key={participant.userId} participant={participant} />
        ))}
      </div>
    </div>
  )
}

function RemoteVideoCard({ participant }: { participant: RemoteParticipant }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream
    }
  }, [participant.stream])

  const hasVideo = participant.stream?.getVideoTracks().some((track) => track.enabled) || false
  const hasAudio = participant.stream?.getAudioTracks().some((track) => track.enabled) || false

  return (
    <Card className="relative flex items-center justify-center overflow-hidden bg-muted">
      {hasVideo ? (
        <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-3xl font-bold text-accent-foreground">
            {participant.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">{participant.name}</span>
          <div className="flex items-center gap-2">
            {!hasAudio && <MicOff className="h-4 w-4 text-white" />}
            {!hasVideo && <VideoOff className="h-4 w-4 text-white" />}
          </div>
        </div>
      </div>
    </Card>
  )
}
