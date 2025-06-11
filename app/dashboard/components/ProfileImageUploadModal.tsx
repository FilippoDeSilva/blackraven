"use client"

import React, { useState, useRef } from "react"
import { useFormStatus } from "react-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthContext } from "@/components/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { SuccessErrorModal } from "@/app/dashboard/components/SuccessErrorModal"
import { uploadProfileImage } from "@/lib/actions/user-actions"

interface ProfileImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileImageUploadModal({ isOpen, onClose }: ProfileImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, refetchUser } = useAuthContext()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null
    setSelectedFile(file)
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  const handleUploadAction = async (formData: FormData) => {
    if (!user) {
      setUploadStatus({ success: false, message: "User not logged in." });
      return;
    }

    if (!selectedFile) {
      setUploadStatus({ success: false, message: "No file selected." });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setUploadStatus(null);

    const result = await uploadProfileImage(formData);

    if (result.success) {
      setUploadStatus({ success: true, message: "Profile image uploaded successfully!" });
    } else {
      setUploadStatus({ success: false, message: result.error || "Upload failed." });
    }
    refetchUser(); // Re-fetch user context to get the latest avatar_url
    handleCloseModal(); // Close modal on success or failure
  };

  const handleCloseModal = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsLoading(false);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={handleCloseModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload Profile Image</AlertDialogTitle>
            <AlertDialogDescription>
              Select an image file to set as your profile picture.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form action={handleUploadAction}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="picture" className="text-right">
                  Picture
                </Label>
                <Input
                  id="picture"
                  type="file"
                  name="file"
                  className="col-span-3"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </div>
              {previewUrl && (
                <div className="flex justify-center">
                  <img src={previewUrl} alt="Image Preview" className="w-32 h-32 rounded-full object-cover border" />
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading} type="button">Cancel</AlertDialogCancel>
              <AlertDialogAction type="submit" disabled={!selectedFile || isLoading}>
                {isLoading ? "Uploading..." : "Upload"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
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