import { useGetDashboard, useGetTodayTasks, useCompleteTask, useUncompleteTask, getGetDashboardQueryKey, getGetTodayTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Flame, Trophy, Target, CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { data: dashboard, isLoading: loadingDash } = useGetDashboard();
  const { data: tasks, isLoading: loadingTasks } = useGetTodayTasks();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  if (loadingDash || loadingTasks) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (dashboard && !dashboard.hasProgram) {
    setLocation("/paths");
    return null;
  }

  const handleToggleTask = (taskId: number, currentlyCompleted: boolean) => {
    const mutation = currentlyCompleted ? uncompleteTask : completeTask;
    mutation.mutate(
      { id: taskId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTodayTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        }
      }
    );
  };

  const levelProgress = dashboard ? (dashboard.xp % 1000) / 10 : 0; // Assuming 1000 XP per level

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-8">
      {/* Top Stats Area */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        
        {/* Level Ring Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8 rounded-3xl flex-1 flex items-center justify-between relative overflow-hidden"
        >
          <div className="z-10">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Current Level</h2>
            <div className="text-5xl font-heading font-bold text-white mb-2">{dashboard?.level}</div>
            <div className="text-sm text-primary font-medium">{dashboard?.xp} Total XP</div>
          </div>
          
          <div className="relative w-24 h-24 md:w-32 md:h-32 z-10 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="50%" cy="50%" r="45%" className="fill-none stroke-white/10" strokeWidth="8" />
              <circle 
                cx="50%" cy="50%" r="45%" 
                className="fill-none stroke-primary" 
                strokeWidth="8" 
                strokeDasharray="100 100"
                strokeDashoffset={100 - levelProgress}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white opacity-80" />
            </div>
          </div>
          
          {/* Subtle glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 blur-[50px] pointer-events-none" />
        </motion.div>

        {/* Streak Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 md:p-8 rounded-3xl flex-1 flex flex-col justify-center relative overflow-hidden"
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Neural Streak</h2>
          <div className="flex items-baseline gap-2">
            <Flame className={`w-10 h-10 ${dashboard?.streak && dashboard.streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-white/20'}`} />
            <span className="text-5xl font-heading font-bold text-white">{dashboard?.streak || 0}</span>
            <span className="text-xl text-muted-foreground font-medium mb-1">Days</span>
          </div>
        </motion.div>
      </div>

      {/* Quote */}
      {dashboard?.quote && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-6 px-4"
        >
          <p className="text-lg md:text-xl font-heading font-medium text-white/80 italic">"{dashboard.quote}"</p>
        </motion.div>
      )}

      {/* Today's Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Today's Protocol
          </h3>
          <div className="text-sm font-medium text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
            {dashboard?.todayCompleted} / {dashboard?.todayTotal} Complete
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {tasks?.map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className={`group relative glass-card p-4 md:p-6 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                  task.completed ? 'border-primary/30 bg-primary/5' : 'border-white/5 hover:border-white/10'
                }`}
                onClick={() => handleToggleTask(task.id, task.completed)}
              >
                <div className="flex items-start gap-4 relative z-10">
                  <div className="flex-shrink-0 mt-1">
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    ) : (
                      <Circle className="w-6 h-6 text-white/30 group-hover:text-white/50 transition-colors" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-lg font-heading font-semibold transition-all ${task.completed ? 'text-white/70 line-through' : 'text-white'}`}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className={`text-sm mt-1 transition-all ${task.completed ? 'text-white/30' : 'text-muted-foreground'}`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">+{task.xp} XP</span>
                      {task.durationMinutes && (
                        <span className="text-xs font-medium text-white/50 bg-white/5 px-2 py-1 rounded-md">{task.durationMinutes} min</span>
                      )}
                      {task.timeOfDay && (
                        <span className="text-xs font-medium text-white/50 bg-white/5 px-2 py-1 rounded-md">{task.timeOfDay}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Completion glow overlay */}
                {task.completed && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"
                  />
                )}
              </motion.div>
            ))}
            
            {tasks?.length === 0 && (
              <div className="text-center py-12 glass-card rounded-3xl border border-white/5">
                <Target className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h4 className="text-xl font-heading font-bold text-white mb-2">No tasks assigned today.</h4>
                <p className="text-muted-foreground">Rest and recover. Your protocol resumes tomorrow.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
