// /// <reference types="@testing-library/jest-dom" />
// import { render, screen, fireEvent, waitFor } from '@testing-library/react'
// import userEvent from '@testing-library/user-event'
// import { useRouter } from 'next/navigation'
// import { AuthProvider } from '@/components/auth-provider'
// import LoginPage from '@/app/login/page'
// import { createClient } from '@/lib/supabase/client'

// // Mock next/navigation
// jest.mock('next/navigation', () => ({
//   useRouter: jest.fn(),
//   usePathname: jest.fn().mockReturnValue('/login'),
//   useSearchParams: () => ({
//     get: jest.fn().mockReturnValue('/dashboard'),
//   }),
// }))

// // Mock Supabase client
// jest.mock('@/lib/supabase/client', () => ({
//   createClient: jest.fn(() => ({
//     auth: {
//       signInWithPassword: jest.fn(),
//       getSession: jest.fn(),
//       onAuthStateChange: jest.fn(() => ({
//         data: {
//           subscription: {
//             unsubscribe: jest.fn(),
//           },
//         },
//       })),
//     },
//   })),
// }))

// // Mock toast
// jest.mock('@/components/ui/use-toast', () => ({
//   toast: jest.fn(),
// }))

// describe('Authentication Flow', () => {
//   const mockRouter = {
//     push: jest.fn(),
//   }

//   const mockSupabase = {
//     auth: {
//       signInWithPassword: jest.fn(),
//       getSession: jest.fn(),
//       onAuthStateChange: jest.fn(() => ({
//         data: {
//           subscription: {
//             unsubscribe: jest.fn(),
//           },
//         },
//       })),
//     },
//   }

//   const mockLocalStorage = {
//     getItem: jest.fn(),
//     setItem: jest.fn(),
//     removeItem: jest.fn(),
//     clear: jest.fn(),
//     length: 0,
//     key: jest.fn(),
//   }

//   beforeEach(() => {
//     jest.clearAllMocks()
//     ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
//     ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
//     // Reset localStorage mock
//     Object.defineProperty(window, 'localStorage', {
//       value: mockLocalStorage,
//       writable: true,
//     })
//   })

//   it('should handle successful login and redirect to dashboard', async () => {
//     // Mock successful login
//     mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
//       data: {
//         user: { id: '123', email: 'test@example.com' },
//         session: { access_token: 'token' },
//       },
//       error: null,
//     })

//     // Mock session check
//     mockSupabase.auth.getSession.mockResolvedValueOnce({
//       data: { session: { user: { id: '123', email: 'test@example.com' } } },
//       error: null,
//     })

//     render(
//       <AuthProvider>
//         <LoginPage />
//       </AuthProvider>
//     )

//     // Fill in the form
//     await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
//     await userEvent.type(screen.getByLabelText(/password/i), 'password123')

//     // Submit the form
//     await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

//     // Wait for the redirect
//     await waitFor(() => {
//       expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
//     })
//   })

//   it('should handle login error and show error message', async () => {
//     // Mock failed login
//     mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
//       data: { user: null, session: null },
//       error: { message: 'Invalid credentials' },
//     })

//     render(
//       <AuthProvider>
//         <LoginPage />
//       </AuthProvider>
//     )

//     // Fill in the form
//     await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
//     await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword')

//     // Submit the form
//     await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

//     // Wait for error message
//     await waitFor(() => {
//       expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
//     })
//   })

//   it('should handle remember me functionality', async () => {
//     // Mock successful login
//     mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
//       data: {
//         user: { id: '123', email: 'test@example.com' },
//         session: { access_token: 'token' },
//       },
//       error: null,
//     })

//     render(
//       <AuthProvider>
//         <LoginPage />
//       </AuthProvider>
//     )

//     // Fill in the form and check remember me
//     await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
//     await userEvent.type(screen.getByLabelText(/password/i), 'password123')
//     await userEvent.click(screen.getByLabelText(/remember me/i))

//     // Submit the form
//     await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

//     // Check if email was saved to localStorage
//     await waitFor(() => {
//       expect(mockLocalStorage.setItem).toHaveBeenCalledWith('rememberedEmail', 'test@example.com')
//     })
//   })
// }) 