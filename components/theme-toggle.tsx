// "use client"

// import { useTheme } from "next-themes"
// import { useEffect, useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Moon, Sun } from "lucide-react"
// import { motion } from "framer-motion"

// export function ThemeToggle() {
//   const { theme, setTheme } = useTheme()
//   const [mounted, setMounted] = useState(false)

//   // Avoid hydration mismatch
//   useEffect(() => {
//     setMounted(true)
//   }, [])

//   if (!mounted) {
//     return null
//   }

//   return (
//     <Button
//       variant="ghost"
//       size="icon"
//       onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
//       className="relative overflow-hidden"
//     >
//       <div className="relative z-10">
//         {theme === "dark" ? (
//           <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
//         ) : (
//           <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
//         )}
//       </div>
//       <motion.div
//         className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-0 dark:opacity-20"
//         initial={false}
//         animate={{
//           opacity: theme === "dark" ? 0.2 : 0,
//           scale: theme === "dark" ? 1 : 0.8,
//         }}
//         transition={{ duration: 0.5, ease: "easeInOut" }}
//       />
//     </Button>
//   )
// }








"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={"sm"}>
          {theme === "light" ? (
            <Sun
              key="light"
              size={ICON_SIZE}
              className={"text-muted-foreground"}
            />
          ) : theme === "dark" ? (
            <Moon
              key="dark"
              size={ICON_SIZE}
              className={"text-muted-foreground"}
            />
          ) : (
            <Laptop
              key="system"
              size={ICON_SIZE}
              className={"text-muted-foreground"}
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content" align="start">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(e) => setTheme(e)}
        >
          <DropdownMenuRadioItem className="flex gap-2" value="light">
            <Sun size={ICON_SIZE} className="text-muted-foreground" />{" "}
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="dark">
            <Moon size={ICON_SIZE} className="text-muted-foreground" />{" "}
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="system">
            <Laptop size={ICON_SIZE} className="text-muted-foreground" />{" "}
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ThemeSwitcher };
