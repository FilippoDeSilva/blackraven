import { Mail, Bell } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Platform {
  id: string
  name: string
  icon: LucideIcon
  default?: boolean
}

// Notification platforms
export const notificationPlatforms: Platform[] = [
  { id: "email", name: "Email", icon: Mail, default: true },
  { id: "push", name: "Push Notifications", icon: Bell },
]

// Delivery platforms
export const deliveryPlatforms: Platform[] = [
  { id: "gmail", name: "Gmail", icon: Mail, default: true },
] 
