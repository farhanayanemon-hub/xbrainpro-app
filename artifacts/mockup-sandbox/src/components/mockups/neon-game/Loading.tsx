import React, { useState, useEffect } from "react";
import { Loader2, Info, Hexagon } from "lucide-react";
import "./_group.css";

export function Loading() {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    "Visit the Neon Plaza to meet other players and show off your style.",
    "VIP members get exclusive access to the Sky Lounge.",
    "Tap on players to view their profile and send a friend request.",
    "Complete Daily Tasks to earn bonus gems and experience.",
    "Visit the Store to customize your avatar with the latest drops."
  ];

  // Simulate loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Rotate tips
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length);
    }, 3500);
    return () => clearInterval(tipInterval);
  }, [tips.length]);

  return (
    <div className="w-[844px] h-[390px] bg-[#050505] relative overflow-hidden flex flex-col justify-between font-sans text-white select-none shadow-2xl">
      {/* Background Image with drift motion */}
      <div
        className="absolute inset-[-10%] w-[120%] h-[120%] animate-bg-drift opacity-70"
        style={{
          backgroundImage: 'url("/__mockup/images/ng-loading-bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Cinematic Vignette & Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 pointer-events-none" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:30px_30px]" />

      {/* Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

      {/* Scanline Effect */}
      <div className="absolute inset-0 animate-scan pointer-events-none opacity-30 bg-[linear-gradient(to_bottom,transparent_0%,rgba(6,182,212,0.3)_50%,transparent_100%)] h-[15px]" />

      {/* Top Header / Logo Section */}
      <div className="relative z-10 pt-6 px-10 flex justify-between items-start">
        <div className="flex flex-col animate-logo-in">
          <div className="flex items-center gap-2">
            <Hexagon className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            <h1 className="text-4xl font-black italic tracking-wider neon-text-glow-cyan uppercase">
              NEURA
            </h1>
            <h1 className="text-4xl font-black italic tracking-wider neon-text-glow uppercase text-pink-500">
              CITY
            </h1>
          </div>
          <div className="text-cyan-300/80 text-[10px] font-mono tracking-[0.4em] uppercase ml-10 mt-1">
            Connecting Realities
          </div>
        </div>

        {/* Player Mini-Profile (Mock) */}
        <div className="flex items-center gap-3 animate-fade-in delay-300 glass-panel rounded-full pr-1 pl-4 py-1 border border-white/10 bg-black/40">
           <div className="flex flex-col items-end justify-center">
             <span className="text-sm font-bold text-white drop-shadow-md leading-tight">NeoRider</span>
             <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest neon-text-glow">VIP Active</span>
           </div>
           <div className="w-10 h-10 rounded-full border-2 border-cyan-400 p-[2px] shadow-[0_0_10px_rgba(6,182,212,0.5)]">
             <img src="/__mockup/images/neura-neon-avatar.png" className="w-full h-full rounded-full object-cover" alt="Player Avatar" />
           </div>
        </div>
      </div>

      {/* Bottom Loading UI Area */}
      <div className="relative z-10 pb-6 px-10 flex flex-col gap-4 animate-slide-pop">
        <div className="flex justify-between items-end">
          {/* Rotating Tip */}
          <div className="flex items-center gap-3 max-w-[500px]">
            <div className="w-7 h-7 shrink-0 rounded-full bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center animate-glow-pulse shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Info className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-[13px] font-medium text-cyan-50 animate-text-pulse drop-shadow-md leading-snug">
              <span className="text-cyan-400 font-bold uppercase text-[11px] mr-2 tracking-widest">Tip:</span>
              {tips[tipIndex]}
            </p>
          </div>

          {/* Loading Status */}
          <div className="flex items-center gap-2 mb-1">
            <Loader2 className="w-4 h-4 text-pink-500 animate-spin-slow drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]" />
            <span className="text-xs font-bold tracking-widest text-pink-100 uppercase drop-shadow-md tabular-nums">
              Initializing... {Math.min(progress, 100)}%
            </span>
          </div>
        </div>

        {/* Cinematic Slim Progress Bar */}
        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden backdrop-blur-md border border-white/10 relative shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-cyan-950/30" />
          
          {/* Animated Progress Fill */}
          <div
            className="h-full bg-gradient-to-r from-cyan-600 via-pink-500 to-cyan-300 relative transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            {/* Stripe texture overlay */}
            <div className="absolute inset-0 opacity-40 animate-bar-stripes bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_25%,rgba(255,255,255,0.5)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.5)_75%,rgba(255,255,255,0.5)_100%)] bg-[length:20px_20px]" />
            {/* Glow head at the end of progress */}
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent opacity-90 blur-[2px]" />
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white blur-[4px] shadow-[0_0_10px_rgba(6,182,212,1)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
