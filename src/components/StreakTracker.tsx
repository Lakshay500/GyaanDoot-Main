import { Card } from '@/components/ui/card';
import { Flame, Trophy } from 'lucide-react';
import { useStreaks } from '@/hooks/useStreaks';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export const StreakTracker = () => {
  const { streak, loading } = useStreaks();

  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  if (!streak) return null;

  const isActive = streak.current_streak > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className={`h-5 w-5 ${isActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium text-muted-foreground">Daily Streak</span>
            </div>
            <div className="flex items-baseline gap-2">
              <motion.span
                key={streak.current_streak}
                initial={{ scale: 1.5, color: 'hsl(var(--primary))' }}
                animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                className="text-4xl font-bold"
              >
                {streak.current_streak}
              </motion.span>
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Keep learning daily to maintain your streak!
            </p>
          </div>

          <div className="text-center p-4 rounded-lg bg-background/50">
            <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
            <div className="text-2xl font-bold">{streak.longest_streak}</div>
            <div className="text-xs text-muted-foreground">Best</div>
          </div>
        </div>

        {/* Streak progress visualization */}
        <div className="mt-4 flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all ${
                i < streak.current_streak % 7
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          {Math.min(streak.current_streak % 7, 7)} / 7 this week
        </p>
      </Card>
    </motion.div>
  );
};
