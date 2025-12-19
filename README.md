# Connect - Video Conferencing & Collaboration Platform

A full-stack, real-time video conferencing and collaboration platform built with Next.js, WebRTC, and Supabase. Features include multi-user video calling, screen sharing, collaborative whiteboard, file sharing, and real-time chat.

## Features

### Core Functionality
- **Multi-User Video Calling**: High-quality peer-to-peer video and audio communication using WebRTC
- **Screen Sharing**: Share your entire screen with meeting participants
- **Real-time Chat**: Send instant messages to all participants
- **Collaborative Whiteboard**: Draw and sketch together in real-time with multiple tools and shapes
- **File Sharing**: Upload and share files up to 50MB with all participants
- **User Authentication**: Secure email/password authentication with Supabase Auth
- **Real-time Notifications**: Get notified of new messages and file uploads
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Security
- **Row Level Security (RLS)**: All database operations protected with Supabase RLS policies
- **End-to-End Encryption**: WebRTC provides encrypted peer-to-peer connections
- **Secure File Storage**: Files stored securely using Vercel Blob
- **Authentication Required**: All features require user authentication

## Tech Stack

### Frontend
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS v4**: Modern styling with design tokens
- **shadcn/ui**: High-quality UI components
- **Lucide React**: Beautiful icon library

### Backend & Database
- **Supabase**: PostgreSQL database with real-time capabilities
- **Supabase Auth**: User authentication and authorization
- **Supabase Realtime**: Real-time subscriptions for chat, files, and whiteboard

### Real-time Communication
- **WebRTC**: Peer-to-peer video/audio streaming
- **Supabase Realtime Channels**: Signaling for WebRTC connections
- **Custom Signaling Service**: Manages peer connections and ICE candidates

### File Storage
- **Vercel Blob**: Scalable file storage for shared files

## Database Schema

The application uses the following main tables:

- **profiles**: User profile information
- **rooms**: Video conference rooms
- **room_participants**: Tracks who is in each room
- **chat_messages**: Real-time chat messages
- **files**: Shared files metadata
- **whiteboard_strokes**: Collaborative whiteboard drawing data

All tables are protected with Row Level Security (RLS) policies to ensure users can only access data they're authorized to see.

## Getting Started

### Prerequisites
- Node.js 18+ installed
- A Supabase account
- A Vercel account (for Blob storage)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <your-repo-url>
   cd connect
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API and copy your project URL and anon key
   - Run the SQL scripts in the `scripts` folder to set up your database

4. **Set up Vercel Blob**
   - Create a Vercel project and enable Blob storage
   - Copy your Blob token

5. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   \`\`\`

6. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Initial Setup

1. **Sign up** for a new account
2. **Confirm your email** (check your inbox)
3. **Sign in** and start creating rooms!

## Project Structure

\`\`\`
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   └── upload-file/      # File upload endpoint
│   ├── auth/                 # Authentication pages
│   │   ├── login/
│   │   ├── sign-up/
│   │   ├── sign-up-success/
│   │   └── error/
│   ├── dashboard/            # Main dashboard
│   └── room/[id]/            # Video conference room
├── components/               # React components
│   ├── dashboard/            # Dashboard components
│   ├── room/                 # Room-related components
│   │   ├── video-grid.tsx    # Video grid layout
│   │   ├── chat-panel.tsx    # Chat functionality
│   │   ├── whiteboard-panel.tsx
│   │   ├── files-panel.tsx
│   │   └── participants-panel.tsx
│   └── ui/                   # UI components (shadcn)
├── lib/                      # Utility functions
│   ├── supabase/             # Supabase clients
│   ├── webrtc/               # WebRTC implementation
│   │   ├── peer-connection.ts
│   │   └── signaling.ts
│   ├── types/                # TypeScript types
│   └── hooks/                # Custom React hooks
├── scripts/                  # Database setup scripts
│   └── 001_create_database_schema.sql
└── proxy.ts                  # Middleware for auth

\`\`\`

## How It Works

### WebRTC Signaling
The application uses Supabase Realtime channels for WebRTC signaling:
1. Users join a room and initialize their local media stream
2. The signaling service announces their presence via broadcast
3. Existing participants create peer connections and exchange offers/answers
4. ICE candidates are exchanged to establish the optimal connection path
5. Once connected, media streams flow directly between peers

### Real-time Collaboration
- **Chat**: Messages are inserted into the database and broadcast to all participants via Supabase Realtime
- **Whiteboard**: Drawing strokes are saved to the database and synchronized in real-time
- **File Sharing**: Files are uploaded to Vercel Blob, metadata is stored in the database, and participants are notified

### Security Architecture
- All API routes verify user authentication
- Database queries are protected by RLS policies
- Room participants are verified before allowing access to room resources
- File uploads are scoped to authenticated users and room participants

## Usage Guide

### Creating a Room
1. From the dashboard, click "Create New Room"
2. Enter a room name and optional description
3. Click "Create Room" - you'll automatically join the room

### Joining a Room
1. From the dashboard, browse available rooms
2. Click "Join Room" on any active room
3. You'll enter the video conference

### During a Meeting
- **Toggle Video/Audio**: Click the video/mic buttons to enable/disable
- **Share Screen**: Click the monitor button to start screen sharing
- **Chat**: Open the chat panel to send messages
- **Whiteboard**: Use the whiteboard for collaborative drawing
- **Share Files**: Upload files for all participants to access
- **View Participants**: See who's in the room

## Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

### Post-Deployment
- Run database migrations in Supabase
- Configure email templates in Supabase Auth settings
- Set up custom domain (optional)

## Environment Variables

Required environment variables:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=         # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Your Supabase anon/public key

# Vercel Blob
BLOB_READ_WRITE_TOKEN=            # Your Vercel Blob token

# Optional: Development redirect URL
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
\`\`\`

## Troubleshooting

### Video/Audio Not Working
- Ensure your browser has permission to access camera/microphone
- Check that you're using HTTPS (required for WebRTC in production)
- Try refreshing the page

### Can't See Other Participants
- Check that both users are in the same room
- Verify your network allows WebRTC connections (some corporate networks block it)
- Check browser console for connection errors

### Database Errors
- Ensure RLS policies are properly configured
- Verify your Supabase environment variables are correct
- Check that the database schema is up to date

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Open an issue on GitHub
- Contact support

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database and Auth by [Supabase](https://supabase.com/)
- File storage by [Vercel Blob](https://vercel.com/storage/blob)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
\`\`\`

```json file="" isHidden
