import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()

  // ✅ If Supabase is not configured, redirect immediately
  if (!supabase) {
    redirect("/auth/login")
  }

  // ✅ Now TypeScript & runtime both know supabase is NOT null
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // ✅ If not authenticated, redirect
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Fetch active rooms
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*, profiles(display_name, email)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  return (
    <DashboardClient
      user={user}
      profile={profile}
      rooms={rooms ?? []}
    />
  )
}
