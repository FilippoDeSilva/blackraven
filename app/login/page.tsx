"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Eye, EyeOff, Loader2, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Navbar } from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"
import { signInAction } from "@/lib/actions/auth"
import { signInWithOtpAction } from "@/lib/actions/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [magicLinkEmail, setMagicLinkEmail] = useState("")
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [showPasswordLogin, setShowPasswordLogin] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  useEffect(() => {
    // Check for remembered email
    const rememberedEmail = localStorage.getItem("rememberedEmail")
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      if (!email || !password) {
        setError("Please enter both email and password")
        setIsLoading(false)
        return
      }
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email)
      } else {
        localStorage.removeItem("rememberedEmail")
      }
      
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const result = await signInAction(formData);
      
      if (!result.success) {
        setError(result.error || "Login failed")
        setIsLoading(false)
        return
      }

      // signInAction handles redirect internally on success
      // No need for client-side redirect here after successful action
      // The next/navigation redirect in signInAction will take over

    } catch (err: any) {
      // Catch unexpected errors during the action call itself
      setError(err.message || "An error occurred during login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setIsLoading(true)
    setError(null)
    try {
      // SSR: POST to /api/auth/oauth
      const res = await fetch(`/api/auth/oauth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })
      let result
      try {
        result = await res.json()
      } catch {
        setError("An unexpected server error occurred. Please try again later.")
        setIsLoading(false)
        return
      }
      if (!res.ok) {
        setError(result?.error || "OAuth login failed")
        setIsLoading(false)
        return
      }
      // Redirect to the returned URL (OAuth provider)
      if (result?.url) {
        window.location.href = result.url
      } else {
        setError("OAuth provider URL missing.")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred with social login.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMagicLinkSent(false);
    setIsMagicLinkLoading(true);
    try {
      if (!magicLinkEmail) {
        setError("Please enter your email for the magic link.");
        setIsMagicLinkLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('email', magicLinkEmail);
      const result = await signInWithOtpAction(formData);

      if (!result.success) {
        setError(result.error || "Failed to send magic link.");
      } else {
        setMagicLinkSent(true);
        toast({
          title: "Magic Link Sent",
          description: "Please check your email for the magic link to sign in.",
          variant: "default",
        });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-4" />
          <span className="text-gray-700 dark:text-gray-200">Redirecting...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 mt-11">
        <Navbar />

        <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-20">
          <Card className="w-full max-w-md border-none shadow-lg dark:bg-gray-800">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center dark:text-white">Welcome back</CardTitle>
              <CardDescription className="text-center dark:text-gray-400">
                {showPasswordLogin ? "Enter your credentials to access your account" : "Enter your email to receive a magic link"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {showPasswordLogin ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="mail@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember-me" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                      Remember me
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                  {showPasswordLogin && (
                <Link
                  href="/forgot-password"
                  className="block text-right text-sm text-gray-400 hover:text-gray-300 font-medium"
                >
                  Forgot your password?
                </Link>
              )}
                </form>
              ) : (
                <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-link-email" className="dark:text-gray-300">Email for Magic Link</Label>
                    <Input
                      id="magic-link-email"
                      type="email"
                      placeholder="your@example.com"
                      value={magicLinkEmail}
                      onChange={(e) => { setMagicLinkEmail(e.target.value); setMagicLinkSent(false); }}
                      required
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
                    disabled={isMagicLinkLoading || isLoading}
                  >
                    {isMagicLinkLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Magic Link...
                      </div>
                    ) : magicLinkSent ? (
                      "Magic Link Sent!"
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" /> Send Magic Link
                      </>
                    )}
                  </Button>
                </form>
              )}

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full dark:bg-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground dark:bg-gray-800 dark:text-gray-400">
                    {showPasswordLogin ? "Or sign in with Magic Link" : "Or sign in with email and password"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={isLoading || isMagicLinkLoading}
                  className="w-full flex items-center gap-2 bg-gray-600 dark:hover:bg-gray-700 dark:text-white"
                >
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                   <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>

                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn("github")}
                  disabled={isLoading || isMagicLinkLoading}
                  className="w-full flex items-center gap-2 bg-gray-600 dark:hover:bg-gray-700 dark:text-white"
                >

                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                      fill="currentColor"
                    />
                  </svg>

                  GitHub
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowPasswordLogin(!showPasswordLogin)}
                className="w-full flex items-center gap-2 bg-gray-600 dark:hover:bg-gray-700 dark:text-white"
                disabled={isLoading || isMagicLinkLoading}
              >
                {showPasswordLogin ? (
                  <>
                    <Mail className="mr-2 h-4 w-4" /> Switch to Magic Link Login
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" /> Switch to Password Login
                  </>
                )}
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-6">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Link href="/signup" className="text-rose-500 hover:text-rose-600 font-medium">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    </>
  )
}
