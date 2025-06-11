import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"
import { redirect } from "next/navigation";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, { message: "Email is required" })
  .email({ message: "Invalid email address" })

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[a-z]/, { message: "Password must include lowercase letters" })
  .regex(/[A-Z]/, { message: "Password must include uppercase letters" })
  .regex(/[0-9]/, { message: "Password must include numbers" })
  .regex(/[^a-zA-Z0-9]/, { message: "Password must include special characters" })

// Username validation schema
export const usernameSchema = z
  .string()
  .min(3, { message: "Username must be at least 3 characters" })
  .max(20, { message: "Username must be at most 20 characters" })
  .regex(/^[a-zA-Z0-9_-]+$/, { message: "Username can only contain letters, numbers, underscores, and hyphens" })

// Format date for display
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Format time for display
export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB"
  else return (bytes / 1073741824).toFixed(1) + " GB"
}

// Generate a random string for use as a file ID
export function generateRandomId(length = 10): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}