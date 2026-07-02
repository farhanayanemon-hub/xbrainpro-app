import { useListPaths } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Brain, Zap, Heart, Sparkles, TrendingUp, Target, Shield } from "lucide-react";

const pathIcons: Record<string, any> = {
  millionaire: TrendingUp,
  business: Target,
  heartbreak: Heart,
  happiness: Sparkles,
  superhuman: Zap,
  confidence: Shield,
  focus: Brain,
};

export default function Paths() {
  const { data: paths, isLoading } = useListPaths();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Choose Your Protocol</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Select the neuro-architectural pathway you wish to initialize. Each protocol is uniquely designed to rewire specific neural patterns over a 30 or 60 day period.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paths?.map((path, index) => {
          const Icon = pathIcons[path.key] || Brain;
          return (
            <motion.div
              key={path.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div 
                onClick={() => setLocation(`/start?path=${path.key}`)}
                className="group relative cursor-pointer h-full glass-card p-6 md:p-8 rounded-3xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-500"
              >
                {/* Accent glow on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at center, ${path.accent}, transparent 70%)` }}
                />

                <div className="relative z-10 flex flex-col h-full">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                    style={{ backgroundColor: `${path.accent}20`, color: path.accent }}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  <h3 className="text-2xl font-heading font-bold text-white mb-2 group-hover:text-glow transition-all" style={{ '--primary': path.accent } as any}>
                    {path.title}
                  </h3>
                  <p className="text-sm font-medium mb-4" style={{ color: path.accent }}>
                    {path.tagline}
                  </p>
                  
                  <p className="text-muted-foreground text-sm mb-8 flex-grow">
                    {path.description}
                  </p>

                  <div className="flex items-center text-white/50 group-hover:text-white transition-colors mt-auto text-sm font-medium">
                    Initialize Protocol
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
