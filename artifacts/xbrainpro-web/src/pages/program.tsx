import { useGetCurrentProgram } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Loader2, Lock, CheckCircle2, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Program() {
  const { data: program, isLoading } = useGetCurrentProgram();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!program) {
    setLocation("/paths");
    return null;
  }

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4 text-primary text-xs font-bold uppercase tracking-widest">
          Active Protocol
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">{program.title || program.pathTitle}</h1>
        {program.summary && (
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            {program.summary}
          </p>
        )}
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-4 bottom-4 w-1 bg-white/5 rounded-full md:left-1/2 md:-ml-0.5" />

        <div className="space-y-8 md:space-y-12">
          {program.levels.map((level, idx) => {
            const isCompleted = level.status === "completed";
            const isActive = level.status === "active";
            const isLocked = level.status === "locked";

            return (
              <motion.div 
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative flex items-center md:justify-center ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Timeline node */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-background"
                  style={{
                    backgroundColor: isCompleted ? 'hsl(var(--primary))' : isActive ? 'hsl(var(--background))' : 'hsl(var(--muted))',
                    borderColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--background))',
                    boxShadow: isActive ? '0 0 20px hsl(var(--primary)/0.5)' : 'none'
                  }}
                >
                  {isCompleted && <CheckCircle2 className="w-5 h-5 text-white" />}
                  {isActive && <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />}
                  {isLocked && <Lock className="w-4 h-4 text-background" />}
                </div>

                {/* Content Card */}
                <div className={`ml-16 md:ml-0 md:w-[45%] ${idx % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                  <div className={`glass-card p-6 rounded-3xl border transition-all ${
                    isActive ? 'border-primary/50 shadow-[0_0_30px_rgba(var(--primary),0.15)] bg-white/10' : 
                    isCompleted ? 'border-white/10 opacity-70' : 
                    'border-transparent bg-white/5 opacity-50 grayscale-[50%]'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Phase 0{level.levelNumber}
                        </div>
                        <h3 className="text-xl font-heading font-bold text-white">{level.title}</h3>
                      </div>
                      <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                        {level.xpReward} XP
                      </div>
                    </div>

                    {level.description && (
                      <p className="text-sm text-muted-foreground mb-6">
                        {level.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">Tasks ({level.tasks.length})</div>
                      {level.tasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center gap-3 text-sm">
                          <div className={`w-1.5 h-1.5 rounded-full ${task.completed ? 'bg-primary' : 'bg-white/20'}`} />
                          <span className={task.completed ? 'text-white/50 line-through' : 'text-white/80'}>{task.title}</span>
                        </div>
                      ))}
                      {level.tasks.length > 3 && (
                        <div className="text-xs text-muted-foreground italic mt-2">
                          + {level.tasks.length - 3} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
