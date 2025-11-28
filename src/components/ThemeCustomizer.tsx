import { useState, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";

const themes = [
  { name: "Purple Dream", primary: "262 83% 58%", secondary: "280 100% 70%", accent: "340 82% 62%" },
  { name: "Ocean Blue", primary: "217 91% 60%", secondary: "204 94% 94%", accent: "199 89% 48%" },
  { name: "Emerald Forest", primary: "160 84% 39%", secondary: "142 71% 45%", accent: "173 58% 39%" },
  { name: "Sunset Orange", primary: "24 95% 53%", secondary: "43 96% 56%", accent: "14 91% 58%" },
  { name: "Rose Garden", primary: "330 81% 60%", secondary: "340 82% 67%", accent: "350 89% 60%" },
  { name: "Midnight Dark", primary: "250 90% 60%", secondary: "260 100% 65%", accent: "270 80% 55%" },
];

export const ThemeCustomizer = () => {
  const [currentTheme, setCurrentTheme] = useState(themes[0]);

  useEffect(() => {
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
    
    // Update glow variant
    const hsl = theme.primary.split(" ");
    const glowHsl = `${hsl[0]} ${hsl[1]} ${Math.min(parseInt(hsl[2]) + 12, 100)}%`;
    root.style.setProperty("--primary-glow", glowHsl);
  };

  const handleThemeChange = (theme: typeof themes[0]) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    localStorage.setItem("theme-preference", theme.name);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl">
          <Palette className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Theme Customizer</SheetTitle>
          <SheetDescription>Choose your favorite color scheme</SheetDescription>
        </SheetHeader>
        <div className="mt-8 space-y-4">
          {themes.map((theme, idx) => (
            <motion.div
              key={theme.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <button
                onClick={() => handleThemeChange(theme)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all hover:scale-105",
                  currentTheme.name === theme.name
                    ? "border-primary shadow-lg"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{theme.name}</span>
                  {currentTheme.name === theme.name && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex gap-2">
                  <div
                    className="h-8 flex-1 rounded"
                    style={{ backgroundColor: `hsl(${theme.primary})` }}
                  />
                  <div
                    className="h-8 flex-1 rounded"
                    style={{ backgroundColor: `hsl(${theme.secondary})` }}
                  />
                  <div
                    className="h-8 flex-1 rounded"
                    style={{ backgroundColor: `hsl(${theme.accent})` }}
                  />
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
