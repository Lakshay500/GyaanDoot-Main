import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative transition-all duration-500 hover:scale-110 hover:rotate-12 active:scale-95"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-700 ease-in-out dark:-rotate-180 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-180 scale-0 transition-all duration-700 ease-in-out dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
