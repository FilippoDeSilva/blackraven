"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import Footer from "@/components/footer"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const plans = [
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];
const billingCycles = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];
const notificationOptions = [
  { value: "email", label: "Email" },
  { value: "push", label: "Push Notifications" },
];

export default function CompleteProfilePage() {
  const [username, setUsername] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [notificationPreferences, setNotificationPreferences] = useState<string[]>(["email"]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleNotificationChange = (value: string) => {
    setNotificationPreferences((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    let avatar_url = null;
    try {
      // 1. Upload profile image if present
      if (profileImage) {
        const formData = new FormData();
        formData.append("file", profileImage);
        const res = await fetch("/api/user-profile", {
          method: "POST",
          body: formData,
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error);
        avatar_url = result.data;
      }
      // 2. Upsert user profile
      const upsertRes = await fetch("/api/user-upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          avatar_url,
          subscription_status: null, // will be set after payment
          notification_preferences: notificationPreferences,
        }),
        credentials: "include",
      });
      const upsertData = await upsertRes.json();
      if (!upsertData.success) throw new Error(upsertData.error);
      // 3. Create Stripe Checkout session
      const stripeRes = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, billingCycle }),
        credentials: "include",
      });
      const stripeData = await stripeRes.json();
      if (!stripeData.url) throw new Error("Stripe checkout failed");
      window.location.href = stripeData.url;
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <>
    <Navbar />
    <div className="max-w-lg mx-auto mt-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-extrabold text-center bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent">Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center">
            <div
              className="relative w-28 h-28 rounded-full border-4 border-accent bg-accent/30 dark:bg-accent/20 flex items-center justify-center cursor-pointer hover:border-primary transition mb-2 shadow-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-4xl text-accent">+</span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
            </div>
            <span className="text-muted-foreground text-xs">Click to upload profile image</span>
          </div>
          <div className="space-y-2">
            <label className="block font-medium" htmlFor="username">Username</label>
            <Input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoComplete="username"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="block font-medium" htmlFor="plan">Plan</label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="block font-medium" htmlFor="billingCycle">Billing Cycle</label>
              <Select value={billingCycle} onValueChange={setBillingCycle}>
                <SelectTrigger id="billingCycle">
                  <SelectValue placeholder="Select billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  {billingCycles.map(cycle => (
                    <SelectItem key={cycle.value} value={cycle.value}>{cycle.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block font-medium">Notification Preferences</label>
            <div className="flex gap-4">
              {notificationOptions.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={notificationPreferences.includes(opt.value)}
                    onCheckedChange={() => handleNotificationChange(opt.value)}
                    id={`notif-${opt.value}`}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          {error && <div className="text-destructive text-center text-sm font-medium mt-2">{error}</div>}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full text-lg font-bold py-3 bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
            onClick={handleSubmit}
            disabled={loading || !username}
          >
            {loading ? "Processing..." : "Continue to Payment"}
          </Button>
        </CardFooter>
      </Card>
    </div>
    <Footer />
    </>
  );
} 