"use client"

import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Room } from "@/lib/types/database"

import {
  FileText,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Palette,
  Users,
  Video,
  VideoOff,
} from "lucide-react"

import { ChatPanel } from "./chat-panel"
import { FilesPanel } from "./files-panel"
import { ParticipantsPanel } from "./participants-panel"
import { VideoGrid } from "./video-grid"
import { WhiteboardPanel } from "./whiteboard-panel"

/* ---------------- TYPES ---------------- */

interface RoomClientProps {
  room: Room
  user: User
  profile: Profile | null
}

type ActivePanel = "chat" | "whiteboard" | "files" | "participants" | null

/* ---------------- COMPONENT ---------------- */

export function RoomClient({ room, user, profile }: RoomClientProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [newFilesCount, setNewFilesCount] = useState(0)

  const router = useRouter()

  /* ---------------- REALTIME NOTIFICATIONS ---------------- */
  useEffect(() => {
    const supabase = createClient()

    const chatChannel = supabase
      .channel(`chat:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          if (payload.new.user_id !== user.id && activePanel !== "chat") {
            setUnreadMessages((p) => p + 1)
          }
        }
      )
      .subscribe()

    const filesChannel = supabase
      .channel(`files:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "files",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          if (payload.new.user_id !== user.id && activePanel !== "files") {
            setNewFilesCount((p) => p + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chatChannel)
      supabase.removeChannel(filesChannel)
    }
  }, [room.id, user.id, activePanel])

  useEffect(() => {
    if (activePanel === "chat") setUnreadMessages(0)
    if (activePanel === "files") setNewFilesCount(0)
  }, [activePanel])

  /* ---------------- ACTIONS ---------------- */
  const handleLeaveRoom = async () => {
    screenStream?.getTracks().forEach((t) => t.stop())

    const supabase = createClient()
    await supabase
      .from("room_participants")
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq("room_id", room.id)
      .eq("user_id", user.id)

    router.push("/dashboard")
  }

  const handleScreenShare = async () => {
    if (isScreenSharing && screenStream) {
      screenStream.getTracks().forEach((t) => t.stop())
      setScreenStream(null)
      setIsScreenSharing(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false)
        setScreenStream(null)
      }
      setScreenStream(stream)
      setIsScreenSharing(true)
    } catch (err) {
      console.error("Screen share failed:", err)
    }
  }

  const togglePanel = (panel: ActivePanel) =>
    setActivePanel(activePanel === panel ? null : panel)

  /* ---------------- UI ---------------- */
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4">
        <div>
          <h1 className="font-semibold">{room.name}</h1>
          <p className="text-sm text-muted-foreground">
            {room.description || "No description"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLeaveRoom}>
          <LogOut className="mr-2 h-4 w-4" /> Leave
        </Button>
      </header>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden pb-28">
        <div className="flex flex-1 flex-col">
          <VideoGrid
            roomId={room.id}
            userId={user.id}
            profile={profile}
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
            screenStream={screenStream}
          />
        </div>

        {/* Side Panel */}
        {activePanel && (
          <div className="w-80 border-l bg-card">
            {activePanel === "chat" && (
              <ChatPanel
                roomId={room.id}
                userId={user.id}
              />
            )}

            {activePanel === "whiteboard" && (
              <WhiteboardPanel roomId={room.id} userId={user.id} />
            )}

            {activePanel === "files" && (
              <FilesPanel roomId={room.id} userId={user.id} />
            )}

            {activePanel === "participants" && (
              <ParticipantsPanel roomId={room.id} hostId={room.host_id} />
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-3">
          <Button
            size="lg"
            variant={isAudioEnabled ? "default" : "destructive"}
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          >
            {isAudioEnabled ? <Mic /> : <MicOff />}
          </Button>

          <Button
            size="lg"
            variant={isVideoEnabled ? "default" : "destructive"}
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
          >
            {isVideoEnabled ? <Video /> : <VideoOff />}
          </Button>

          <Button
            size="lg"
            variant={isScreenSharing ? "secondary" : "outline"}
            onClick={handleScreenShare}
          >
            {isScreenSharing ? <MonitorOff /> : <Monitor />}
          </Button>

          <div className="mx-3 h-8 w-px bg-border" />

          <Button size="lg" onClick={() => togglePanel("chat")}>
            <MessageSquare />
          </Button>
          <Button size="lg" onClick={() => togglePanel("whiteboard")}>
            <Palette />
          </Button>
          <Button size="lg" onClick={() => togglePanel("files")}>
            <FileText />
          </Button>
          <Button size="lg" onClick={() => togglePanel("participants")}>
            <Users />
          </Button>
        </div>
      </div>
    </div>
  )
}
