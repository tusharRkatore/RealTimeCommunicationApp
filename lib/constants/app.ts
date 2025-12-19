export const APP_CONFIG = {
  name: "Connect",
  description: "Video Conferencing & Collaboration Platform",
  version: "1.0.0",
  maxParticipants: 10,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedVideoCodecs: ["VP8", "VP9", "H264"],
  defaultVideoConstraints: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  defaultAudioConstraints: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
} as const

export const ROUTES = {
  home: "/",
  login: "/auth/login",
  signUp: "/auth/sign-up",
  dashboard: "/dashboard",
  room: (id: string) => `/room/${id}`,
} as const

export const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
] as const
