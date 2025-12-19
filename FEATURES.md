# Features Documentation

Complete feature documentation for the Connect video conferencing platform.

## Core Features

### 1. User Authentication

**Technology**: Supabase Auth with email/password

**Features**:
- Secure email/password authentication
- Email confirmation for new accounts
- Password reset functionality (via Supabase)
- Session management with secure cookies
- Protected routes with middleware

**User Flow**:
1. User signs up with email and password
2. Receives confirmation email
3. Clicks confirmation link
4. Can now sign in and access the platform

**Security**:
- Passwords are hashed by Supabase
- JWT tokens for session management
- HTTP-only cookies prevent XSS attacks
- CSRF protection via Supabase SSR

### 2. Video Calling

**Technology**: WebRTC peer-to-peer connections

**Features**:
- High-quality video streaming
- Multiple participant support
- Adaptive bitrate based on network conditions
- Echo cancellation and noise suppression
- Toggle video on/off
- Toggle audio on/off

**How It Works**:
1. User's browser requests camera/microphone access
2. Local media stream is captured
3. WebRTC peer connections are established
4. Media streams are exchanged directly between peers
5. STUN servers help with NAT traversal

**Supported Configurations**:
- 1-on-1 calls: Direct peer connection
- Group calls: Mesh topology (each peer connects to all others)
- Recommended: Up to 6 participants for optimal performance

### 3. Screen Sharing

**Technology**: WebRTC screen capture API

**Features**:
- Share entire screen, specific window, or browser tab
- High frame rate for smooth presentations
- Cursor visibility in shared screen
- Easy stop sharing from browser or app

**Use Cases**:
- Presentations and demos
- Code reviews and pair programming
- Document collaboration
- Training sessions

**Browser Support**:
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Supported with some limitations

### 4. Real-time Chat

**Technology**: Supabase Realtime subscriptions

**Features**:
- Instant message delivery
- Message persistence (stored in database)
- Sender identification
- Timestamp for each message
- Unread message notifications
- Auto-scroll to latest message

**Implementation**:
- Messages saved to PostgreSQL database
- Real-time updates via Supabase subscriptions
- Row Level Security ensures only room participants can read messages

**Message Structure**:
\`\`\`typescript
{
  id: UUID
  room_id: UUID
  user_id: UUID
  message: string
  created_at: timestamp
}
\`\`\`

### 5. Collaborative Whiteboard

**Technology**: HTML5 Canvas with real-time sync

**Drawing Tools**:
- **Pen**: Freehand drawing
- **Eraser**: Remove strokes
- **Line**: Draw straight lines
- **Circle**: Draw circles
- **Rectangle**: Draw rectangles

**Customization**:
- 6 color options (black, red, blue, green, yellow, purple)
- Adjustable stroke width (1-20px)
- Clear canvas option

**How It Works**:
1. User draws on local canvas
2. Stroke data is captured (points, color, width, tool)
3. Saved to database on mouse release
4. Other users receive real-time updates
5. Canvas is redrawn with all strokes

**Data Structure**:
\`\`\`typescript
{
  type: "pen" | "eraser" | "line" | "circle" | "rectangle"
  points: [{x: number, y: number}]
  color: string
  width: number
}
\`\`\`

### 6. File Sharing

**Technology**: Vercel Blob storage + Supabase metadata

**Features**:
- Upload files up to 50MB
- Download shared files
- File type detection and icons
- File size display
- Upload progress indication
- Real-time notifications for new files

**Supported File Types**:
- Documents (PDF, DOC, TXT)
- Images (JPG, PNG, GIF, SVG)
- Videos (MP4, AVI, MOV)
- Audio (MP3, WAV)
- Archives (ZIP, RAR)
- Any other file type

**Security**:
- Files are stored in Vercel Blob
- Only room participants can access files
- Public URLs are generated but hard to guess
- File metadata protected by RLS policies

**Upload Flow**:
1. User selects file
2. File validated (size, type)
3. Uploaded to Vercel Blob
4. Metadata saved to database
5. All participants notified
6. File appears in shared files list

### 7. Participant Management

**Features**:
- View all active participants
- See participant names/emails
- Identify room host (crown icon)
- Real-time join/leave notifications
- Participant count display

**Participant States**:
- **Active**: Currently in the room
- **Inactive**: Left the room
- **Host**: Room creator (has special badge)

### 8. Room Management

**Features**:
- Create new rooms with name and description
- Browse available rooms on dashboard
- Join any active room
- Leave room anytime
- Automatic cleanup (participants marked inactive on leave)

**Room States**:
- **Active**: Available for joining
- **Inactive**: Closed/ended (future feature)

## Advanced Features

### Real-time Notifications

**Chat Notifications**:
- Badge shows unread message count
- Only counts messages when chat is closed
- Auto-clears when chat is opened

**File Notifications**:
- Badge shows new file count
- Only counts files when panel is closed
- Auto-clears when files panel is opened

### Responsive Design

**Desktop**:
- Full video grid with side panels
- Comfortable control button sizing
- Optimal whiteboard canvas size

**Mobile/Tablet**:
- Responsive grid layout
- Touch-friendly controls
- Adaptive panel widths

### Keyboard Shortcuts (Future Enhancement)

Planned shortcuts:
- `M`: Toggle microphone
- `V`: Toggle video
- `S`: Toggle screen share
- `C`: Open/close chat
- `W`: Open/close whiteboard
- `ESC`: Leave room

## Performance Optimizations

### Video Streaming
- Adaptive bitrate based on bandwidth
- Automatic quality adjustment
- Frame rate optimization

### Database Queries
- Indexed tables for fast lookups
- RLS policies efficiently filter data
- Minimal data transferred over network

### Real-time Subscriptions
- Selective channel subscriptions
- Automatic reconnection on disconnect
- Efficient payload sizes

### Canvas Rendering
- Debounced drawing updates
- Efficient stroke rendering
- Optimized redraw algorithm

## Browser Compatibility

**Fully Supported**:
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

**Partial Support**:
- Older browsers may have WebRTC issues
- Mobile browsers work with limitations

**Required Features**:
- WebRTC support
- Canvas API
- MediaDevices API
- WebSocket support

## Limitations and Known Issues

### Current Limitations

1. **Participant Limit**: 
   - Recommended max: 6 participants
   - Technical limit: Browser/network dependent

2. **File Size**: 
   - Maximum 50MB per file
   - Limited by Vercel Blob quotas

3. **Browser Storage**:
   - No offline mode
   - Requires active internet connection

4. **Mobile Experience**:
   - Limited screen real estate
   - Higher battery consumption

### Known Issues

1. **WebRTC Behind Corporate Firewalls**:
   - May need TURN server
   - Some networks block peer connections

2. **Safari Limitations**:
   - Screen sharing has some restrictions
   - Occasional audio issues

3. **High CPU Usage**:
   - Multiple video streams are CPU intensive
   - Recommend closing other apps

## Future Enhancements

### Planned Features

1. **Recording**:
   - Record entire meeting
   - Export to video file
   - Cloud storage integration

2. **Breakout Rooms**:
   - Split into smaller groups
   - Rejoin main room

3. **Virtual Backgrounds**:
   - Blur background
   - Custom images

4. **Reactions**:
   - Emoji reactions
   - Hand raise feature

5. **Polls and Q&A**:
   - Live polling
   - Question queue

6. **Transcription**:
   - Real-time captions
   - Post-meeting transcript

7. **Calendar Integration**:
   - Schedule meetings
   - Send invites
   - Calendar sync

8. **Enhanced Security**:
   - End-to-end encryption
   - Waiting room
   - Password-protected rooms

## API Documentation

### WebRTC API

\`\`\`typescript
// Create peer connection
const peer = new PeerConnection(remoteUserId)

// Add local stream
peer.addLocalStream(localStream)

// Handle remote stream
peer.onRemoteStream((stream) => {
  // Display remote video
})

// Create offer
const offer = await peer.createOffer()

// Set remote description
await peer.setRemoteDescription(answer)
\`\`\`

### Signaling API

\`\`\`typescript
// Initialize signaling
const signaling = new SignalingService(roomId, userId)
await signaling.init(localStream)

// Handle peer connections
signaling.onPeerConnected((userId, stream) => {
  // New peer joined
})

signaling.onPeerDisconnected((userId) => {
  // Peer left
})
\`\`\`

### Database API

All database operations use Supabase client:

\`\`\`typescript
// Create room
const { data: room } = await supabase
  .from('rooms')
  .insert({ name, description, host_id })
  .select()
  .single()

// Send chat message
await supabase
  .from('chat_messages')
  .insert({ room_id, user_id, message })

// Upload file metadata
await supabase
  .from('files')
  .insert({ room_id, user_id, filename, file_url })
\`\`\`

## Conclusion

This platform provides a complete video conferencing solution with collaboration tools. It's built with modern web technologies and can be easily extended with additional features.
