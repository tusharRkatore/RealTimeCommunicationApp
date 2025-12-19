import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Video, Share2, FileText, Palette, Lock, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Video className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">Connect</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-balance md:text-6xl">
            Video Meetings Made <span className="text-primary">Simple & Secure</span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground text-pretty">
            Connect with your team through high-quality video calls, share screens, collaborate on whiteboards, and
            share files - all with end-to-end encryption.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/sign-up">
              <Button size="lg" className="w-full sm:w-auto">
                Start Meeting Now
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Join Existing Room
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">Everything You Need</h2>
          <p className="text-lg text-muted-foreground">Powerful features for seamless collaboration</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Multi-User Video</h3>
            <p className="text-muted-foreground">
              High-quality video calls with multiple participants. Crystal clear audio and video for seamless
              communication.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <Share2 className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Screen Sharing</h3>
            <p className="text-muted-foreground">
              Share your entire screen or specific windows with participants for better collaboration and presentations.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Collaborative Whiteboard</h3>
            <p className="text-muted-foreground">
              Draw, sketch, and brainstorm together in real-time with our interactive whiteboard feature.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <FileText className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">File Sharing</h3>
            <p className="text-muted-foreground">
              Easily share documents, images, and files with all meeting participants instantly.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">End-to-End Encryption</h3>
            <p className="text-muted-foreground">
              Your meetings are secure with military-grade encryption. Privacy is our top priority.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Real-Time Chat</h3>
            <p className="text-muted-foreground">
              Send messages and collaborate with participants without interrupting the flow of conversation.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="bg-primary p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">Ready to Get Started?</h2>
          <p className="mb-8 text-lg text-primary-foreground/90">
            Join thousands of teams already using Connect for their video meetings
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" variant="secondary">
              Create Free Account
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
