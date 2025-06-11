import { AuthProvider } from "@/components/auth-provider";
import React from "react";

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 