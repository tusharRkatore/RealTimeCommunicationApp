"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"

import {
  Download,
  FileText,
  ImageIcon,
  Music,
  Upload,
  Video,
} from "lucide-react"

import type { RealtimeChannel } from "@supabase/supabase-js"

/* ---------------- TYPES ---------------- */

interface FilesPanelProps {
  roomId: string
  userId: string
}

interface FileRecord {
  id: string
  room_id: string
  user_id: string
  filename: string
  file_url: string
  file_size: number
  file_type: string
  created_at: string
  profiles?: {
    display_name: string | null
    email: string
  }
}

/* ---------------- COMPONENT ---------------- */

export function FilesPanel({ roomId, userId }: FilesPanelProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const supabase = createClient()

  /* ---------------- FETCH + SUBSCRIBE ---------------- */

  useEffect(() => {
    if (!supabase) return

    const fetchFiles = async () => {
      const { data, error } = await supabase
        .from("files")
        .select("*, profiles(display_name, email)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setFiles(data)
      }
    }

    fetchFiles()

    channelRef.current = supabase
      .channel(`files-room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "files",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("files")
            .select("*, profiles(display_name, email)")
            .eq("id", payload.new.id)
            .single()

          if (data) {
            setFiles((prev) => [data, ...prev])
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

  /* ---------------- UPLOAD ---------------- */

 const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // 🔒 File size check (50MB)
  if (file.size > 50 * 1024 * 1024) {
    alert("File size must be less than 50MB")
    return
  }

  setIsUploading(true)

  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("roomId", roomId)

    const response = await fetch("/api/upload-file", {
      method: "POST",
      body: formData,
      credentials: "include",
    })

    // ❗ Handle API failure safely
    if (!response.ok) {
      let errorMessage = "Upload failed"

      try {
        const err = await response.json()
        if (err?.error) errorMessage = err.error
      } catch {
        // response had no JSON body
      }

      throw new Error(errorMessage)
    }

    // ✅ SUCCESS
    alert("File uploaded successfully")

    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  } catch (err) {
    console.error("Error uploading file:", err)
    alert(err instanceof Error ? err.message : "Upload failed")
  } finally {
    setIsUploading(false)
  }
}


  /* ---------------- HELPERS ---------------- */

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-5 w-5" />
    if (type.startsWith("video/")) return <Video className="h-5 w-5" />
    if (type.startsWith("audio/")) return <Music className="h-5 w-5" />
    if (type.includes("pdf")) return <FileText className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">Shared Files</h3>
      </div>

      <div className="border-b p-4">
  <label
    htmlFor="file-upload"
    className="sr-only"
  >
    Upload file
  </label>

  <input
    id="file-upload"
    ref={fileInputRef}
    type="file"
    onChange={handleFileSelect}
    className="hidden"
    disabled={isUploading}
  />

  <Button
    onClick={() => fileInputRef.current?.click()}
    disabled={isUploading}
    className="w-full"
  >
    <Upload className="mr-2 h-4 w-4" />
    {isUploading ? "Uploading..." : "Upload File"}
  </Button>

  <p className="mt-2 text-xs text-muted-foreground">
    Maximum file size: 50MB
  </p>
</div>


      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {files.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <ImageIcon className="mx-auto mb-2 h-12 w-12 opacity-50" />
              No files shared yet
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="rounded-lg border p-3 hover:bg-muted"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {getFileIcon(file.file_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">
                      {file.filename}
                    </p>

                    <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>•</span>
                      <span>
                        {file.user_id === userId
                          ? "You"
                          : file.profiles?.display_name ||
                            file.profiles?.email}
                      </span>
                    </div>
                  </div>

                  <a
                    href={file.file_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}