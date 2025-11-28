import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, CheckCircle2 } from 'lucide-react';
import { useChallenges } from '@/hooks/useChallenges';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export const DailyChallenges = () => {
  const { challenges, loading } = useChallenges();

  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Target className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No challenges available today</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Daily Challenges</h3>
      </div>
      
      {challenges.map((userChallenge, index) => {
        const challenge = userChallenge.challenge;
        const progressPercent = Math.min((userChallenge.progress / challenge.target_value) * 100, 100);

        return (
          <motion.div
            key={userChallenge.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`p-4 ${userChallenge.completed ? 'bg-primary/5 border-primary/20' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{challenge.title}</h4>
                    {userChallenge.completed && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{challenge.description}</p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Trophy className="h-3 w-3" />
                  {challenge.xp_reward} XP
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>
                    {userChallenge.progress} / {challenge.target_value}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
