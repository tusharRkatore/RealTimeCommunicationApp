"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { Crown, User } from "lucide-react"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface ParticipantsPanelProps {
  roomId: string
  hostId: string
}

interface Participant {
  id: string
  user_id: string
  is_active: boolean
  profiles: {
    display_name: string | null
    email: string
  }
}

export function ParticipantsPanel({ roomId, hostId }: ParticipantsPanelProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Fetch current participants
    const fetchParticipants = async () => {
      const { data } = await supabase
        .from("room_participants")
        .select("*, profiles(display_name, email)")
        .eq("room_id", roomId)
        .eq("is_active", true)

      if (data) {
        setParticipants(data)
      }
    }

    fetchParticipants()

    // Subscribe to participant changes
    const newChannel = supabase
      .channel(`participants:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` },
        () => {
          fetchParticipants()
        },
      )
      .subscribe()

    setChannel(newChannel)

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [roomId])

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Participants ({participants.length})</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {participants.map((participant) => {
            const isHost = participant.user_id === hostId
            const displayName = participant.profiles.display_name || participant.profiles.email

            return (
              <div key={participant.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{displayName}</p>
                    {isHost && <Crown className="h-4 w-4 text-yellow-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{isHost ? "Host" : "Participant"}</p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
