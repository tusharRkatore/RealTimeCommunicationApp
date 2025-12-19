"use client"

import { LogOut, Plus, Trash2, Video } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

import type { Profile, Room } from "@/lib/types/database"
import type { User } from "@supabase/supabase-js"

interface DashboardClientProps {
  user: User
  profile: Profile | null
  rooms: (Room & {
    profiles: { display_name: string | null; email: string }
  })[]
}

export function DashboardClient({
  user,
  profile,
  rooms,
}: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [roomDescription, setRoomDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!supabase) return null

  /* ---------------- CREATE ROOM ---------------- */

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const { data: room, error } = await supabase
        .from("rooms")
        .insert({
          name: roomName,
          description: roomDescription,
          host_id: user.id,
          is_active: true,
        })
        .select()
        .single()

      if (error || !room) throw error

      await supabase.from("room_participants").insert({
        room_id: room.id,
        user_id: user.id,
        is_active: true,
      })

      setRoomName("")
      setRoomDescription("")
      setIsCreateDialogOpen(false)

      router.replace(`/room/${room.id}`)
    } catch (err) {
      console.error("Create room failed:", err)
    } finally {
      setIsCreating(false)
    }
  }

  /* ---------------- DELETE ROOM (HOST ONLY) ---------------- */

  const handleDeleteRoom = async (roomId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this room? This action cannot be undone."
    )

    if (!confirmDelete) return

    const { error } = await supabase
      .from("rooms")
      .update({ is_active: false })
      .eq("id", roomId)
      .eq("host_id", user.id)

    if (error) {
      alert("Failed to delete room")
      console.error(error)
      return
    }

    router.refresh()
  }

  /* ---------------- LOGOUT ---------------- */

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.replace("/")
    router.refresh()
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Video className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">Connect</span>
          </Link>

          <div className="flex items-center gap-4">
            <p className="text-sm font-medium">
              {profile?.display_name || user.email}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold">
          Welcome back, {profile?.display_name || "there"}!
        </h1>
        <p className="mb-8 text-muted-foreground">
          Start a new meeting or join an existing room
        </p>

        {/* Create Room */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mb-6">
              <Plus className="mr-2 h-4 w-4" />
              Create Room
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Room</DialogTitle>
              <DialogDescription>
                Start a new meeting
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <Label>Room Name</Label>
                <Input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Rooms */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {room.name}
                  {room.host_id === user.id && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                      Host
                    </span>
                  )}
                </CardTitle>

                <CardDescription>
                  Hosted by{" "}
                  {room.profiles.display_name || room.profiles.email}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href={`/room/${room.id}`}>Join Room</Link>
                </Button>

                {/* DELETE BUTTON – HOST ONLY */}
                {room.host_id === user.id && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDeleteRoom(room.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Room
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
