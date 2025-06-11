import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/utils"
import { ArrowRight, Play } from "lucide-react"
import Link from "next/link"

interface LandingButtonProps {
  variant: "primary" | "secondary"
  children: React.ReactNode
  href: string
  className?: string
}

export function LandingButton({
  variant,
  children,
  href,
  className,
}: LandingButtonProps) {
  return (
    <Link href={href}>
      <Button
        className={cn(
          "group relative overflow-hidden rounded-md px-6 py-3 text-base font-medium transition-all duration-200",
          "hover:shadow-md",
          variant === "primary" && "bg-[#1a365d] text-white hover:bg-[#2c5282]",
          variant === "secondary" && "bg-white/10 text-white hover:bg-white/20",
          className
        )}
      >
        <span className="relative z-10 flex items-center gap-2">
          {children}
          {variant === "primary" ? (
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          ) : (
            <Play className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          )}
        </span>
      </Button>
    </Link>
  )
} 