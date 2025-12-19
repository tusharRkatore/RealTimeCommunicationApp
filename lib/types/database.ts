export type Profile = {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Room = {
  id: string
  name: string
  description: string | null
  host_id: string
  is_active: boolean
  max_participants: number
  created_at: string
  updated_at: string
}

export type RoomParticipant = {
  id: string
  room_id: string
  user_id: string
  joined_at: string
  left_at: string | null
  is_active: boolean
}

export type FileRecord = {
  id: string
  room_id: string
  user_id: string
  filename: string
  file_url: string
  file_size: number
  file_type: string
  created_at: string
}

export type ChatMessage = {
  id: string
  room_id: string
  user_id: string
  message: string
  created_at: string
}

export type WhiteboardStroke = {
  id: string
  room_id: string
  user_id: string
  stroke_data: {
    points: number[]
    color: string
    width: number
  }
  created_at: string
}
