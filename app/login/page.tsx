"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Loader2, Mail, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { Navbar } from "@/components/navbar"
import Footer from "@/components/footer"
import { signInWithOtpAction } from "@/lib/actions/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<"google" | "github" | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [sentToEmail, setSentToEmail] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  useEffect(() => {
    // Check for remembered email
    const rememberedEmail = localStorage.getItem("rememberedEmail")
    if (rememberedEmail) {
      setEmail(rememberedEmail)
    }
  }, [])

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsMagicLinkLoading(true);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setIsMagicLinkLoading(false);
      return;
    }

    try {
      // Save email for future use
      localStorage.setItem("rememberedEmail", email);
      
      const formData = new FormData();
      formData.append('email', email);
      
      await signInWithOtpAction(formData);
      
      // If we get here, it means the magic link was sent successfully
      setSentToEmail(email);
      setMagicLinkSent(true);
      setEmail("");
    } catch (err: any) {
      // Check if this is a redirect error (which is actually success)
      if (err?.digest?.startsWith('NEXT_REDIRECT')) {
        // This is actually a success case
        setSentToEmail(email);
        setMagicLinkSent(true);
        setEmail("");
        return;
      }
      
      console.error("Magic link error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setIsOAuthLoading(provider);
    setError(null);
    
    try {
      const res = await fetch(`/api/auth/oauth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          provider,
          redirectTo: `${window.location.origin}/auth/callback`
        }),
      });

      const result = await res.json();
      
      if (!res.ok || !result) {
        throw new Error(result?.error || "Failed to initialize OAuth login. Please try again.");
      }

      if (!result.url) {
        throw new Error("OAuth provider URL missing. Please try again.");
      }

      // Set redirecting state before navigation
      setIsRedirecting(true);
      
      // Redirect to OAuth provider
      window.location.href = result.url;
    } catch (err: any) {
      console.error("OAuth error:", err);
      setError(err.message || "An error occurred with social login. Please try again.");
      setIsOAuthLoading(null);
      setIsRedirecting(false);
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
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 mt-11">
        <Navbar />

        <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-20">
          <Card className="w-full max-w-md border-none shadow-lg dark:bg-gray-800">
            {magicLinkSent ? (
              <>
                <CardHeader className="space-y-1">
                  <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-center dark:text-white">Check your email</CardTitle>
                  <CardDescription className="text-center dark:text-gray-400">
                    We've sent a magic link to:
                    <div className="font-medium text-gray-900 dark:text-gray-200 mt-1">{sentToEmail}</div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <p className="mb-2">Click the link in your email to sign in to your account.</p>
                    <p>The link will expire in 24 hours.</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => {
                      setMagicLinkSent(false);
                      setSentToEmail("");
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Button>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-center dark:text-white">Welcome back</CardTitle>
                  <CardDescription className="text-center dark:text-gray-400">
                    Enter your email to receive a secure login link
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
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
                        disabled={isMagicLinkLoading}
                        autoComplete="email"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
                      disabled={isMagicLinkLoading}
                    >
                      {isMagicLinkLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending link...
                        </div>
                      ) : (
                        "Send Magic Link"
                      )}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => handleOAuthSignIn("google")}
                      disabled={isMagicLinkLoading || isOAuthLoading !== null}
                      className="w-full flex items-center gap-2 bg-gray-600 dark:hover:bg-gray-700 dark:text-white"
                    >
                      {isOAuthLoading === "google" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
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
                      )}
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleOAuthSignIn("github")}
                      disabled={isMagicLinkLoading || isOAuthLoading !== null}
                      className="w-full flex items-center gap-2 bg-gray-600 dark:hover:bg-gray-700 dark:text-white"
                    >
                      {isOAuthLoading === "github" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                      GitHub
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    disabled={true}
                  >
                    &nbsp;
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
        <Footer />
      </div>
    </>
  );
}
