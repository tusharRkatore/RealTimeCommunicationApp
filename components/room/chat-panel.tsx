"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

/* ---------------- TYPES ---------------- */

interface ChatPanelProps {
  roomId: string
  userId: string
}

export interface ChatMessage {
  id: string
  user_id: string
  message: string
  created_at: string
  profiles: {
    display_name: string | null
    email: string
  } | null
}

/* ---------------- COMPONENT ---------------- */

export function ChatPanel({ roomId, userId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const supabase = createClient()

  const chatSelect = `
    id,
    user_id,
    message,
    created_at,
    profiles (
      display_name,
      email
    )
  `

  /* ---------------- FETCH + SUBSCRIBE ---------------- */
  useEffect(() => {
    if (!supabase) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(chatSelect)
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .returns<ChatMessage[]>()   // ✅ FIX

      if (error) {
        console.error("Chat fetch error:", error.message)
        return
      }

      setMessages(data ?? [])
    }

    fetchMessages()

    channelRef.current = supabase
      .channel(`chat-room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data, error } = await supabase
            .from("chat_messages")
            .select(chatSelect)
            .eq("id", payload.new.id)
            .single()
            .returns<ChatMessage>() // ✅ FIX

          if (!error && data) {
            setMessages((prev) => [...prev, data])
          }
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [roomId, supabase])

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending || !supabase) return

    setIsSending(true)

    const { error } = await supabase.from("chat_messages").insert({
      room_id: roomId,
      user_id: userId,
      message: newMessage.trim(),
    })

    if (error) {
      console.error("Send message error:", error.message)
    } else {
      setNewMessage("")
    }

    setIsSending(false)
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Chat</h3>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => {
            const isOwn = msg.user_id === userId
            const name =
              msg.profiles?.display_name ||
              msg.profiles?.email ||
              "Anonymous"

            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[75%] space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {isOwn ? "You" : name}
                  </p>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.message}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isSending || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
