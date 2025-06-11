import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import PricingClient from './pricing-client';
import { createStripeCheckoutSession } from '@/lib/actions/stripe-actions';
import { Navbar } from '@/components/navbar';
import Footer from '@/components/footer';
import { redirect } from 'next/navigation';

// Define plan types - These can remain here if they are just types/constants
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

// Plans data and FAQ items - Can remain here as they are static data
const plans: Record<PlanTier, Plan> = {
  basic: {
    name: "Basic",
    description: "Essential features for individuals",
    price: {
      monthly: 9.99,
      quarterly: 26.99,
      yearly: 99.99,
    },
    features: [
      "5GB storage",
      "10 scheduled transfers per month",
      "Email delivery only",
      "7-day file retention",
      "Basic encryption",
    ],
  },
  premium: {
    name: "Premium",
    description: "Advanced features for professionals",
    price: {
      monthly: 19.99,
      quarterly: 53.99,
      yearly: 199.99,
    },
    features: [
      "25GB storage",
      "Unlimited scheduled transfers",
      "All delivery platforms",
      "30-day file retention",
      "Advanced encryption",
      "Priority support",
    ],
    highlight: true,
  },
  enterprise: {
    name: "Enterprise",
    description: "Complete solution for businesses",
    price: {
      monthly: 49.99,
      quarterly: 134.99,
      yearly: 499.99,
    },
    features: [
      "100GB storage",
      "Unlimited scheduled transfers",
      "All delivery platforms",
      "90-day file retention",
      "Military-grade encryption",
      "24/7 dedicated support",
      "Custom branding",
      "Team management",
    ],
  },
}

// Discount percentages
const discounts = {
  quarterly: 10,
  yearly: 15,
}

// FAQ items
const faqItems = [
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes will be applied at the start of your next billing cycle.",
  },
  {
    question: "How secure is my payment information?",
    answer:
      "We use industry-standard encryption and security practices to protect your payment information. We never store your full credit card details on our servers.",
  },
  {
    question: "Is there a free trial?",
    answer: "We offer a 14-day free trial on all plans. No credit card required to start your trial.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards including Visa, Mastercard, American Express, and Discover.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. You'll continue to have access to your plan until the end of your current billing period.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We offer a 30-day money-back guarantee. If you're not satisfied with our service, contact our support team within 30 days of your purchase for a full refund.",
  },
]

export default async function PricingPage() {
  // Correctly get cookieStore and initialize Supabase client
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // redirect to login with returnTo query param
    cookieStore.set("error", "Authentication required.");
    cookieStore.set("returnTo", "/account");
    redirect("/login");
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <Navbar />
      {/* Pass static data and server action to the client component */}
      <PricingClient 
        user={user} 
        plans={plans}
        discounts={discounts}
        faqItems={faqItems}
        createStripeCheckoutSessionAction={createStripeCheckoutSession}
      />
      <Footer />
    </div>
  );
}
