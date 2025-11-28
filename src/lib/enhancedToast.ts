import { toast } from "@/hooks/use-toast";
import { playSound } from "@/lib/sounds";

interface EnhancedToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  type?: 'success' | 'achievement' | 'error' | 'notification';
  duration?: number;
}

export const enhancedToast = ({
  title,
  description,
  variant = "default",
  type = 'notification',
  duration = 3000,
}: EnhancedToastProps) => {
  // Play sound effect
  playSound(type);
  
  // Show toast with animation
  toast({
    title,
    description,
    variant,
    duration,
  });
};

// Convenience methods
export const successToast = (title: string, description?: string) => {
  enhancedToast({ title, description, type: 'success' });
};

export const achievementToast = (title: string, description?: string) => {
  enhancedToast({ 
    title, 
    description, 
    type: 'achievement',
    duration: 5000, // Show longer for achievements
  });
};

export const errorToast = (title: string, description?: string) => {
  enhancedToast({ 
    title, 
    description, 
    variant: 'destructive', 
    type: 'error' 
  });
};
