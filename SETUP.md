# Setup Guide for Connect Video Conferencing Platform

This guide will walk you through setting up the complete video conferencing platform locally and deploying it for production use.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Environment Variables](#environment-variables)
5. [Running Locally](#running-locally)
6. [Deployment](#deployment)
7. [Post-Deployment Configuration](#post-deployment-configuration)

## Prerequisites

Before you begin, ensure you have:
- Node.js 18 or higher installed
- npm or yarn package manager
- A Supabase account (free tier works great)
- A Vercel account (for deployment and Blob storage)
- A modern web browser with WebRTC support

## Local Development Setup

### 1. Clone or Download the Project

If you downloaded the ZIP from v0, extract it to your desired location.

\`\`\`bash
cd connect-video-conferencing
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

This will install all required dependencies including:
- Next.js 16
- React 19
- Supabase SSR client
- Vercel Blob storage
- UI components and utilities

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: Connect Video Platform (or your choice)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
5. Click "Create new project"

#### Get Your API Keys

Once your project is ready:
1. Go to Project Settings > API
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 4. Set Up Vercel Blob Storage

#### Option A: Local Development
For local development, you can skip Blob setup initially. File uploads will fail, but everything else will work.

#### Option B: Full Setup
1. Go to [vercel.com](https://vercel.com) and sign in
2. Create a new project (you can deploy later)
3. Go to Storage > Create Database > Blob
4. Copy your `BLOB_READ_WRITE_TOKEN`

## Database Setup

### Run Database Migrations

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Click "New query"
4. Copy the entire contents of `scripts/001_create_database_schema.sql`
5. Paste into the SQL editor
6. Click "Run" or press Cmd/Ctrl + Enter

This will create:
- All necessary tables (profiles, rooms, participants, files, chat, whiteboard)
- Row Level Security (RLS) policies
- Database triggers for user profile creation
- Indexes for performance

### Verify Setup

After running the script:
1. Go to Table Editor in Supabase
2. You should see these tables:
   - profiles
   - rooms
   - room_participants
   - files
   - chat_messages
   - whiteboard_strokes

## Environment Variables

### Create .env.local File

Create a file named `.env.local` in the root directory:

\`\`\`env
# Supabase Configuration (Server-side)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Configuration (Client-side - MUST have NEXT_PUBLIC prefix)
NEXT_PUBLIC_ENVSUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_ENVSUPABASE_ANON_KEY=your-anon-key-here

# Vercel Blob (optional for local dev)
BLOB_READ_WRITE_TOKEN=your-blob-token-here

# Development Redirect (optional)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
\`\`\`

### Important Notes

- The `NEXT_PUBLIC_` prefix makes variables accessible in the browser
- You need BOTH server-side (SUPABASE_*) and client-side (NEXT_PUBLIC_ENVSUPABASE_*) variables
- Both should point to the same Supabase project
- Never commit `.env.local` to version control
- The `.gitignore` file already excludes it

## Running Locally

### Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The application will start at [http://localhost:3000](http://localhost:3000)

### First Time Setup

1. **Sign Up**
   - Go to http://localhost:3000
   - Click "Get Started" or "Sign Up"
   - Enter your email and password
   - Create an account

2. **Email Confirmation**
   - Check your email inbox
   - Click the confirmation link
   - This activates your account

3. **Sign In**
   - Return to the app
   - Click "Sign In"
   - Enter your credentials

4. **Create Your First Room**
   - Click "Create New Room" on the dashboard
   - Give it a name like "Test Room"
   - Click "Create Room"

5. **Test Features**
   - Allow camera/microphone access when prompted
   - Try toggling video and audio
   - Open the chat panel and send a message
   - Try the whiteboard
   - Test file upload (if Blob is configured)

## Deployment

### Deploy to Vercel

#### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/connect-video.git
   git push -u origin main
   \`\`\`

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**
   In Vercel project settings, add:
   \`\`\`
   SUPABASE_URL
   SUPABASE_ANON_KEY
   NEXT_PUBLIC_ENVSUPABASE_URL
   NEXT_PUBLIC_ENVSUPABASE_ANON_KEY
   BLOB_READ_WRITE_TOKEN
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
   \`\`\`
   
   Note: The server and client variables should have the same values for URL and key.

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live!

#### Method 2: Vercel CLI

\`\`\`bash
npm i -g vercel
vercel login
vercel
\`\`\`

Follow the prompts to deploy.

### Deploy to Other Platforms

The app can be deployed anywhere that supports Next.js:
- **Netlify**: Use the Next.js runtime
- **AWS**: Use AWS Amplify
- **Railway**: Connect your GitHub repo
- **Self-hosted**: Use Docker or PM2

Note: You'll still need Vercel Blob for file storage, or modify the code to use an alternative like AWS S3.

## Post-Deployment Configuration

### 1. Update Supabase Redirect URLs

In your Supabase dashboard:
1. Go to Authentication > URL Configuration
2. Add your production URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: Add `https://your-app.vercel.app/**`

### 2. Configure Email Templates (Optional)

Customize email templates in Supabase:
1. Go to Authentication > Email Templates
2. Edit "Confirm signup" template
3. Update links to point to your domain

### 3. Set Up Custom Domain (Optional)

In Vercel:
1. Go to Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 4. Enable HTTPS

Vercel automatically provides HTTPS. For other platforms:
- Use Let's Encrypt for free SSL certificates
- Configure your web server (nginx/Apache)
- WebRTC requires HTTPS in production

## Common Issues and Solutions

### Issue: "User already registered" but can't sign in

**Solution**: Check your email for a confirmation link. Supabase requires email confirmation by default.

### Issue: Video/audio not working

**Solutions**:
- Grant camera/microphone permissions in browser
- Use HTTPS (required for WebRTC in production)
- Check browser console for errors
- Ensure you're not behind a restrictive firewall

### Issue: Can't connect to other users

**Solutions**:
- Verify both users are in the same room
- Check that WebRTC isn't blocked by your network
- Try a different network or use a VPN
- Check browser console for ICE connection errors

### Issue: File upload fails

**Solutions**:
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check file size (max 50MB)
- Ensure Vercel Blob is enabled on your account
- Check API route logs in Vercel dashboard

### Issue: Database errors

**Solutions**:
- Verify RLS policies are created (run the SQL script)
- Check that environment variables are correct
- Ensure user is authenticated
- Check Supabase logs in dashboard

### Issue: "Module not found" errors

**Solution**: 
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

## Development Tips

### Debugging WebRTC

Open browser console and look for `[v0]` prefixed logs. These show:
- Connection states
- ICE candidate generation
- Peer connections
- Media stream events

### Testing with Multiple Users

Option 1: Use different browsers (Chrome + Firefox)
Option 2: Use incognito/private windows
Option 3: Test on different devices

### Database Queries

Use Supabase Table Editor to:
- View data in real-time
- Test RLS policies
- Debug data issues
- Clear test data

### Reset Your Database

To start fresh:
1. Go to Supabase SQL Editor
2. Run: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
3. Re-run the setup script

**Warning**: This deletes all data!

## Production Checklist

Before going live:

- [ ] Database schema is set up
- [ ] RLS policies are enabled
- [ ] Environment variables are configured
- [ ] Email confirmation is working
- [ ] HTTPS is enabled
- [ ] Custom domain is configured (if desired)
- [ ] Error tracking is set up (optional)
- [ ] Backup strategy is in place
- [ ] Rate limiting is considered (for API routes)
- [ ] Terms of Service and Privacy Policy are added

## Performance Optimization

### For Better Video Quality

1. **Use a TURN server** for users behind restrictive NAT/firewalls
   - Add TURN server configuration to WebRTC config
   - Services: Twilio, Xirsys, or self-hosted coturn

2. **Optimize video constraints**
   \`\`\`typescript
   const stream = await navigator.mediaDevices.getUserMedia({
     video: {
       width: { ideal: 1280 },
       height: { ideal: 720 },
       frameRate: { ideal: 30 }
     },
     audio: {
       echoCancellation: true,
       noiseSuppression: true,
       autoGainControl: true
     }
   });
   \`\`\`

### For Scalability

1. **Add database indexes** (already included in schema)
2. **Implement pagination** for large file/message lists
3. **Add caching** for frequently accessed data
4. **Use CDN** for static assets (Vercel does this automatically)

## Security Best Practices

### Already Implemented

- Row Level Security on all tables
- Authentication required for all features
- Input validation on file uploads
- Secure session management with Supabase

### Additional Recommendations

1. **Rate Limiting**: Add rate limiting to API routes
2. **Content Moderation**: Add profanity filters for chat
3. **File Scanning**: Scan uploaded files for malware
4. **Audit Logs**: Track important user actions
5. **2FA**: Enable two-factor authentication in Supabase

## Support and Resources

### Official Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [WebRTC Docs](https://webrtc.org/getting-started/overview)

### Troubleshooting
- Check browser console for errors
- Check Vercel function logs
- Check Supabase logs
- Test in different browsers

### Getting Help
- Open an issue on GitHub
- Check Supabase Discord
- Ask on Vercel Discord
- Stack Overflow with tags: next.js, webrtc, supabase

## Next Steps

Now that your app is set up:
1. Customize the design to match your brand
2. Add more features (recording, breakout rooms, etc.)
3. Implement analytics to track usage
4. Gather user feedback
5. Scale based on demand

Congratulations! You now have a fully functional video conferencing platform.
