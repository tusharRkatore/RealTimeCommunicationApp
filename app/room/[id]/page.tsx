import { RoomClient } from "@/components/room/room-client"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // ✅ FIX: unwrap params properly
  const { id } = await params

  const supabase = await createClient()

  // ❗ Supabase not configured
  if (!supabase) {
    redirect("/auth/login")
  }

  // 🔐 Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // 🔹 Fetch room
  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .single()

  if (!room) {
    redirect("/dashboard")
  }

  // 🔹 Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // 🔹 Ensure participant exists (SAFE)
  const { data: participant } = await supabase
    .from("room_participants")
    .select("*")
    .eq("room_id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!participant) {
    await supabase.from("room_participants").insert({
      room_id: id,
      user_id: user.id,
      is_active: true,
    })
  } else if (!participant.is_active) {
    await supabase
      .from("room_participants")
      .update({ is_active: true, left_at: null })
      .eq("id", participant.id)
  }

  return <RoomClient room={room} user={user} profile={profile} />
}
