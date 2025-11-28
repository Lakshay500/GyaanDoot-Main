import { useState, useEffect } from "react";
import { Moon, Sun, Palette, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

const themes = [
  { name: "Purple Dream", primary: "262 83% 58%", secondary: "280 100% 70%", accent: "340 82% 62%" },
  { name: "Ocean Blue", primary: "217 91% 60%", secondary: "204 94% 94%", accent: "199 89% 48%" },
  { name: "Emerald Forest", primary: "160 84% 39%", secondary: "142 71% 45%", accent: "173 58% 39%" },
  { name: "Sunset Orange", primary: "24 95% 53%", secondary: "43 96% 56%", accent: "14 91% 58%" },
  { name: "Rose Garden", primary: "330 81% 60%", secondary: "340 82% 67%", accent: "350 89% 60%" },
  { name: "Midnight Dark", primary: "250 90% 60%", secondary: "260 100% 65%", accent: "270 80% 55%" },
];

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const ThemeControls = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(themes[0]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme-preference");
    if (saved) {
      const theme = themes.find(t => t.name === saved) || themes[0];
      setCurrentTheme(theme);
      applyTheme(theme);
    }
  }, []);

  const applyTheme = (theme: typeof themes[0]) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--secondary", theme.secondary);
    root.style.setProperty("--accent", theme.accent);
    
    const hsl = theme.primary.split(" ");
    const glowHsl = `${hsl[0]} ${hsl[1]} ${Math.min(parseInt(hsl[2]) + 12, 100)}%`;
    root.style.setProperty("--primary-glow", glowHsl);
  };

  const handleThemeChange = (theme: typeof themes[0]) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    localStorage.setItem("theme-preference", theme.name);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Light/Dark Mode Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="relative transition-all duration-300 hover:scale-110"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* Color Scheme Customizer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative transition-all duration-300 hover:scale-110">
            <Palette className="h-5 w-5" />
            <span className="sr-only">Customize colors</span>
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Theme Customizer</SheetTitle>
            <SheetDescription>Choose your favorite color scheme for better readability</SheetDescription>
          </SheetHeader>
          <Separator className="my-4" />
          <div className="space-y-4">
            {themes.map((themeOption, idx) => (
              <motion.div
                key={themeOption.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <button
                  onClick={() => handleThemeChange(themeOption)}
                  className={cn(
                    "w-full p-4 rounded-lg border-2 transition-all hover:scale-105",
                    currentTheme.name === themeOption.name
                      ? "border-primary shadow-lg"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{themeOption.name}</span>
                    {currentTheme.name === themeOption.name && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="h-8 flex-1 rounded"
                      style={{ backgroundColor: `hsl(${themeOption.primary})` }}
                    />
                    <div
                      className="h-8 flex-1 rounded"
                      style={{ backgroundColor: `hsl(${themeOption.secondary})` }}
                    />
                    <div
                      className="h-8 flex-1 rounded"
                      style={{ backgroundColor: `hsl(${themeOption.accent})` }}
                    />
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
