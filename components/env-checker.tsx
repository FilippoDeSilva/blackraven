// "use client"

// import { useEffect, useState } from "react"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { AlertCircle } from "lucide-react"
// import { usePathname } from "next/navigation"

// export function EnvChecker() {
//   const [missingVars, setMissingVars] = useState<string[]>([])
//   const pathname = usePathname()

//   // Only show on home page for admin/developer awareness
//   // Don't disrupt the user experience on other pages
//   const shouldShow = pathname === "/"

//   useEffect(() => {
//     const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
//     const missing = requiredVars.filter((varName) => !process.env[varName])
//     setMissingVars(missing)
//   }, [])

//   if (missingVars.length === 0 || !shouldShow) return null

//   return (
//     <Alert
//       variant={"default"}
//       className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800"
//     >
//       <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
//       <AlertTitle className="text-yellow-600 dark:text-yellow-400">Developer Notice</AlertTitle>
//       <AlertDescription className="text-yellow-700 dark:text-yellow-300">
//         <p>The following environment variables are missing:</p>
//         <ul className="list-disc list-inside mt-2">
//           {missingVars.map((varName) => (
//             <li key={varName}>{varName}</li>
//           ))}
//         </ul>
//         <p className="mt-2">This is a preview environment. Add these variables to enable all features.</p>
//       </AlertDescription>
//     </Alert>
//   )
// }
