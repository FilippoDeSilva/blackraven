"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function VerifyEmailPage() {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)
  const [resentError, setResentError] = useState<string | null>(null)
  const [resentLoading, setResentLoading] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Prefer email from query param, fallback to localStorage
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
      localStorage.setItem("rememberedEmail", emailParam)
    } else {
      const remembered = localStorage.getItem("rememberedEmail") || ""
      setEmail(remembered)
    }
  }, [searchParams])

  useEffect(() => {
    // Handle magic link verification if token is present in URL
    const token = searchParams.get("token")
    const remembered = localStorage.getItem("rememberedEmail") || ""
    if (token && remembered) {
      setLoading(true)
      supabase.auth.verifyOtp({
        email: remembered,
        token,
        type: "email",
      }).then(({ error }) => {
        setLoading(false)
        if (!error) {
          router.push("/dashboard")
        } else {
          setError(error.message || "Verification failed. Please try again.")
        }
      })
    }
  }, [searchParams])

  const handleResend = async () => {
    setResentError(null)
    setResentLoading(true)
    try {
      if (!email) {
        setResentError("No email found. Please sign up again.")
        setResentLoading(false)
        return
      }
      const { error, data } = await supabase.auth.resend({
        type: "signup",
        email,
      })
      console.log("[Resend Debug] Email:", email)
      console.log("[Resend Debug] Data:", data)
      console.log("[Resend Debug] Error:", error)
      if (error) {
        setResentError(
          error.message ||
            "Failed to resend code. Please check your email address or try again later."
        )
        setResentLoading(false)
        return
      }
      if (!data || (!data.user && !data.session)) {
        setResentError(
          "No verification email was sent. This may happen if the email is already confirmed, does not exist, or you have requested too many times. Please check your inbox, try logging in, or contact support."
        )
        setResentLoading(false)
        return
      }
      setResent(true)
    } catch (err: any) {
      console.error("[Resend Exception]", err)
      setResentError(err.message || "Failed to resend code.")
    } finally {
      setResentLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Supabase email verification (magic link/OTP)
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      })
      if (verifyError) {
        setError(verifyError.message || "Verification failed. Please try again.")
        setLoading(false)
        return
      }
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-lg dark:bg-gray-800">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center dark:text-white">
                Verify your email
              </CardTitle>
              <CardDescription className="text-center dark:text-gray-400">
                Enter the verification code sent to your email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="dark:text-gray-300">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter verification code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Didn't receive a code?{" "}
                <Button
                  variant="link"
                  onClick={handleResend}
                  disabled={resentLoading}
                  className="text-rose-600 hover:underline font-medium dark:text-rose-400"
                >
                  {resentLoading ? "Resending..." : resent ? "Code sent!" : "Resend code"}
                </Button>
              </p>
              {resentError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{resentError}</AlertDescription>
                </Alert>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}