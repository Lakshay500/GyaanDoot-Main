import { useToast } from "@/hooks/use-toast";
import { playSound } from "@/lib/sounds";

export const useEnhancedToast = () => {
  const { toast } = useToast();

  const showToast = ({
    title,
    description,
    variant = "default" as "default" | "destructive",
    type = 'notification' as 'success' | 'achievement' | 'error' | 'notification',
    duration = 3000,
  }) => {
    playSound(type);
    toast({ title, description, variant, duration });
  };

  return {
    toast: showToast,
    success: (title: string, description?: string) => 
      showToast({ title, description, type: 'success' }),
    achievement: (title: string, description?: string) => 
      showToast({ title, description, type: 'achievement', duration: 5000 }),
    error: (title: string, description?: string) => 
      showToast({ title, description, variant: 'destructive', type: 'error' }),
  };
};
