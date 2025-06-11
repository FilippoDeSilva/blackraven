// 'use client'

// import { Lock, Shield } from 'lucide-react'
// import { motion } from 'framer-motion'

// export default function BlackRavenLoader() {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center from-rose-600 to-purple-700">
//       <div className="relative w-32 h-32">
//         {/* Outer orbiting shields */}
//         {[...Array(6)].map((_, i) => (
//           <motion.div
//             key={i}
//             initial={{ rotate: 0 }}
//             animate={{ rotate: 360 }}
//             transition={{
//               repeat: Infinity,
//               duration: 6,
//               ease: "linear",
//               delay: i * 0.1,
//             }}
//             className="absolute top-1/2 left-1/2"
//             style={{
//               transform: `rotate(${i * 60}deg) translate(5.5rem)`,
//             }}
//           >
//             <Shield className="w-4 h-4 text-rose-400 dark:text-purple-400 opacity-80" />
//           </motion.div>
//         ))}

//         {/* Central glowing lock */}
//         <div className="flex items-center justify-center w-full h-full">
//           <div className="relative">
//             <motion.div
//               className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500 to-purple-500 blur-2xl opacity-30"
//               animate={{ scale: [1, 1.15, 1] }}
//               transition={{
//                 duration: 2,
//                 repeat: Infinity,
//                 ease: 'easeInOut',
//               }}
//             />
//             <Lock className="w-12 h-12 text-rose-500 dark:text-purple-400 drop-shadow-md" />
//           </div>
//         </div>
//       </div>

//       {/* Text below */}
//       <motion.p
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{
//           duration: 1,
//           repeat: Infinity,
//           repeatType: 'reverse',
//         }}
//         className="absolute bottom-16 text-sm text-gray-500 dark:text-gray-400 tracking-wide"
//       >
//         Securing your session...
//       </motion.p>
//     </div>
//   )
// }
