"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Clock,
  LogOut,
  Mail,
  Send,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  Bell,
  Loader2,
  FileText,
  FileSpreadsheet,
  Image,
  Archive,
  File,
} from "lucide-react"
import { useNotifications } from "../../contexts/notification-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { useAuthContext } from "@/components/auth-provider"
import { deactivateFile, getScheduledTransfers, deleteScheduledTransferAndFile, sendScheduledTransferNow } from "@/lib/actions/file-actions"
import Footer from "@/components/footer"
import { UserProfileButton } from "@/components/userprofilebutton"
import type { User } from "@supabase/supabase-js"
import { ServerActionResult } from '@/lib/actions/utils'
import { ThemeSwitcher } from "@/components/theme-toggle"
import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import dynamic from "next/dynamic"

// Import the new refactored components
import { FileUpload } from "./components/FileUpload"
import { NotificationSettings } from "./components/NotificationSettings"
import { SuccessErrorModal } from "./components/SuccessErrorModal"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
}

// Notification platforms
const notificationPlatforms = [
  { id: "email", name: "Email", icon: Mail, default: true },
  { id: "push", name: "Push Notifications", icon: Bell },
]

// Delivery platforms
const deliveryPlatforms = [
  { id: "gmail", name: "Gmail", icon: Mail, default: true },
]

// File type icons
const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-6 h-6" />,
  doc: <FileText className="w-6 h-6" />,
  xls: <FileSpreadsheet className="w-6 h-6" />,
  img: <Image className="w-6 h-6" />,
  zip: <Archive className="w-6 h-6" />,
  default: <File className="w-6 h-6" />,
}

// Get file icon based on file type
const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() || ""

  if (["pdf"].includes(extension)) {
    return fileTypeIcons.pdf
  } else if (["doc", "docx", "txt"].includes(extension)) {
    return fileTypeIcons.doc
  } else if (["xls", "xlsx", "csv"].includes(extension)) {
    return fileTypeIcons.xls
  } else if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
    return fileTypeIcons.img
  } else if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return fileTypeIcons.zip
  }

  return fileTypeIcons.default
}

const ProfileImageUploadModal = dynamic(() => import("./components/ProfileImageUploadModal"), { ssr: false });

interface DashboardClientProps {
  user: User | null;
  initialScheduledTransfers: any[];
  createFileTransferAction: (formData: FormData) => Promise<ServerActionResult<any>>;
  createStripeCheckoutSessionAction: (priceId: string) => Promise<ServerActionResult<{ url?: string | null; error?: any; }>>;
  avatarUrl: string | null;
}

// Email validation helper
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function DashboardClient({ user: initialUser, initialScheduledTransfers, createFileTransferAction, avatarUrl }: DashboardClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams();
  const { notifications, markAsRead } = useNotifications()
  const [files, setFiles] = useState<File[]>([])
  const [message, setMessage] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000)) // Default to 1 day later
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["gmail"])
  const [passphrase, setPassphrase] = useState("")
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [passphraseError, setPassphraseError] = useState("")
  const [isLaunched, setIsLaunched] = useState(false)
  const [remainingTime, setRemainingTime] = useState("")
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [deactivateInput, setDeactivateInput] = useState("")
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showStartDateCalendar, setShowStartDateCalendar] = useState(false)
  const [showEndDateCalendar, setShowEndDateCalendar] = useState(false)
  const [recipientEmails, setRecipientEmails] = useState<{ [key: string]: string }>({
    gmail: "",
  })
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false)
  const [scheduledTransfers, setScheduledTransfers] = useState<any[]>(initialScheduledTransfers)
  const [transferTimers, setTransferTimers] = useState<{ [id: string]: string }>({})
  const [bruteForceDetected, setBruteForceDetected] = useState(false)
  const [loadingTransfers, setLoadingTransfers] = useState(false)
  const [activeTab, setActiveTab] = useState<"upload" | "scheduled">("upload")
  const [transferToDeactivate, setTransferToDeactivate] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalKey, setModalKey] = useState(0)
  const { user, refetchUser } = useAuthContext()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [avatarUrlState, setAvatarUrlState] = useState<string | null>(user?.user_metadata?.avatar_url || avatarUrl || "/placeholder-user.jpg")

  // Load user's notification preferences
  const [userNotificationPlatforms, setUserNotificationPlatforms] = useState<string[]>(["email"])

  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    // Default to email if no preferences are set
    setUserNotificationPlatforms(["email"])
  }, [initialUser])

  useEffect(() => {
    // Check for session_id in the URL (both ?session_id and &session_id)
    const sessionId = searchParams.get("session_id");
    console.log("[Stripe Finalize] session_id in URL:", sessionId);
    if (sessionId) {
      setFinalizing(true);
      // Call finalize-user API
      fetch("/api/stripe/finalize-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
        credentials: "include",
      })
        .then(async (res) => {
          const data = await res.json();
          console.log("[Stripe Finalize] API response:", data);
          if (data.success) {
            // Remove session_id from URL and reload dashboard
            console.log("[Stripe Finalize] Success, redirecting to /dashboard");
            router.replace("/dashboard");
          } else {
            console.error("[Stripe Finalize] API error:", data.error);
            toast({
              title: "Payment Finalization Error",
              description: data.error || "Failed to finalize payment.",
              variant: "destructive",
            });
            // Remove session_id from URL to prevent infinite loop
            router.replace("/dashboard");
          }
        })
        .catch((err) => {
          console.error("[Stripe Finalize] API fetch error:", err);
          toast({
            title: "Payment Finalization Error",
            description: err.message || "Failed to finalize payment.",
            variant: "destructive",
          });
          // Remove session_id from URL to prevent infinite loop
          router.replace("/dashboard");
        })
        .finally(() => setFinalizing(false));
    }
  }, [searchParams, router]);

  // Fetch scheduled transfers
  useEffect(() => {
    const fetchTransfers = async () => {
      if (activeTab === "scheduled") {
        setLoadingTransfers(true)
        try {
          const result = await getScheduledTransfers()
          if (result.success) {
            setScheduledTransfers(result.data || [])
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to fetch scheduled transfers",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Error fetching transfers:", error)
          toast({
            title: "Error",
            description: "Failed to fetch scheduled transfers",
            variant: "destructive",
          })
        } finally {
          setLoadingTransfers(false)
        }
      }
    }

    fetchTransfers()
  }, [activeTab])

  // Simulate upload progress
  useEffect(() => {
    if (uploading) {
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            setUploading(false)
            clearInterval(interval)
            return 100
          }
          return prev + 5
        })
      }, 200)

      return () => clearInterval(interval)
    }
  }, [uploading])

  // Update remaining time when launched
  useEffect(() => {
    if (isLaunched) {
      const interval = setInterval(() => {
        const now = new Date()
        const diff = endDate.getTime() - now.getTime()

        if (diff <= 0) {
          clearInterval(interval)
          setRemainingTime("Expired")
          // In a real app, this would trigger sending files
          toast({
            title: "Time expired!",
            description: "Files have been sent to recipients.",
            variant: "destructive",
          })
          setIsLaunched(false)
          return
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        setRemainingTime(`${days}d ${hours}h ${minutes}m ${seconds}s`)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isLaunched, endDate])

  // Realtime update for time remaining
  useEffect(() => {
    if (activeTab === "scheduled" && scheduledTransfers.length > 0) {
      const interval = setInterval(() => {
        setTransferTimers((prev) => {
          const updated: { [id: string]: string } = {}
          scheduledTransfers.forEach((transfer) => {
            const now = new Date()
            const end = new Date(transfer.end_date)
            const diff = end.getTime() - now.getTime()
            if (diff <= 0) {
              updated[transfer.id] = "Expired"
            } else {
              const days = Math.floor(diff / (1000 * 60 * 60 * 24))
              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
              const seconds = Math.floor((diff % (1000 * 60)) / 1000)
              updated[transfer.id] = `${days}d ${hours}h ${minutes}m ${seconds}s`
            }
          })
          return updated
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [activeTab, scheduledTransfers])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle platform selection
  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platformId)) {
        return prev.filter((id) => id !== platformId)
      } else {
        // Initialize recipient email when platform is selected
        if (!recipientEmails[platformId]) {
          setRecipientEmails((prev) => ({
            ...prev,
            [platformId]: "",
          }))
        }
        return [...prev, platformId]
      }
    })
  }

  // Handle recipient email change
  const handleRecipientChange = (platform: string, email: string) => {
    setRecipientEmails((prev) => ({
      ...prev,
      [platform]: email,
    }))
  }

  // Handle notification platform toggle
  const handleNotificationPlatformToggle = (platformId: string) => {
    setUserNotificationPlatforms((prev) => {
      // Email is required, can't be toggled off
      if (platformId === "email") return prev

      if (prev.includes(platformId)) {
        return prev.filter((id) => id !== platformId)
      } else {
        return [...prev, platformId]
      }
    })
  }

  // Save notification preferences
  const saveNotificationPreferences = async () => {
    try {
      await refetchUser()
      setNotificationSettingsOpen(false)
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      })
    } catch (error) {
      console.error("Error saving notification preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      })
    }
  }

  // Validate passphrase
  const validatePassphrase = (value: string) => {
    if (value.length < 8) {
      setPassphraseError("Passphrase must be at least 8 characters")
      return false
    }

    if (!/[a-z]/.test(value)) {
      setPassphraseError("Passphrase must include lowercase letters")
      return false
    }

    if (!/[A-Z]/.test(value)) {
      setPassphraseError("Passphrase must include uppercase letters")
      return false
    }

    if (!/[0-9]/.test(value)) {
      setPassphraseError("Passphrase must include numbers")
      return false
    }

    if (!/[^a-zA-Z0-9]/.test(value)) {
      setPassphraseError("Passphrase must include special characters")
      return false
    }

    setPassphraseError("")
    return true
  }

  // Handle launch
  const handleLaunch = async () => {
    console.log("[handleLaunch] Launch button clicked");
    if (files.length === 0) {
      console.log("[handleLaunch] No files selected");
      setModalMessage("Please select at least one file to share")
      setShowErrorModal(true)
      setModalKey(prevKey => prevKey + 1)
      return
    }

    if (selectedPlatforms.length === 0) {
      console.log("[handleLaunch] No platforms selected");
      setModalMessage("Please select at least one platform to send files")
      setShowErrorModal(true)
      setModalKey(prevKey => prevKey + 1)
      return
    }

    // Check if recipient emails are provided and valid
    const missingEmails = selectedPlatforms.filter((platform) => !recipientEmails[platform])
    if (missingEmails.length > 0) {
      console.log("[handleLaunch] Missing recipient emails for:", missingEmails);
      setModalMessage(`Please provide recipient details for: ${missingEmails.join(", ")}`)
      setShowErrorModal(true)
      setModalKey(prevKey => prevKey + 1)
      return
    }

    // Validate all recipient emails
    const invalidEmails = selectedPlatforms.filter((platform) => !isValidEmail(recipientEmails[platform]))
    if (invalidEmails.length > 0) {
      console.log("[handleLaunch] Invalid recipient emails for:", invalidEmails);
      setModalMessage(`Please provide valid email addresses for: ${invalidEmails.join(", ")}`)
      setShowErrorModal(true)
      setModalKey(prevKey => prevKey + 1)
      return
    }

    if (!validatePassphrase(passphrase)) {
      console.log("[handleLaunch] Invalid passphrase:", passphraseError);
      setModalMessage(passphraseError)
      setShowErrorModal(true)
      setModalKey(prevKey => prevKey + 1)
      return
    }

    // Simulate file upload
    setUploading(true)
    setUploadProgress(0)
    console.log('[handleLaunch] Starting file uploads...');
    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("filename", file.name);
        formData.append("message", message);
        formData.append("startDate", startDate.toISOString());
        formData.append("endDate", endDate.toISOString());
        formData.append("recipients", JSON.stringify(recipientEmails));
        formData.append("deactivation_passphrase", passphrase);
        console.log('[handleLaunch] Uploading file:', file.name, 'FormData:', formData);
        // Call the Server Action passed via props
        const result = await createFileTransferAction(formData);
        
        console.log('[handleLaunch] Upload result for', file.name, ':', result);

        // Return the structured result or error, ensuring it's an object
        return result && typeof result === 'object' ? result : { success: false, error: 'Unexpected result format from server action' };
      })
    );

    console.log('[handleLaunch] All upload promises resolved:', uploadResults);

    // Check if *any* upload failed based on the success property
    const anyFailure = uploadResults.some((r: ServerActionResult<any>) => !r.success);
    console.log('[handleLaunch] anyFailure:', anyFailure);

    if (!anyFailure) {
      console.log("No failures detected. Proceeding to show success modal.");
      setIsLaunched(true);
      setModalMessage("Your files will be sent when the timer expires");
      // Trigger modal visibility by setting state
      setShowSuccessModal(true);
      setModalKey(prevKey => prevKey + 1);
      // Clear form on successful launch of all files
      setFiles([])
      setMessage("")
      setPassphrase("")
      setSelectedPlatforms(["gmail"])
      setRecipientEmails({ gmail: "" })
      // New: Reset isLaunched immediately after showing success to allow new uploads
      setIsLaunched(false)
      const transfersResult = await getScheduledTransfers()
      if (transfersResult.success) {
        setScheduledTransfers(transfersResult.data || [])
      }
    } else {
      console.log("Failures detected. Showing error modal.");
      // Collect all error messages from failed uploads
      const errorMessages = uploadResults
          .filter((r: ServerActionResult<any>) => !r.success)
          .map((r: ServerActionResult<any>) => {
              // Use specific error or details field, or a generic message
              if (r.error) return `Error: ${r.error}`;
              if (r.details) return `Details: ${JSON.stringify(r.details)}`;
              return `Upload failed`; // Fallback
          });
      
      setModalMessage("Failed to upload one or more files:\n" + errorMessages.join("\n"));
      // Trigger modal visibility by setting state
      setShowErrorModal(true);
      setModalKey(prevKey => prevKey + 1);
      console.error('[handleLaunch] Upload failures:', errorMessages);
    }
  }

  // Handle deactivation attempt
  const handleDeactivate = async () => {
    if (!transferToDeactivate) return;
    if (bruteForceDetected) return;
    try {
      const formData = new FormData();
      formData.append('fileId', transferToDeactivate);
      formData.append('deactivationPass', deactivateInput);
      const result = await deactivateFile(formData);
      if (result.success) {
        // Delete the scheduled file from DB and bucket
        await deleteScheduledTransferAndFile(transferToDeactivate)
        setDeactivateDialogOpen(false)
        setTransferToDeactivate(null)
        setWrongAttempts(0)
        // Refresh scheduled transfers
        const transfersResult = await getScheduledTransfers()
        if (transfersResult.success) {
          setScheduledTransfers(transfersResult.data || [])
        }
        toast({
          title: "Transfer deactivated",
          description: "The scheduled file transfer has been cancelled and deleted.",
        })
      } else {
        const newAttempts = wrongAttempts + 1
        setWrongAttempts(newAttempts)
        if (newAttempts >= 5) {
          setBruteForceDetected(true)
          setDeactivateDialogOpen(false)
          setTransferToDeactivate(null)
          // Send the files immediately
          await sendScheduledTransferNow(transferToDeactivate)
          toast({
            title: "Possible bruteforcing detected!",
            description: "Sending the files immediately.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Incorrect passphrase",
            description: `Please try again. ${5 - newAttempts} attempts remaining.`,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error deactivating transfer:", error)
      toast({
        title: "Error",
        description: "Failed to deactivate transfer",
      })
    }
    setDeactivateInput("")
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await refetchUser()
      // The redirect is handled in the refetchUser function
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Animation variants
  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
  }

  const tabVariants = {
    inactive: {
      borderColor: "transparent",
      color: "var(--text-muted)",
    },
    active: {
      borderColor: "var(--primary)",
      color: "var(--text)",
    },
  }

  useEffect(() => {
    fetch("/api/user-profile", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        console.log("Fetched avatar data:", data);
        if (data.success && data.avatarUrl) {
          setAvatarUrlState(data.avatarUrl);
        }
      })
      .catch(() => {});
  }, []);

  if (finalizing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-lg font-semibold">Finalizing your payment and profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Avatar Display at the top of the dashboard */}
      {user && (
        <div className="flex flex-col items-center mt-8 mb-6">
          <Avatar className="w-32 h-32 border-4 border-rose-500 shadow-lg">
            <AvatarImage
              src={avatarUrlState || undefined}
              alt={user.user_metadata?.username || user.email || "User"}
              crossOrigin="anonymous"
            />
            <AvatarFallback className="text-4xl">
              {user.user_metadata?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <Button
            className="mt-4 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-500 text-white rounded-lg shadow hover:from-rose-600 hover:to-purple-600 transition font-semibold"
            onClick={() => setIsProfileModalOpen(true)}
          >
            Change Profile Image
          </Button>
          {/* Server component modal, rendered via dynamic import for SSR compatibility */}
          <ProfileImageUploadModal
            isOpen={isProfileModalOpen}
            onClose={async (uploadSuccess, newAvatarUrl) => {
              setIsProfileModalOpen(false);
              if (uploadSuccess) {
                try {
                  const res = await fetch("/api/user-profile", { credentials: "include" });
                  const data = await res.json();
                  if (data.success && data.avatarUrl) {
                    setAvatarUrlState(data.avatarUrl);
                  } else if (newAvatarUrl) {
                    setAvatarUrlState(newAvatarUrl);
                  }
                } catch {
                  if (newAvatarUrl) setAvatarUrlState(newAvatarUrl);
                }
              }
            }}
          />
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-800 border-b shadow-sm dark:border-gray-700">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4 md:px-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent">
              BlackRaven
            </h1>
            <Badge variant="outline" className="ml-2 dark:border-gray-600 dark:text-gray-300">
              Dashboard
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            {/* User profile button and details */}
            <UserProfileButton user={initialUser} />

            <ThemeSwitcher />

            {/* Update the notification bell button in the header section to make it functional */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {userNotificationPlatforms.length > 1 && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                  )}
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-96 overflow-y-auto">
                  <h3 className="p-4 text-lg font-semibold border-b dark:border-gray-700 dark:text-white">
                    Notifications
                  </h3>
                  <ul>
                    {notifications.length === 0 ? (
                      <li className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications</li>
                    ) : (
                      notifications.map((notification) => (
                        <li
                          key={notification.id}
                          className={`p-4 border-b last:border-b-0 cursor-pointer dark:border-gray-700 ${
                            notification.read ? "bg-gray-100 dark:bg-gray-700" : "bg-white dark:bg-gray-800"
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <p className="font-medium dark:text-white">{notification.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </li>
                      )))}
                  </ul>
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" onClick={() => setLogoutDialogOpen(true)}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container px-4 pt-6 md:px-6">
        <div className="border-b dark:border-gray-700 mb-6">
          <div className="flex space-x-4 sm:space-x-8">
            <motion.button
              variants={tabVariants}
              animate={activeTab === "upload" ? "active" : "inactive"}
              className="py-2 px-1 font-medium text-xs sm:text-sm border-b-2 transition-colors focus:outline-none"
              onClick={() => setActiveTab("upload")}
            >
              Upload Files
            </motion.button>
            <motion.button
              variants={tabVariants}
              animate={activeTab === "scheduled" ? "active" : "inactive"}
              className="py-2 px-1 font-medium text-xs sm:text-sm border-b-2 transition-colors focus:outline-none"
              onClick={() => setActiveTab("scheduled")}
            >
              Scheduled Transfers
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container px-2 sm:px-4 md:px-6 lg:px-8 pb-6 md:pb-8 lg:pb-12 max-w-full">
        <AnimatePresence mode="wait">
          {activeTab === "upload" ? (
            <motion.div
              key="upload"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            >
              <motion.div variants={itemVariants} className="md:col-span-2">
                <FileUpload
                  files={files}
                  onFileSelect={handleFileSelect}
                  onRemoveFile={handleRemoveFile}
                  message={message}
                  setMessage={setMessage}
                  isLaunched={isLaunched}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-8">
                {/* Timer Settings */}
                <Card
                  className="dark:bg-gray-800 dark:border-gray-700"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <Clock className="h-5 w-5 text-rose-500" />
                      Timer Settings
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Set when your files will be automatically sent
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="dark:text-gray-300">Start Date & Time</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Popover open={showStartDateCalendar} onOpenChange={setShowStartDateCalendar}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs sm:text-sm"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {format(startDate, "PPP")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-700">
                            <CalendarComponent
                              mode="single"
                              selected={startDate}
                              onSelect={(date) => {
                                if (date) {
                                  const newDate = new Date(date)
                                  newDate.setHours(startDate.getHours(), startDate.getMinutes())
                                  setStartDate(newDate)
                                  setShowStartDateCalendar(false)
                                }
                              }}
                              initialFocus
                              className="dark:bg-gray-800"
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          className="w-full sm:w-28 md:w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs sm:text-sm"
                          value={format(startDate, "HH:mm")}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":").map(Number)
                            const newDate = new Date(startDate)
                            newDate.setHours(hours, minutes)
                            setStartDate(newDate)
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="dark:text-gray-300">End Date & Time</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Popover open={showEndDateCalendar} onOpenChange={setShowEndDateCalendar}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs sm:text-sm"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {format(endDate, "PPP")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-700">
                            <CalendarComponent
                              mode="single"
                              selected={endDate}
                              onSelect={(date) => {
                                if (date) {
                                  const newDate = new Date(date)
                                  newDate.setHours(endDate.getHours(), endDate.getMinutes())
                                  setEndDate(newDate)
                                  setShowEndDateCalendar(false)
                                }
                              }}
                              initialFocus
                              className="dark:bg-gray-800"
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          className="w-full sm:w-28 md:w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs sm:text-sm"
                          value={format(endDate, "HH:mm")}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":").map(Number)
                            const newDate = new Date(endDate)
                            newDate.setHours(hours, minutes)
                            setEndDate(newDate)
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Files will be sent after:{" "}
                        <span className="font-medium dark:text-gray-300">
                          {format(endDate, "PPP")} at {format(endDate, "h:mm a")}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Selection */}
                <Card
                  className="dark:bg-gray-800 dark:border-gray-700"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <Send className="h-5 w-5 text-rose-500" />
                      Delivery Platforms
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">Choose where to send your files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {deliveryPlatforms.map((platform) => (
                        <div key={platform.id} className="space-y-1 sm:space-y-2">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Checkbox
                              id={`platform-${platform.id}`}
                              checked={selectedPlatforms.includes(platform.id)}
                              onCheckedChange={() => handlePlatformToggle(platform.id)}
                              className="dark:border-gray-500"
                            />
                            <Label
                              htmlFor={`platform-${platform.id}`}
                              className="flex items-center cursor-pointer dark:text-gray-300"
                            >
                              <platform.icon />
                              <span className="ml-2">{platform.name}</span>
                            </Label>
                          </div>

                          {selectedPlatforms.includes(platform.id) && (
                            <div className="ml-4 sm:ml-6 mt-1 sm:mt-2">
                              <Label htmlFor={`recipient-${platform.id}`} className="text-xs dark:text-gray-400">
                                Recipient {platform.name} address
                              </Label>
                              <Input
                                id={`recipient-${platform.id}`}
                                type="text"
                                placeholder={`Enter recipient ${platform.name} address`}
                                value={recipientEmails[platform.id] || ""}
                                onChange={(e) => handleRecipientChange(platform.id, e.target.value)}
                                className="mt-1 text-xs sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card
                  className="dark:bg-gray-800 dark:border-gray-700"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <AlertCircle className="h-5 w-5 text-rose-500" />
                      Security Settings
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">Set your deactivation passphrase</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="passphrase" className="dark:text-gray-300">
                          Deactivation Passphrase
                        </Label>
                        <div className="relative">
                          <Input
                            id="passphrase"
                            type={showPassphrase ? "text" : "password"}
                            placeholder="Enter secure passphrase"
                            value={passphrase}
                            onChange={(e) => {
                              setPassphrase(e.target.value)
                              validatePassphrase(e.target.value)
                            }}
                            className={`${passphraseError ? "border-red-500" : ""} pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassphrase(!showPassphrase)}
                            className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passphraseError && <p className="text-xs text-red-500 mt-1">{passphraseError}</p>}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Must be at least 8 characters with uppercase, lowercase, numbers, and special characters
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Launch Button */}
                <Card className="border-rose-100 dark:border-rose-900/30 bg-gradient-to-r from-rose-50 to-purple-50 dark:from-rose-900/20 dark:to-purple-900/20 dark:bg-gray-800">
                  <CardContent className="pt-6">
                    {!isLaunched ? (
                      <>
                        {uploading ? (
                          <div className="space-y-4">
                            <div className="flex justify-between text-sm dark:text-gray-300">
                              <span>Encrypting and uploading files...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2 dark:bg-gray-700" />
                          </div>
                        ) : (
                          <Button
                            className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white py-4 sm:py-6 text-base sm:text-lg font-medium"
                            onClick={handleLaunch}
                          >
                            Launch Secure Transfer
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="destructive"
                        className="w-full py-4 sm:py-6 text-sm sm:text-lg font-medium"
                        onClick={() => setDeactivateDialogOpen(true)}
                      >
                        <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        {remainingTime}
                      </Button>
                    )}

                    {isLaunched && (
                      <p className="text-center text-sm mt-2 text-gray-600 dark:text-gray-400">Click to deactivate</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="scheduled"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Clock className="h-5 w-5 text-rose-500" />
                    Scheduled Transfers
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">Manage your pending file transfers</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTransfers ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                    </div>
                  ) : scheduledTransfers.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-medium mb-2 dark:text-gray-300">
                        No scheduled transfers
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs sm:max-w-md mx-auto">
                        You don't have any pending file transfers. Create a new transfer to get started.
                      </p>
                      <Button
                        className="mt-4 bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
                        onClick={() => setActiveTab("upload")}
                      >
                        Create New Transfer
                      </Button>
                    </div>
                  ) : (
                    <div className={`space-y-3 sm:space-y-4 ${bruteForceDetected ? 'opacity-50 pointer-events-none' : ''}`}>
                      {bruteForceDetected && (
                        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded mb-2 text-center font-semibold">
                          Possible bruteforcing detected! Sending the files immediately.
                        </div>
                      )}
                      {scheduledTransfers.map((transfer) => (
                        <Card key={transfer.id} className="dark:bg-gray-700/50 dark:border-gray-600">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
                              <div className="space-y-2">
                                <h3 className="font-medium dark:text-white">{transfer.filename}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Scheduled: {new Date(transfer.created_at).toLocaleDateString()}<br />
                                  Time remaining: {transferTimers[transfer.id] || "-"}
                                </p>
                                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2">
                                  {transfer.platforms && transfer.platforms.length > 0
                                    ? transfer.platforms.map((platform: string) => (
                                        <div key={platform} className="flex items-center text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                                          <span className="font-medium dark:text-gray-200">{platform}:</span>
                                          <span className="ml-1 text-gray-600 dark:text-gray-300">{transfer.recipients?.[platform]}</span>
                                        </div>
                                      ))
                                    : Object.entries(transfer.recipients || {}).map(([platform, email]) => (
                                        <div key={platform} className="flex items-center text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                                          <span className="font-medium dark:text-gray-200">{platform}:</span>
                                          <span className="ml-1 text-gray-600 dark:text-gray-300">{String(email)}</span>
                                        </div>
                                      ))}
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="self-start sm:self-auto text-xs sm:text-sm"
                                onClick={() => {
                                  setTransferToDeactivate(transfer.id)
                                  setDeactivateDialogOpen(true)
                                }}
                              >
                                Deactivate
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Confirm Logout</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Are you sure you want to log out? Any unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivation Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent className="w-[90vw] max-w-md sm:max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Deactivate Transfer</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Enter your deactivation passphrase to cancel the scheduled file transfer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deactivate-passphrase" className="dark:text-gray-300">
                Deactivation Passphrase
              </Label>
              <Input
                id="deactivate-passphrase"
                type="password"
                placeholder="Enter your passphrase"
                value={deactivateInput}
                onChange={(e) => setDeactivateInput(e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            {wrongAttempts > 0 && (
              <p className="text-sm text-red-500">Incorrect passphrase. {5 - wrongAttempts} attempts remaining.</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeactivateDialogOpen(false)
                setTransferToDeactivate(null)
                setWrongAttempts(0)
              }}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button onClick={handleDeactivate}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Settings Dialog */}
      <NotificationSettings
        open={notificationSettingsOpen}
        onOpenChange={setNotificationSettingsOpen}
        selectedPlatforms={userNotificationPlatforms}
        onTogglePlatform={handleNotificationPlatformToggle}
        onSavePreferences={saveNotificationPreferences}
      />

      {/* Success/Error Modal */}
      <SuccessErrorModal
        open={showSuccessModal || showErrorModal}
        onOpenChange={(open) => {
          setShowSuccessModal(open);
          setShowErrorModal(open);
        }}
        isSuccess={showSuccessModal}
        message={modalMessage}
        modalKey={modalKey}
      />
      <Footer />
    </div>
  )
}
