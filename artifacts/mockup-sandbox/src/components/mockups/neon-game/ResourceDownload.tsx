import React, { useState, useEffect } from "react";
import { Download, HardDrive, Wifi, CheckCircle2, Loader2, Sparkles, Zap, Shield, Image as ImageIcon, Box, Music, Video, User } from "lucide-react";
import "./_group.css";

const categories = [
  { id: "textures", name: "High-Res Textures", icon: ImageIcon, total: 1250, current: 1250, size: "1.2 GB", color: "pink" },
  { id: "models", name: "3D Environment Models", icon: Box, total: 840, current: 620, size: "850 MB", color: "cyan" },
  { id: "characters", name: "Character Assets", icon: User, total: 420, current: 0, size: "450 MB", color: "purple" },
  { id: "sounds", name: "Audio & OST", icon: Music, total: 156, current: 0, size: "210 MB", color: "pink" },
  { id: "effects", name: "VFX & Particles", icon: Video, total: 312, current: 0, size: "180 MB", color: "cyan" },
];

const tips = [
  "TIP: You can customize your apartment with neon furniture.",
  "TIP: Join VIP to access exclusive hoverboards.",
  "TIP: Meet friends at the Cyber Club downtown.",
  "TIP: Daily quests reset at midnight server time."
];

export function ResourceDownload() {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-[844px] h-[390px] bg-[#0a0a0f] overflow-hidden relative select-none font-sans text-white">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 animate-bg-drift"
        style={{ backgroundImage: 'url(/__mockup/images/ng-resdl-bg.png)' }}
      />
      
      {/* Overlay Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-transparent to-[#0a0a0f] opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-90" />

      {/* Main Content Layout */}
      <div className="relative z-10 w-full h-full flex p-6 gap-6">
        
        {/* Left Panel - Overall Status */}
        <div className="w-[340px] flex flex-col justify-between">
          <div className="animate-slide-pop">
            <div className="flex items-center gap-2 mb-1">
              <Download className="w-5 h-5 text-cyan-400 animate-glow-pulse" />
              <h1 className="text-xl font-bold uppercase tracking-wider neon-text-glow-cyan text-white">
                Downloading Assets
              </h1>
            </div>
            <p className="text-xs text-cyan-200/60 uppercase tracking-widest ml-7">
              Preparing Neura City
            </p>
          </div>

          {/* Character Art */}
          <div className="flex-1 relative my-4 flex items-center justify-center animate-float">
             <div className="absolute inset-0 bg-pink-500/20 blur-[50px] rounded-full" />
             <img 
               src="/__mockup/images/neura-neon-avatar.png" 
               alt="Avatar" 
               className="h-full object-contain drop-shadow-[0_0_15px_rgba(236,72,153,0.5)] z-10"
             />
          </div>

          {/* Overall Progress */}
          <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 neon-box-glow animate-slide-pop delay-100">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-white">Overall Progress</span>
              <span className="text-2xl font-black text-cyan-400 neon-text-glow-cyan">64%</span>
            </div>
            <div className="h-3 bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400 w-[64%] animate-bar-stripes rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                style={{ backgroundSize: '1rem 1rem', backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)' }}
              />
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-gray-400 font-mono tracking-wider">
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3 h-3 text-pink-400" />
                <span>1.8 GB / 2.9 GB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>14.2 MB/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Detailed List */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="glass-panel rounded-2xl border border-white/10 p-5 flex flex-col gap-3 h-full animate-slide-pop-left delay-200">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              Resource Packages
            </h2>
            
            <div className="flex flex-col gap-2 overflow-hidden flex-1">
              {categories.map((cat, i) => {
                const percent = Math.round((cat.current / cat.total) * 100);
                const isComplete = percent === 100;
                const isDownloading = percent > 0 && percent < 100;
                const isPending = percent === 0;
                
                let statusColor = "text-gray-500";
                let barColor = "bg-gray-800";
                
                if (isComplete) {
                  statusColor = "text-green-400";
                  barColor = "bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.5)]";
                } else if (isDownloading) {
                  statusColor = cat.color === "pink" ? "text-pink-400" : "text-cyan-400";
                  barColor = cat.color === "pink" 
                    ? "bg-pink-500 animate-bar-stripes shadow-[0_0_8px_rgba(236,72,153,0.5)]" 
                    : "bg-cyan-500 animate-bar-stripes shadow-[0_0_8px_rgba(6,182,212,0.5)]";
                }

                return (
                  <div key={cat.id} className={`relative p-2.5 rounded-lg border ${isDownloading ? (cat.color === 'pink' ? 'border-pink-500/30 bg-pink-500/5' : 'border-cyan-500/30 bg-cyan-500/5') : 'border-white/5 bg-black/40'} transition-all duration-300`}>
                    {isDownloading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-scan rounded-lg pointer-events-none" />
                    )}
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-md ${isComplete ? 'bg-green-500/20 text-green-400' : isDownloading ? (cat.color === 'pink' ? 'bg-pink-500/20 text-pink-400' : 'bg-cyan-500/20 text-cyan-400') : 'bg-gray-800 text-gray-500'}`}>
                          <cat.icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h3 className={`text-xs font-bold ${isComplete ? 'text-gray-200' : isDownloading ? 'text-white' : 'text-gray-500'}`}>
                            {cat.name}
                          </h3>
                          <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                            {cat.current} / {cat.total} FILES • {cat.size}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : isDownloading ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black ${statusColor}`}>{percent}%</span>
                            <Loader2 className={`w-3.5 h-3.5 animate-spin ${statusColor}`} />
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-600 font-bold tracking-wider">WAITING</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="h-1.5 bg-black/80 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ 
                          width: `${percent}%`,
                          ...(isDownloading ? { backgroundSize: '1rem 1rem', backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)' } : {})
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Rotating Tip Bar */}
      <div className="absolute bottom-0 left-0 w-full h-8 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center justify-center z-20 overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
         <div key={tipIndex} className="animate-slide-pop flex items-center gap-2">
           <Zap className="w-3.5 h-3.5 text-pink-400" />
           <span className="text-xs text-gray-300 font-medium tracking-wide">
             {tips[tipIndex]}
           </span>
         </div>
      </div>

    </div>
  );
}
