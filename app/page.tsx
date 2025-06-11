"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Shield, Clock, Lock, ChevronRight, CheckCircle, Users, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
// import { EnvChecker } from "@/components/env-checker"
import { LandingButton } from "@/components/ui/landing-button"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
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

export default function HomePage() {
  const router = useRouter()
  const [supabaseAvailable, setSupabaseAvailable] = useState(true)

  useEffect(() => {
    // Check if Supabase environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      setSupabaseAvailable(false)
      console.warn("Supabase environment variables are missing. Some features may be limited.")
    }
  }, [])

  const features = [
    {
      icon: <Clock className="h-8 w-8 text-rose-500" />,
      title: "Time-Based Access",
      description: "Set precise time windows for file access. Files automatically expire when you want them to.",
    },
    {
      icon: <Lock className="h-8 w-8 text-rose-500" />,
      title: "End-to-End Encryption",
      description: "Military-grade encryption ensures your files remain private and secure at all times.",
    },
    {
      icon: <Shield className="h-8 w-8 text-rose-500" />,
      title: "Access Controls",
      description: "Define who can view, edit, or download your files with granular permission settings.",
    },
  ]

  const testimonials = [
    {
      quote: "BlackRaven revolutionized how our team shares sensitive documents with clients.",
      author: "Sarah Johnson",
      position: "CFO, TechCorp",
    },
    {
      quote: "The time-based security features give us peace of mind when sharing confidential files.",
      author: "Michael Chen",
      position: "Security Director, FinanceHub",
    },
  ]

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "256-bit", label: "Encryption" },
    { value: "10M+", label: "Files Secured" },
  ]

  const handleSignUp = () => {
    if (!supabaseAvailable) {
      // Show a message that authentication is not available in preview mode
      toast({
        title: "Preview Mode",
        description: "Authentication is not available in preview mode. Please set up Supabase environment variables.",
        variant: "default",
      })
    } else {
      router.push("/signup")
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col relative">
      <Navbar />

      {/* Environment Variable Checker */}
      {/* <div className="container mx-auto px-6 pt-20">
        <EnvChecker />
      </div> */}

      {/* Hero Section */}
      <header className="pt-60 pb-40 text-center flex-grow bg-gradient-to-br from-rose-600 to-purple-700 text-white">
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto">
            <motion.span
              variants={fadeIn}
              className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm font-medium mb-6 tracking-wider"
            >
              Secure File Sharing Reimagined
            </motion.span>
            <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl font-heading mb-6 leading-tight tracking-tight">
              Secure Your Confidential Files
            </motion.h1>
            <motion.p variants={fadeIn} className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-gray-300/90 leading-relaxed">
              Whether you're a journalist, military personnel, or handling sensitive information, BlackRaven provides 
              military-grade security for your confidential files. Set precise conditions, choose recipients, and 
              establish time-based triggers with our secure cloud platform.
            </motion.p>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
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
            </motion.div>
          </motion.div>
          {/* <div className="pt-60"></div> */}
        </div>
      </header>


      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-[#1e293b]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <h3 className="text-4xl font-bold text-[#1a365d] dark:text-white/80 
                [#60a5fa]
                ">{stat.value}</h3>
                <p className="text-[#475569] dark:text-[#94a3b8] mt-2 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#f8fafc] dark:bg-[#0f172a]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading mb-4 text-[#1a365d] dark:text-white">
              Advanced Security Features
            </h2>
            <p className="text-xl text-[#475569] dark:text-[#94a3b8] max-w-2xl mx-auto">
              BlackRaven provides military-grade security features to ensure your files remain protected at all times.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-md transition-shadow duration-200 border-none shadow dark:bg-[#1e293b]">
                  <CardContent className="pt-6">
                    <div className="mb-4 p-3 inline-block bg-[#1a365d]/10 dark:bg-[#60a5fa]/10 rounded-lg">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-heading mb-2 text-[#1a365d] dark:text-white">{feature.title}</h3>
                    <p className="text-[#475569] dark:text-[#94a3b8]">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">How BlackRaven Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Secure file sharing in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Upload Your Files",
                description: "Drag and drop your files onto our secure platform",
              },
              {
                step: "2",
                title: "Set Time Parameters",
                description: "Define when and for how long your files can be accessed",
              },
              {
                step: "3",
                title: "Share Securely",
                description: "Send secure links to your recipients with confidence",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: index * 0.3 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
                {index < 2 && (
                  <ChevronRight className="hidden md:block rotate-90 md:rotate-0 w-6 h-6 text-gray-400 dark:text-gray-500 mx-auto my-4" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-rose-600 to-purple-700 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Security-Conscious Teams</h2>
            <p className="text-xl max-w-2xl mx-auto text-rose-50">
              See what our customers have to say about BlackRaven
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-xl"
              >
                <p className="text-lg mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-rose-200">{testimonial.position}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-rose-100 to-purple-100 dark:from-rose-900/30 dark:to-purple-900/30 rounded-2xl p-8 md:p-12 shadow-lg">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                  Ready to secure your file sharing?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Join thousands of businesses that trust BlackRaven for their secure file sharing needs.
                </p>
                <ul className="space-y-2 mb-6">
                  {["14-day free trial", "No credit card required", "Cancel anytime"].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-rose-500 dark:text-rose-400 mr-2" />
                      <span className="dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handleSignUp}
                  className="bg-gradient-to-r from-rose-500 to-purple-500 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.03] transition duration-300"
                >
                  Start Your Free Trial
                </Button>
              </div>
              <div className="hidden md:block">
                <img
                  src="/placeholder.svg?height=300&width=300"
                  alt="Security illustration"
                  className="w-full max-w-sm mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
     <Footer />
    </div>
  )
}
