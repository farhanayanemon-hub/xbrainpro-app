import { useGetProgress, useListBadges } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, Trophy, CheckCircle, Flame, Star, Shield, Zap } from "lucide-react";
import { Progress as ProgressBar } from "@/components/ui/progress";

export default function Progress() {
  const { data: progress, isLoading: loadingProgress } = useGetProgress();
  const { data: badges, isLoading: loadingBadges } = useListBadges();

  if (loadingProgress || loadingBadges) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const badgeIcons = [Star, Shield, Zap, Flame, Trophy, TrendingUp];

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Neural Analytics</h1>
        <p className="text-xl text-muted-foreground">Track your evolution parameters.</p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl border border-white/5">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Total XP</div>
          <div className="text-4xl md:text-5xl font-heading font-bold text-white">{progress?.xp}</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-3xl border border-white/5">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Current Level</div>
          <div className="text-4xl md:text-5xl font-heading font-bold text-white">{progress?.level}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-3xl border border-white/5">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Tasks Done</div>
          <div className="text-4xl md:text-5xl font-heading font-bold text-white">{progress?.totalTasksCompleted}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-3xl border border-white/5">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> Best Streak</div>
          <div className="text-4xl md:text-5xl font-heading font-bold text-white">{progress?.longestStreak}</div>
        </motion.div>
      </div>

      {/* Completion Rate */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-8 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 w-full">
          <h3 className="text-xl font-heading font-bold text-white mb-2">Protocol Adherence</h3>
          <p className="text-muted-foreground text-sm mb-6">Percentage of tasks completed on assigned days.</p>
          <ProgressBar value={progress?.completionRate || 0} className="h-4 bg-white/10" />
        </div>
        <div className="text-6xl font-heading font-bold text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">
          {progress?.completionRate}%
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3 className="text-2xl font-heading font-bold text-white mb-6 flex items-center gap-3">
          <Star className="w-6 h-6 text-yellow-500" /> Achievements
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges?.map((badge, idx) => {
            const Icon = badgeIcons[idx % badgeIcons.length];
            const isEarned = badge.earned;

            return (
              <div 
                key={badge.key}
                className={`glass-card p-6 rounded-3xl border flex flex-col items-center text-center transition-all ${
                  isEarned ? 'border-primary/30 bg-primary/5' : 'border-white/5 opacity-50 grayscale'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isEarned ? 'bg-primary/20 text-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]' : 'bg-white/10 text-white/30'}`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h4 className={`font-heading font-bold mb-1 ${isEarned ? 'text-white' : 'text-white/50'}`}>{badge.title}</h4>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
                {isEarned && badge.earnedAt && (
                  <div className="mt-3 text-[10px] uppercase tracking-widest text-primary font-medium">Earned</div>
                )}
              </div>
            );
          })}

          {badges?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No badges available in the system yet.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
