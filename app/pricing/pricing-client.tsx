'use client';

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
// import { useAuthContext } from "@/components/auth-provider" // Auth context might not be needed if user is passed as prop
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ChevronDown } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getStripe } from "@/lib/stripe"
import { User } from '@supabase/supabase-js';

// Define plan types
type BillingCycle = "monthly" | "quarterly" | "yearly"
type PlanTier = "basic" | "premium" | "enterprise"

interface Plan {
  name: string
  description: string
  price: {
    monthly: number
    quarterly: number
    yearly: number
  }
  features: string[]
  highlight?: boolean
}

interface PricingClientProps {
  user: User | null;
  plans: Record<PlanTier, Plan>;
  discounts: { quarterly: number; yearly: number };
  faqItems: { question: string; answer: string }[];
  createStripeCheckoutSessionAction: (priceId: string) => Promise<{ url?: string | null; error?: string }>;
}

export default function PricingClient({
  user,
  plans,
  discounts,
  faqItems,
  createStripeCheckoutSessionAction,
}: PricingClientProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const router = useRouter()
  // The user prop passed from the server component is the primary source of user data here.
  // useAuthContext() might be redundant if user is always passed, but can be kept if it provides other context.
  // const { user: authUser } = useAuthContext();
  // const currentUser = user || authUser; // Use prop user if available

  // Calculate price with discount
  const getPrice = (plan: Plan, cycle: BillingCycle) => {
    const basePrice = plan.price[cycle]
    // Add discount calculation if needed on the client side for display
    // const discountPercentage = discounts[cycle] || 0;
    // return basePrice * (1 - discountPercentage / 100);
    return basePrice; // Currently no discount applied in this client-side function
  }

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price)
  }

  // Handle plan selection
  const handleSelectPlan = async (planKey: PlanTier) => {
    if (!user) {
      // Redirect to login if not authenticated, using the user prop
      router.push("/login?callbackUrl=/pricing")
      return
    }

    setSelectedPlan(planKey)
    setIsProcessing(true)
    setPaymentError(null)

    try {
      // Call the server action passed as a prop
      // You might need a mapping from PlanTier + BillingCycle to Stripe Price ID
      // For now, using a placeholder. Replace with actual logic to get priceId.
      const priceId = `price_${planKey}_${billingCycle}`.toLowerCase(); // Placeholder - implement actual logic
      console.log(`Attempting to create checkout session for priceId: ${priceId}`);

      const { url, error } = await createStripeCheckoutSessionAction(priceId);

      if (error) {
        throw new Error(error)
      }

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error("Did not receive a valid checkout URL.")
      }
    } catch (error: any) {
      console.error("[PricingClient] Error handling plan selection:", error);
      setPaymentError(error.message || "Payment processing failed")
      toast({
        title: "Error",
        description: error.message || "Payment processing failed",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setSelectedPlan(null); // Reset selected plan state
    }
  }

  // Toggle FAQ item
  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  // Animation variants (can be kept here as they are UI related)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 },
    },
  }

  const faqVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" },
    }, }

  return (
    <main className="container mx-auto px-4 py-16 pt-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <h1 className="text-4xl font-bold mb-4 dark:text-white">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Select the perfect plan for your secure file sharing needs
        </p>
      </motion.div>

      {/* Billing cycle selector */}
      <div className="max-w-md mx-auto mb-12">
        <Tabs
          defaultValue="monthly"
          value={billingCycle}
          onValueChange={(value) => setBillingCycle(value as BillingCycle)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full dark:bg-gray-800">
            <TabsTrigger value="monthly" className="dark:data-[state=active]:bg-gray-700">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="quarterly" className="dark:data-[state=active]:bg-gray-700">
              Quarterly
              <Badge
                variant="outline"
                className="ml-2 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              >
                Save {discounts.quarterly}%
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="yearly" className="dark:data-[state=active]:bg-gray-700">
              Yearly
              <Badge
                variant="outline"
                className="ml-2 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              >
                Save {discounts.yearly}%
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
      >
        {(Object.keys(plans) as PlanTier[]).map((planKey) => {
          const plan = plans[planKey]
          const price = getPrice(plan, billingCycle)

          return (
            <motion.div key={planKey} variants={itemVariants}>
              <Card
                className={`h-full flex flex-col ${plan.highlight ? "border-rose-200 dark:border-rose-800 shadow-lg relative overflow-hidden" : ""} dark:bg-gray-800 dark:border-gray-700`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-bl-lg rounded-tr-lg bg-gradient-to-r from-rose-500 to-purple-500 text-white border-0 px-3 py-1.5">
                      Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle
                    className={`${plan.highlight ? "text-rose-600 dark:text-rose-400" : ""} dark:text-white`}
                  >
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold dark:text-white">{formatPrice(price)}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      /{billingCycle === "monthly" ? "month" : billingCycle === "quarterly" ? "quarter" : "year"}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                        <span className="dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleSelectPlan(planKey)}
                    className={`w-full ${
                      plan.highlight
                        ? "bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
                        : "dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    }`}
                    variant={plan.highlight ? "default" : "outline"}
                    disabled={isProcessing || selectedPlan === planKey}
                  >
                    {isProcessing && selectedPlan === planKey ? "Processing..." : "Select Plan"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mt-24">
        <h2 className="text-2xl font-bold text-center mb-8 dark:text-white">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqItems.map((item, i) => {
            return (
            <motion.div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
                onClick={() => toggleFaq(i)}
              >
                <h3 className="font-semibold text-lg dark:text-white">{item.question}</h3>
                <motion.div animate={{ rotate: expandedFaq === i ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedFaq === i && (
                  <motion.div
                    variants={faqVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="px-6 pb-4"
                  >
                    <p className="text-gray-600 dark:text-gray-400">{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
        </div>
      </div>
    </main>
  )
} 