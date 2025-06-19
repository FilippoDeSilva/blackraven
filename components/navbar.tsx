"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingButton } from "@/components/ui/landing-button"
import { ThemeSwitcher } from "./theme-toggle"
// import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Contact", href: "/contact" },
    // { name: "Sign In", href: "/login" },
  ]

  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md"
    >
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo */}
        <Link href="/">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent">
            BlackRaven
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <ul className="flex space-x-6">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`${pathname === link.href
                      ? "text-rose-600 dark:text-rose-400 font-medium border-b-2 border-rose-500 pb-1"
                      : "text-gray-700 dark:text-gray-300"
                    } hover:text-rose-600 dark:hover:text-rose-400 transition font-medium text-base`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* <ThemeToggle /> */}

          <div className="flex space-x-4">
            <LandingButton variant="primary" href="/login" className="rounded-3xl">
              Get Started
            </LandingButton>
          </div>
          <ThemeSwitcher />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-4 md:hidden">
          {/* <ThemeToggle /> */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
            className="text-gray-700 dark:text-gray-300"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800"
          >
            <div className="container mx-auto px-6 py-4 space-y-4">
              <ul className="space-y-4">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className={`block py-2 px-3 rounded-md ${pathname === link.href
                          ? "text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/20"
                          : "text-gray-700 dark:text-gray-300"
                        } hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-900/20 transition text-lg`}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* <div className="pt-4 border-t dark:border-gray-800 space-y-3">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-rose-500 to-purple-500 text-white rounded-full"
                >
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
