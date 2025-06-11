"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { signOutAction } from "@/lib/actions/auth"

interface AuthContextType {
  user: User | null
  signOut: () => Promise<void>
  updateNotificationPlatforms: (platforms: string[]) => Promise<void>
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabaseClient = createClientComponentClient();
    const getUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [])

  const signOut = async () => {
    await signOutAction();
  }

  const updateNotificationPlatforms = async (platforms: string[]) => {
    // Implement notification platform update logic here
    console.log("Updating notification platforms:", platforms)
  }

  const refetchUser = async () => {
    const supabaseClient = createClientComponentClient();
    const { data: { user } } = await supabaseClient.auth.getUser();
    setUser(user);
  }

  return (
    <AuthContext.Provider value={{ user, signOut, updateNotificationPlatforms, refetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}
