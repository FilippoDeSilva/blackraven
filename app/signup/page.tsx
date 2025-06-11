"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/navbar";
import Footer from "@/components/footer";
import { signUpAction } from "@/lib/actions/auth";
import { signInWithOtpAction } from "@/lib/actions/auth"; // For magic link

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(true); // Renamed for signup context
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }

    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }

    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter";
    }

    if (!hasNumbers) {
      return "Password must contain at least one number";
    }

    if (!hasSpecialChar) {
      return "Password must contain at least one special character";
    }

    return null;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    } else {
      setProfilePicture(null);
      setProfilePicturePreview(null);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/oauth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      let result;
      try {
        result = await res.json();
      } catch {
        setError(
          "An unexpected server error occurred. Please try again later."
        );
        setIsLoading(false);
        return;
      }
      if (!res.ok) {
        setError(result?.error || "OAuth login failed");
        setIsLoading(false);
        return;
      }
      if (result?.url) {
        window.location.href = result.url;
      } else {
        setError("OAuth provider URL missing.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred with social login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkSignUp = async (e: React.FormEvent) => {
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
      const result = await signInWithOtpAction(formData); // Using signInWithOtpAction for signup

      if (!result.success) {
        setError(result.error || "Failed to send magic link.");
      } else {
        setMagicLinkSent(true);
        toast({
          title: "Magic Link Sent",
          description: "Please check your email for the magic link to sign up.",
          variant: "default",
        });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        setIsLoading(false);
        return;
      }
      const emailError = validateEmail(email);
      if (emailError) {
        setError(emailError);
        setIsLoading(false);
        return;
      }

      if (!username) {
        setError("Username is required.");
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("username", username);

      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      const result = await signUpAction(formData);

      if (!result.success) {
        setError(result.error || "Signup failed");
        setIsLoading(false);
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(
        err.message || "An error occurred during signup. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 mt-11">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-20">
          <Card className="w-full max-w-md border-none shadow-lg dark:bg-gray-800">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center dark:text-white">
                {showPasswordSignup ? "Create an Account" : "Sign Up with Magic Link"}
              </CardTitle>
              <CardDescription className="text-center dark:text-gray-400">
                {showPasswordSignup
                  ? "Enter your details below to create your account"
                  : "Enter your email to receive a magic link to sign up"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {showPasswordSignup ? (
                <form onSubmit={handleSubmit} className="space-y-4">
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
                  <div className="relative">
                    <Separator className="my-4 w-full dark:bg-gray-700" />
                    <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-4 text-xs text-gray-500 uppercase dark:text-gray-400">
                      OR
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="dark:text-gray-300">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="John Doe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-picture" className="dark:text-gray-300">Profile Picture (Optional)</Label>
                    <div className="flex items-center gap-2">
                      {profilePicturePreview && (
                        <img src={profilePicturePreview} alt="Profile Preview" className="w-16 h-16 rounded-full object-cover" />
                      )}
                      <Input
                        id="profile-picture"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
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
                      disabled={isLoading}
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
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="dark:text-gray-300">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleMagicLinkSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-link-email" className="dark:text-gray-300">Email</Label>
                    <Input
                      id="magic-link-email"
                      type="email"
                      placeholder="m@example.com"
                      value={magicLinkEmail}
                      onChange={(e) => setMagicLinkEmail(e.target.value)}
                      required
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isMagicLinkLoading || magicLinkSent}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
                    disabled={isMagicLinkLoading || magicLinkSent}
                  >
                    {isMagicLinkLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Magic Link...
                      </div>
                    ) : magicLinkSent ? (
                      <div className="flex items-center justify-center">
                        <Mail className="mr-2 h-4 w-4" />
                        Magic Link Sent!
                      </div>
                    ) : (
                      "Send Magic Link"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => setShowPasswordSignup(true)}
                    disabled={isLoading || isMagicLinkLoading}
                  >
                    Back to password signup
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              {showPasswordSignup && (
                <Link
                  href="/forgot-password"
                  className="block text-right text-sm text-gray-400 hover:text-gray-300 font-medium"
                >
                  Forgot your password?
                </Link>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center gap-2 bg-gray-600 dark:hover:bg-gray-700 dark:text-white"
                onClick={() => setShowPasswordSignup(!showPasswordSignup)}
                disabled={isLoading || isMagicLinkLoading}
              >
                {showPasswordSignup ? (
                  <>
                    <Mail className="mr-2 h-4 w-4" /> Sign up with Magic Link
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" /> Sign up with Email and Password
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-rose-500 hover:text-rose-600"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    </>
  );
}
