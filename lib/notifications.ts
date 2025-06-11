"use server"

import nodemailer from "nodemailer"
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Send file notification to recipients
export async function sendFileNotification(file: any, senderId: string) {
  // Fetch sender profile
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
  const { data: sender } = await supabase.from("profiles").select("username, email").eq("id", senderId).single();

  // For each recipient platform, send notification
  const recipients = file.recipients as Record<string, string>

  for (const [platform, address] of Object.entries(recipients)) {
    if (platform === "gmail") {
      await sendEmailNotification({
        to: address,
        from: process.env.SMTP_FROM || "noreply@BlackRaven.com",
        subject: `${sender?.username || "Someone"} has shared files with you via BlackRaven`,
        text: `
          ${sender?.username || "Someone"} has shared files with you via BlackRaven.
          
          ${file.message ? `Message: ${file.message}` : ""}
          
          Files:
          - ${file.name} (${formatFileSize(file.size)})
          
          To access these files, please click the link below:
          ${process.env.NEXT_PUBLIC_APP_URL}/shared/${file.id}
          
          This is an automated message from BlackRaven.
        `,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #f43f5e, #a855f7); padding: 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">BlackRaven</h1>
              <p>Secure Time-Based File Sharing</p>
            </div>
            <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p><strong>${sender?.username || "Someone"}</strong> has shared files with you via BlackRaven.</p>
              
              ${file.message ? `<p><strong>Message:</strong> ${file.message}</p>` : ""}
              
              <h3>Files:</h3>
              <ul>
                <li>${file.name} (${formatFileSize(file.size)})</li>
              </ul>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/shared/${file.id}" style="background: linear-gradient(to right, #f43f5e, #a855f7); color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Access Files
                </a>
              </div>
              
              <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
                This is an automated message from BlackRaven.
              </p>
            </div>
          </div>
        `,
      })
    }

    // In a real app, you would implement other platform notifications here
    // For example, sending WhatsApp messages, Telegram messages, etc.
  }
}

// Send subscription expiration reminder
export async function sendSubscriptionReminder(userId: string, daysRemaining: number) {
  // Get user information
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
  const { data: user } = await supabase.from("profiles").select("username, email").eq("id", userId).single()

  if (!user) return

  await sendEmailNotification({
    to: user.email,
    from: process.env.SMTP_FROM || "noreply@BlackRaven.com",
    subject: `Your BlackRaven subscription expires in ${daysRemaining} days`,
    text: `
      Hello ${user.username},
      
      Your BlackRaven subscription will expire in ${daysRemaining} days.
      
      To continue using our services without interruption, please renew your subscription.
      
      Visit ${process.env.NEXT_PUBLIC_APP_URL}/pricing to renew.
      
      Thank you for using BlackRaven!
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #f43f5e, #a855f7); padding: 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">BlackRaven</h1>
          <p>Subscription Reminder</p>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hello ${user.username},</p>
          
          <p>Your BlackRaven subscription will expire in <strong>${daysRemaining} days</strong>.</p>
          
          <p>To continue using our services without interruption, please renew your subscription.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" style="background: linear-gradient(to right, #f43f5e, #a855f7); color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Renew Subscription
            </a>
          </div>
          
          <p style="margin-top: 30px;">Thank you for using BlackRaven!</p>
        </div>
      </div>
    `,
  })
}

// Helper function to send emails
async function sendEmailNotification({
  to,
  from,
  subject,
  text,
  html,
}: {
  to: string
  from: string
  subject: string
  text: string
  html: string
}) {
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    })
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

interface FileInfo {
    name: string;
    size: number;
}

export async function generateEmailContent(
    message: string,
    files: FileInfo[],
    accessUrl: string,
    endDate: Date
): Promise<string> {
    const fileList = files.map(file => `<li>${file.name} (${formatFileSize(file.size)})</li>`);

    return `
        <h2>New File Transfer Available</h2>
        <p>${message || "No message provided"}</p>
        
        <h3>Files:</h3>
        <ul>
            ${fileList.join('')}
        </ul>
        
        <p>To access these files, please click the link below:</p>
        <a href="${accessUrl}">Access Files</a>
        
        <p>This transfer will expire on ${await formatDate(endDate)}</p>
    `;
}

export async function formatDate(date: Date): Promise<string> {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

export async function getTimeRemaining(endDate: Date): Promise<string> {
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()
    
    if (diff <= 0) return "Expired"
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
}

export async function validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export async function validatePhoneNumber(phone: string): Promise<boolean> {
    const phoneRegex = /^\+?[\d\s-]{10,}$/
    return phoneRegex.test(phone)
}

// Example usage in a function:
export async function sendNotification(userId: string, ...args: any[]) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
  const { data: sender } = await supabase.from("profiles").select("username, email").eq("id", userId).single();
  // Now you can use sender safely
  const subject = `${sender?.username || "Someone"} has shared files with you via BlackRaven`;
  // ...rest of notification logic...
}

// If you see a nodemailer type error, add a declaration file or install @types/nodemailer
