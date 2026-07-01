import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListPaths, useCreateProgram, getGetDashboardQueryKey, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Start() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const pathKey = searchParams.get("path");
  
  const { data: paths } = useListPaths();
  const createProgram = useCreateProgram();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [duration, setDuration] = useState<number>(30);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const selectedPath = paths?.find(p => p.key === pathKey);

  useEffect(() => {
    if (!pathKey && paths?.length) {
      setLocation("/paths");
    }
  }, [pathKey, paths, setLocation]);

  const generationSteps = [
    "Analyzing profile parameters...",
    "Synthesizing neural pathways...",
    "Structuring daily protocols...",
    "Calibrating XP rewards...",
    "Finalizing architecture..."
  ];

  useEffect(() => {
    if (generating) {
      const interval = setInterval(() => {
        setGenerationStep(s => {
          if (s < generationSteps.length - 1) return s + 1;
          clearInterval(interval);
          return s;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [generating, generationSteps.length]);

  const handleGenerate = () => {
    if (!selectedPath) return;
    setGenerating(true);

    createProgram.mutate(
      { data: { pathKey: selectedPath.key, durationDays: duration } },
      {
        onSuccess: () => {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
            setLocation("/dashboard");
          }, 1500); // Give the animation a moment to finish
        },
        onError: (err) => {
          setGenerating(false);
          toast({
            title: "Generation Failed",
            description: err.error || "Could not generate protocol.",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (!selectedPath) return null;

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {!generating ? (
          <motion.div
            key="config"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            className="w-full max-w-2xl glass-card p-8 md:p-12 rounded-[2rem] border border-white/10 relative overflow-hidden"
          >
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen"
              style={{ background: `radial-gradient(circle at top right, ${selectedPath.accent}, transparent 60%)` }}
            />

            <div className="relative z-10 text-center">
              <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-2">Configure Protocol</h1>
              <p className="text-xl mb-12" style={{ color: selectedPath.accent }}>
                {selectedPath.title}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-12">
                <button
                  onClick={() => setDuration(30)}
                  className={`p-6 rounded-2xl border-2 transition-all ${duration === 30 ? 'bg-white/10 border-white' : 'border-white/5 hover:border-white/20'}`}
                >
                  <div className="text-3xl font-heading font-bold text-white mb-1">30</div>
                  <div className="text-sm text-muted-foreground">Days</div>
                  <div className="mt-4 text-xs font-medium text-white/50 uppercase tracking-wider">Intense</div>
                </button>
                <button
                  onClick={() => setDuration(60)}
                  className={`p-6 rounded-2xl border-2 transition-all ${duration === 60 ? 'bg-white/10 border-white' : 'border-white/5 hover:border-white/20'}`}
                >
                  <div className="text-3xl font-heading font-bold text-white mb-1">60</div>
                  <div className="text-sm text-muted-foreground">Days</div>
                  <div className="mt-4 text-xs font-medium text-white/50 uppercase tracking-wider">Comprehensive</div>
                </button>
              </div>

              <Button 
                onClick={handleGenerate}
                className="w-full h-14 rounded-full text-lg font-bold shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all hover:scale-105"
                style={{ backgroundColor: selectedPath.accent, color: '#fff' }}
              >
                Generate Architecture <ArrowRight className="ml-2" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-md text-center"
          >
            <div className="relative w-32 h-32 mx-auto mb-12">
              <div className="absolute inset-0 rounded-full border-t-2 border-white animate-spin" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-2 rounded-full border-r-2 border-white/50 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
              <div className="absolute inset-4 rounded-full border-b-2 border-white/20 animate-spin" style={{ animationDuration: '1s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              {generationSteps.map((step, idx) => (
                <motion.div 
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: idx <= generationStep ? 1 : 0, y: idx <= generationStep ? 0 : 10 }}
                  className="flex items-center gap-3 text-sm font-mono"
                >
                  {idx < generationStep ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : idx === generationStep ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/10" />
                  )}
                  <span className={idx <= generationStep ? "text-white" : "text-white/30"}>
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Dummy icon
function Brain(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>
  );
}
