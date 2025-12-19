import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not available" },
        { status: 503 }
      )
    }

    /* ---------------- AUTH ---------------- */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    /* ---------------- FORM DATA ---------------- */
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const roomId = formData.get("roomId") as string | null

    if (!file || !roomId) {
      return NextResponse.json(
        { error: "File or roomId missing" },
        { status: 400 }
      )
    }

    /* ---------------- PARTICIPANT CHECK ---------------- */
    const { data: participant } = await supabase
      .from("room_participants")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant in this room" },
        { status: 403 }
      )
    }

    /* ---------------- UPLOAD TO SUPABASE STORAGE ---------------- */
    const fileExt = file.name.split(".").pop()
    const safeFileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`
    const filePath = `${roomId}/${safeFileName}`

    const { error: uploadError } = await supabase.storage
      .from("room-files")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json(
        { error: "Storage upload failed" },
        { status: 500 }
      )
    }

    /* ---------------- PUBLIC URL ---------------- */
    const { data: publicUrlData } = supabase.storage
      .from("room-files")
      .getPublicUrl(filePath)

    const publicUrl = publicUrlData.publicUrl

    /* ---------------- SAVE METADATA ---------------- */
    const { data: fileRecord, error: dbError } = await supabase
      .from("files")
      .insert({
        room_id: roomId,
        user_id: user.id,
        filename: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single()

    if (dbError) {
      console.error("DB insert error:", dbError)
      return NextResponse.json(
        { error: "Failed to save file record" },
        { status: 500 }
      )
    }

    /* ---------------- SUCCESS ---------------- */
    return NextResponse.json(fileRecord, { status: 200 })

  } catch (err) {
    console.error("Upload API crashed:", err)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
