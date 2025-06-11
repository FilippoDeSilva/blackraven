import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters long').max(100, 'Password cannot exceed 100 characters');
export const usernameSchema = z.string().min(3, 'Username must be at least 3 characters long').max(50, 'Username cannot exceed 50 characters');
export const fileIdSchema = z.string().uuid('Invalid file ID');
export const deactivationPassphraseSchema = z.string().min(8).regex(/[a-z]/, 'Passphrase must contain at least one lowercase letter').regex(/[A-Z]/, 'Passphrase must contain at least one uppercase letter').regex(/[0-9]/, 'Passphrase must contain at least one number').regex(/[^a-zA-Z0-9]/, 'Passphrase must contain at least one special character');
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema.optional(),
  avatarUrl: z.string().url('Invalid avatar URL format').optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const fileUploadPayloadSchema = z.object({
  files: z.array(z.object({
    name: z.string().min(1, 'File name is required'),
    size: z.number().positive('File size must be positive'),
    type: z.string().min(1, 'File type is required'),
  })),
  message: z.string().optional(),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  recipients: z.record(z.string(), emailSchema), // Assuming recipients are a map of string to email
  deactivationPassphrase: deactivationPassphraseSchema,
});

export const deactivateFileSchema = z.object({
  fileId: fileIdSchema,
  deactivationPass: deactivationPassphraseSchema,
});

export const launchProcessSchema = z.object({
  fileId: fileIdSchema,
}); 