"use client"

import React, { useRef, useState } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { SuccessErrorModal } from "@/app/dashboard/components/SuccessErrorModal"
import { Loader2, Camera } from "lucide-react"

interface ProfileImageUploadModalProps {
  isOpen: boolean
  onClose: (uploadSuccess: boolean, newAvatarUrl?: string) => void
}

export default function ProfileImageUploadModal({ isOpen, onClose }: ProfileImageUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus({ success: false, message: "No file selected." })
      return
    }

    setIsLoading(true)
    setUploadStatus(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const res = await fetch("/api/user-profile", {
        method: "POST",
        body: formData,
      })

      const result = await res.json()
      if (result.success) {
        setUploadStatus({ success: true, message: "Profile image uploaded successfully!" })
        onClose(true, result.data)
      } else {
        throw new Error(result.error || "Upload failed.")
      }
    } catch (error: any) {
      setUploadStatus({ success: false, message: error.message || "Something went wrong." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCircleClick = () => {
    fileInputRef.current?.click()
  }

  const handleCloseModal = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsLoading(false)
    setUploadStatus(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    onClose(false)
  }

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={handleCloseModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Profile Picture</AlertDialogTitle>
            <AlertDialogDescription>
              Click the circle below to select a profile picture.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Clickable Circle */}
          <div className="flex justify-center my-4">
            <div
              className="relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary transition"
              onClick={handleCircleClick}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Camera className="w-8 h-8" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <Button onClick={handleUpload} disabled={isLoading || !selectedFile}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </span>
              ) : (
                "Upload"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success/Error Modal */}
      {uploadStatus && (
        <SuccessErrorModal
          open={!!uploadStatus}
          onOpenChange={() => setUploadStatus(null)}
          isSuccess={uploadStatus.success}
          message={uploadStatus.message}
          modalKey={Date.now()}
        />
      )}
    </>
  )
}
