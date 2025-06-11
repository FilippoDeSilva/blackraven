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
import { ProfileImageUploadModal } from "@/app/dashboard/components/ProfileImageUploadModal"
import { useState } from "react"
import type { User } from "@supabase/supabase-js"

interface UserProfileButtonProps {
  appearance?: "profile" | "button"
  className?: string
  user?: User | null
}

export function UserProfileButton({ appearance = "button", className, user: propUser }: UserProfileButtonProps) {
  const router = useRouter()
  const { user: contextUser, signOut } = useAuthContext()
  const user = propUser || contextUser
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

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
            <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder-user.jpg"} alt={user.user_metadata?.username || user.email || "User"} />
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
        onClose={() => setIsUploadModalOpen(false)}
      />
    </DropdownMenu>
  )
}
