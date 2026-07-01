import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden flex flex-col items-center justify-center text-center px-4">
      {/* Cinematic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-primary/20 blur-[100px] rounded-full mix-blend-screen opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_80%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-white/70 uppercase tracking-widest">Next Evolution AI</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold font-heading text-white tracking-tight mb-6 leading-tight text-glow">
          Rewire your reality.
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          XBrainPro isn't just an app. It's an AI-architected neural reprogramming engine. Choose your path. We build the blueprint. You execute the transformation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 rounded-full bg-white text-black hover:bg-white/90 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              Begin Transformation
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base h-14 px-8 rounded-full border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md">
              Resume Journey
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
