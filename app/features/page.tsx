"use client"

import { motion } from "framer-motion"
import { Shield, Clock, Lock, Zap, FileText, Key, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { LandingButton } from "@/components/ui/landing-button"
import Footer from "@/components/footer"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

export default function FeaturesPage() {
  const features = [
    {
      icon: <Clock className="h-10 w-10 text-rose-500" />,
      title: "Time-Based Access",
      description:
        "Set precise time windows for file access. Files automatically expire when you want them to, ensuring your data is only available for the duration you specify.",
    },
    {
      icon: <Lock className="h-10 w-10 text-rose-500" />,
      title: "End-to-End Encryption",
      description:
        "Military-grade encryption ensures your files remain private and secure at all times. Your data is encrypted before it leaves your device and can only be decrypted by authorized recipients.",
    },
    {
      icon: <Shield className="h-10 w-10 text-rose-500" />,
      title: "Access Controls",
      description:
        "Define who can view, edit, or download your files with granular permission settings. Control exactly who has access to your sensitive information.",
    },
    {
      icon: <Zap className="h-10 w-10 text-rose-500" />,
      title: "Instant Revocation",
      description:
        "Immediately revoke access to shared files with our emergency deactivation system. One click is all it takes to secure your data if circumstances change.",
    },
    {
      icon: <FileText className="h-10 w-10 text-rose-500" />,
      title: "Comprehensive Audit Logs",
      description:
        "Track every interaction with your shared files. Know exactly who accessed your data, when they accessed it, and what actions they took.",
    },
    {
      icon: <Key className="h-10 w-10 text-rose-500" />,
      title: "Multi-Factor Authentication",
      description:
        "Add an extra layer of security with multi-factor authentication. Ensure only authorized recipients can access your sensitive files.",
    },
    {
      icon: <Users className="h-10 w-10 text-rose-500" />,
      title: "Team Collaboration",
      description:
        "Securely collaborate with team members with role-based permissions. Share files within your organization while maintaining strict security protocols.",
    },
    {
      icon: <Shield className="h-10 w-10 text-rose-500" />,
      title: "Compliance Ready",
      description:
        "Meet regulatory requirements with our GDPR, HIPAA, and SOC 2 compliant platform. BlackRaven helps you stay compliant while sharing sensitive information.",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Hero Section */}
      <header className="pt-32 pb-20 text-center bg-gradient-to-br from-rose-600 to-purple-700 text-white">
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto">
            <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Powerful Features for{" "}
              <span className="underline decoration-rose-300 decoration-4 underline-offset-4">Secure File Sharing</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-rose-50">
              BlackRaven combines advanced security features with intuitive design to give you complete control over
              your shared files.
            </motion.p>
          </motion.div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Advanced Security Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              BlackRaven provides powerful tools to ensure your files are only accessed by the right people at the right
              time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-none shadow dark:bg-gray-800">
                  <CardHeader>
                    <div className="mb-4 p-3 inline-block bg-rose-50 dark:bg-rose-900/30 rounded-lg">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-rose-600 to-purple-700 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Experience Secure File Sharing?</h2>
            <p className="text-xl mb-8 text-rose-50 max-w-2xl mx-auto">
              Join thousands of businesses that trust BlackRaven for their secure file sharing needs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {/* <Button
                asChild
                className="px-8 py-6 text-lg bg-white text-rose-600 rounded-full shadow-xl hover:shadow-2xl hover:scale-[1.03] transition duration-300 font-semibold"
              >
                <Link href="/signup">Start Free Trial</Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="px-8 py-6 text-lg border-2 border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 transition duration-300 font-medium"
              >
                <Link href="/contact">Schedule Demo</Link>
              </Button> */}

<LandingButton
                variant="primary"
                href="/signup"
                className="bg-white/10 text-white hover:bg-white/20"
              >
                Start Secure Sharing
              </LandingButton>
              <LandingButton
                variant="secondary"
                href="/demo"
                className="bg-white/10 text-white hover:bg-white/20"
              >
                Watch Demo
              </LandingButton>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
