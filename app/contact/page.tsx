"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { toast } from "@/components/ui/use-toast"
import Footer from "@/components/footer"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Form validation
    if (!name || !email || !message) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Simulate form submission
    try {
      // In a real app, you would send the form data to an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setIsSubmitted(true)
      toast({
        title: "Message sent",
        description: "We've received your message and will get back to you soon.",
      })

      // Reset form after submission
      setName("")
      setEmail("")
      setSubject("")
      setMessage("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Hero Section */}
      <header className="pt-32 pb-20 text-center bg-gradient-to-br from-rose-600 to-purple-700 text-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Get in <span className="underline decoration-rose-300 decoration-4 underline-offset-4">Touch</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-rose-50">
              Have questions about BlackRaven? Our team is here to help you with any inquiries.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <Card className="border-none shadow-lg dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Send us a message</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="dark:text-gray-300">
                        Your Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="dark:text-gray-300">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="dark:text-gray-300">
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        placeholder="How can we help you?"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="dark:text-gray-300">
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Your message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        className="min-h-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
                      disabled={isSubmitting || isSubmitted}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Sending...
                        </span>
                      ) : isSubmitted ? (
                        <span className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Message Sent
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Mail className="h-6 w-6 text-rose-500" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email</h3>
                      <p className="mt-1 text-gray-600 dark:text-gray-400">support@BlackRaven.com</p>
                      <p className="mt-1 text-gray-600 dark:text-gray-400">sales@BlackRaven.com</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Phone className="h-6 w-6 text-rose-500" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Phone</h3>
                      <p className="mt-1 text-gray-600 dark:text-gray-400">+1 (555) 123-4567</p>
                      <p className="mt-1 text-gray-600 dark:text-gray-400">Mon-Fri, 9AM-6PM EST</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <MapPin className="h-6 w-6 text-rose-500" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Office</h3>
                      <p className="mt-1 text-gray-600 dark:text-gray-400">
                        123 Security Avenue
                        <br />
                        Suite 456
                        <br />
                        New York, NY 10001
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-rose-100 to-purple-100 dark:from-rose-900/30 dark:to-purple-900/30 rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Business Hours</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>9:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday:</span>
                    <span>10:00 AM - 4:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday:</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-rose-100 to-purple-100 dark:from-rose-900/30 dark:to-purple-900/30 rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Emergency Support</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  For urgent security matters, our emergency support team is available 24/7.
                </p>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-rose-500 mr-2" />
                  <span className="text-gray-900 dark:text-white font-medium">+1 (555) 999-8888</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <div className="rounded-xl overflow-hidden shadow-lg h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Interactive map would be displayed here</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
