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
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="w-full flex items-center gap-2"
                      onClick={() => handleOAuthSignIn("google")}
                      disabled={isLoading}
                    >
                      <ChromeIcon className="h-5 w-5" />
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full flex items-center gap-2"
                      onClick={() => handleOAuthSignIn("github")}
                      disabled={isLoading}
                    >
                      <GithubIcon className="h-5 w-5" />
                      GitHub
                    </Button>
                  </div>
                  <div className="relative">
                    <Separator className="my-4" />
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
                variant="link"
                className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => setShowPasswordSignup(!showPasswordSignup)}
                disabled={isLoading || isMagicLinkLoading}
              >
                {showPasswordSignup ? "Sign up with Magic Link" : "Sign up with Email and Password"}
              </Button>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-rose-500 hover:text-rose-400"
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

function ChromeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" x2="12" y1="8" y2="8" />
      <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
      <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
    </svg>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 3c0 0-1.03-.31-3.4 1.32A12.35 12.35 0 0 0 12 5.09c-2.5.01-4.9-.64-6.12-1.84-.74-1.12-1.54-1.32-1.54-1.32A5.07 5.07 0 0 0 3 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}
