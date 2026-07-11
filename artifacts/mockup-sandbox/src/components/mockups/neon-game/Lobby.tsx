import React, { useState, useRef, useEffect } from "react";
import {
  Coins,
  Gem,
  Crown,
  ShoppingCart,
  CalendarCheck,
  Gift,
  Calendar,
  Home,
  Shirt,
  Users,
  Trophy,
  Play,
  RotateCcw,
  Sparkles
} from "lucide-react";
import "./_group.css";

export function Lobby() {
  const [bgPosition, setBgPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const lastBgPosition = useRef(0);
  const autoPanRef = useRef<number>();
  const [isIdle, setIsIdle] = useState(true);

  // Auto-pan logic
  useEffect(() => {
    if (isDragging) {
      if (autoPanRef.current) cancelAnimationFrame(autoPanRef.current);
      return;
    }

    const pan = () => {
      setBgPosition((prev) => {
        let next = prev - 0.2; // Speed of auto-pan
        // Wrap around assuming a very wide bg. We'll use CSS background-position which wraps naturally if repeating.
        // We'll just keep decreasing it.
        return next;
      });
      autoPanRef.current = requestAnimationFrame(pan);
    };
    
    if (isIdle) {
      autoPanRef.current = requestAnimationFrame(pan);
    }

    return () => {
      if (autoPanRef.current) cancelAnimationFrame(autoPanRef.current);
    };
  }, [isDragging, isIdle]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setIsIdle(false);
    dragStartX.current = e.clientX;
    lastBgPosition.current = bgPosition;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX.current;
    // Adjust sensitivity
    setBgPosition(lastBgPosition.current + deltaX * 0.5);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    // Resume idle panning after a delay
    setTimeout(() => {
      setIsIdle(true);
    }, 3000);
  };

  return (
    <div 
      className="w-[844px] h-[390px] relative overflow-hidden bg-slate-950 font-sans select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 360 Panoramic Background */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          backgroundImage: 'url(/__mockup/images/ng-lobby-bg.png)',
          backgroundSize: 'auto 100%', // Match height, let width repeat
          backgroundRepeat: 'repeat-x',
          backgroundPosition: `${bgPosition}px center`,
          willChange: 'background-position',
          transition: isDragging ? 'none' : 'background-position 0.1s linear'
        }}
      />

      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />

      {/* Center Character */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-12">
        <div className="relative animate-float">
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-cyan-500/30 rounded-full blur-xl animate-glow-pulse" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-pink-500/40 rounded-full blur-md animate-glow-pulse" style={{ animationDelay: '0.5s' }} />
          <img 
            src="/__mockup/images/neura-neon-avatar.png" 
            alt="Player" 
            className="h-[300px] object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" 
          />
          {/* Player Nameplate */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap glass-panel px-3 py-1 rounded-full border border-cyan-500/50 flex items-center gap-1.5 animate-slide-pop">
            <Crown className="w-3.5 h-3.5 text-yellow-400 animate-vip-shine" />
            <span className="text-white text-xs font-bold tracking-wide">NeoRider</span>
            <span className="bg-cyan-500 text-slate-950 text-[10px] font-black px-1.5 rounded-sm">Lvl 27</span>
          </div>
        </div>
      </div>

      {/* Drag Hint */}
      {isIdle && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center gap-1 opacity-60 transition-opacity">
          <RotateCcw className="w-6 h-6 text-cyan-400 animate-rotate-hint" />
          <span className="text-[10px] text-cyan-200 font-medium tracking-widest uppercase neon-text-glow-cyan">Drag to look around</span>
        </div>
      )}

      {/* HUD Top Bar */}
      <div className="absolute top-0 inset-x-0 p-3 flex justify-between items-start pointer-events-none z-10">
        <div className="flex gap-2">
          {/* VIP Badge */}
          <button className="glass-panel rounded-lg p-1.5 border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)] animate-slide-pop-left pointer-events-auto button-pop">
            <div className="bg-gradient-to-br from-yellow-300 to-yellow-600 rounded p-1">
              <Crown className="w-5 h-5 text-slate-950" />
            </div>
          </button>
          
          {/* Profile Quick */}
          <button className="glass-panel rounded-full pl-1 pr-3 py-1 border border-cyan-500/30 flex items-center gap-2 animate-slide-pop-left delay-100 pointer-events-auto button-pop">
            <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-cyan-400/50 relative">
              <img src="/__mockup/images/neura-neon-avatar.png" alt="Avatar" className="w-full h-full object-cover scale-150 -translate-y-2" />
            </div>
            <div className="flex flex-col items-start">
              <div className="text-[10px] text-cyan-400 font-bold leading-tight">12,450 XP</div>
              <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div className="w-[70%] h-full bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.8)] rounded-full" />
              </div>
            </div>
          </button>
        </div>

        {/* Currency */}
        <div className="flex gap-3 pointer-events-auto">
          <button className="glass-panel rounded-full pl-2 pr-3 py-1 border border-pink-500/30 flex items-center gap-1.5 animate-slide-pop delay-100 button-pop">
            <div className="bg-pink-500 rounded-full p-1 shadow-[0_0_10px_rgba(236,72,153,0.8)]">
              <Coins className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white text-sm font-bold tracking-tight">24,580</span>
            <div className="w-4 h-4 rounded-full bg-pink-500/20 flex items-center justify-center ml-1 text-pink-400 text-xs font-bold leading-none">+</div>
          </button>
          
          <button className="glass-panel rounded-full pl-2 pr-3 py-1 border border-cyan-500/30 flex items-center gap-1.5 animate-slide-pop delay-200 button-pop">
            <div className="bg-cyan-500 rounded-full p-1 shadow-[0_0_10px_rgba(6,182,212,0.8)]">
              <Gem className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white text-sm font-bold tracking-tight">312</span>
            <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center ml-1 text-cyan-400 text-xs font-bold leading-none">+</div>
          </button>
        </div>
      </div>

      {/* Left Menu Tiles */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-10">
        <MenuTile icon={ShoppingCart} label="Store" color="pink" delay={100} />
        <MenuTile icon={CalendarCheck} label="Tasks" color="cyan" delay={200} badge="3" />
        <MenuTile icon={Gift} label="Mystery" color="purple" delay={300} isSpecial />
        <MenuTile icon={Calendar} label="Events" color="cyan" delay={400} />
      </div>

      {/* Right Menu Tiles */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-10">
        <MenuTile icon={Home} label="Apt" color="cyan" delay={100} right />
        <MenuTile icon={Shirt} label="Style" color="pink" delay={200} right />
        <MenuTile icon={Users} label="Friends" color="cyan" delay={300} badge="1" right />
        <MenuTile icon={Trophy} label="Rank" color="yellow" delay={400} right />
      </div>

      {/* Bottom Play Button */}
      <div className="absolute bottom-6 inset-x-0 flex justify-center z-10 pointer-events-none">
        <button className="relative group pointer-events-auto button-pop animate-pop-in delay-300">
          <div className="absolute inset-0 bg-cyan-500 rounded-xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" />
          <div className="relative glass-panel border border-cyan-400/80 rounded-xl px-12 py-3 flex items-center gap-3 bg-cyan-950/80 overflow-hidden overflow-hidden-shimmer animate-main-btn-glow-cyan shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-bar-stripes opacity-30" />
            <Play className="w-6 h-6 text-cyan-300 fill-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,1)]" />
            <span className="text-white text-xl font-black tracking-widest italic drop-shadow-md">ENTER CITY</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function MenuTile({ icon: Icon, label, color, delay, badge, isSpecial, right = false }: any) {
  const colorMap = {
    pink: "text-pink-400 border-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.3)] bg-pink-950/40",
    cyan: "text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)] bg-cyan-950/40",
    purple: "text-purple-400 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)] bg-purple-950/40",
    yellow: "text-yellow-400 border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.3)] bg-yellow-950/40",
  };
  
  const iconColor = {
    pink: "text-pink-400",
    cyan: "text-cyan-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
  };

  const popClass = right ? "animate-slide-pop" : "animate-slide-pop-left";

  return (
    <button 
      className={`glass-panel border rounded-xl p-2 w-14 h-14 flex flex-col items-center justify-center gap-1 relative button-pop pointer-events-auto ${colorMap[color as keyof typeof colorMap]} ${popClass}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon className={`w-5 h-5 ${iconColor[color as keyof typeof iconColor]}`} strokeWidth={2.5} />
      <span className="text-[9px] font-bold text-slate-200 uppercase tracking-wider">{label}</span>
      
      {badge && (
        <div className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(236,72,153,0.8)] border border-white/20">
          {badge}
        </div>
      )}

      {isSpecial && (
        <Sparkles className="absolute top-1 right-1 w-3 h-3 text-purple-300 animate-spin-slow" />
      )}
    </button>
  );
}
