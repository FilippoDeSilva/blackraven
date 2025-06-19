"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import ProfileImageUploadModal from "@/app/dashboard/components/ProfileImageUploadModal"
import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"

interface UserProfileButtonProps {
  appearance?: "profile" | "button"
  className?: string
  user?: User | null
}

export function UserProfileButton({ appearance = "button", className, user: propUser }: UserProfileButtonProps) {
  const router = useRouter()
  const { user: contextUser, signOut, refetchUser } = useAuthContext()
  const user = propUser || contextUser
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "/placeholder-user.jpg")
  const [avatarError, setAvatarError] = useState(false)

  useEffect(() => {
    setAvatarUrl(user?.user_metadata?.avatar_url || "/placeholder-user.jpg")
  }, [user?.user_metadata?.avatar_url])

  // SSR-only: no user context, return null or static placeholder
  if (!user) {
    return null;
  }

  const handleProfile = () => {
    router.push("/dashboard")
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className} aria-label="User menu">
          <Avatar>
            <AvatarImage
              src={avatarError ? undefined : avatarUrl || undefined}
              alt={user.user_metadata?.username || user.email || "User"}
              onError={() => setAvatarError(true)}
            />
            <AvatarFallback>
              {user.user_metadata?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleProfile}>Profile</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsUploadModalOpen(true)}>Upload Profile Image</DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
      <ProfileImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={async (uploadSuccess, newAvatarUrl) => {
          setIsUploadModalOpen(false)
          if (uploadSuccess) {
            try {
              const res = await fetch("/api/user-profile", { credentials: "include" });
              const data = await res.json();
              if (data.success && data.avatarUrl) {
                setAvatarUrl(data.avatarUrl)
                setAvatarError(false)
              } else if (newAvatarUrl) {
                setAvatarUrl(newAvatarUrl)
                setAvatarError(false)
              }
            } catch {
              if (newAvatarUrl) setAvatarUrl(newAvatarUrl)
              setAvatarError(false)
            }
            refetchUser()
          }
        }}
      />
    </DropdownMenu>
  )
}
