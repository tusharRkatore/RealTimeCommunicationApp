"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Mail } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function SignUpSuccessPage() {
  const [message, setMessage] = useState<string | null>(null)

  const resendEmail = async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      setMessage("Please log in again to resend confirmation.")
      return
    }

    await supabase.auth.resend({
      type: "signup",
      email: user.email,
    })

    setMessage("Confirmation email resent. Check your inbox.")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <Mail className="mx-auto h-10 w-10 text-primary" />
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>Confirm your account to continue</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {message && (
              <p className="text-center text-sm text-primary">{message}</p>
            )}

            <Button onClick={resendEmail} className="w-full">
              Resend Confirmation Email
            </Button>

            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
