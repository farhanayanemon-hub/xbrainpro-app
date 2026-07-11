import React, { useState } from "react";
import {
  X,
  MapPin,
  Users,
  Coins,
  Gem,
  Navigation,
  ChevronRight,
  ShieldAlert,
  Zap,
} from "lucide-react";
import "./_group.css";

const LOCATIONS = [
  {
    id: "neon-plaza",
    name: "Neon Plaza",
    description: "The vibrant heart of Neura City. Best place to meet friends and show off your style.",
    playerCount: 1240,
    x: 45,
    y: 40,
    color: "cyan",
    isCurrent: true,
  },
  {
    id: "downtown",
    name: "Downtown Grid",
    description: "High-density shopping and commercial district. Find rare items here.",
    playerCount: 856,
    x: 20,
    y: 60,
    color: "pink",
    isCurrent: false,
  },
  {
    id: "harbor",
    name: "Harbor District",
    description: "Industrial chic meets the waterfront. Underground clubs and secret vendors.",
    playerCount: 432,
    x: 75,
    y: 65,
    color: "cyan",
    isCurrent: false,
  },
  {
    id: "skyline",
    name: "Skyline Towers",
    description: "Luxury apartments and exclusive VIP lounges with breathtaking views.",
    playerCount: 156,
    x: 25,
    y: 25,
    color: "purple",
    isCurrent: false,
  },
  {
    id: "night-market",
    name: "Night Market",
    description: "A maze of neon-lit stalls. Trading, street food, and mini-games.",
    playerCount: 689,
    x: 65,
    y: 20,
    color: "pink",
    isCurrent: false,
  },
];

export function MapInterface() {
  const [selectedId, setSelectedId] = useState<string>("neon-plaza");

  const selectedLoc = LOCATIONS.find((l) => l.id === selectedId) || LOCATIONS[0];

  return (
    <div className="w-[844px] h-[390px] bg-[#05050A] text-white font-sans overflow-hidden relative selection:bg-cyan-500/30">
      {/* Background Map Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/__mockup/images/ng-map-city-bg.png"
          alt="City Map"
          className="w-full h-full object-cover opacity-60 mix-blend-screen"
        />
        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#05050A_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05050A]/80 via-transparent to-[#05050A]/90 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none animate-bg-drift opacity-50" />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-start justify-between px-6 pt-4 z-20 pointer-events-none">
        {/* Left: Player Info */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="relative group button-pop cursor-pointer">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-full blur opacity-50 group-hover:opacity-75 transition-opacity" />
            <img
              src="/__mockup/images/neura-neon-avatar.png"
              alt="Player"
              className="relative w-11 h-11 rounded-full border-2 border-cyan-400/50 object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://ui-avatars.com/api/?name=Neo+Rider&background=06b6d4&color=fff";
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-[#05050A] border border-cyan-500 text-cyan-400 text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-[0_0_8px_rgba(6,182,212,0.6)]">
              Lv.27
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide neon-text-glow-cyan text-white">NeoRider</span>
              <span className="text-[9px] uppercase tracking-wider font-black bg-gradient-to-r from-yellow-300 to-yellow-500 text-black px-1.5 py-0.5 rounded-sm animate-vip-shine">
                VIP
              </span>
            </div>
          </div>
        </div>

        {/* Right: Currency & Close */}
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex gap-2">
            <div className="glass-panel rounded-full flex items-center gap-2 px-3 py-1.5 border border-cyan-500/20 neon-box-glow">
              <Coins size={14} className="text-yellow-400" />
              <span className="text-sm font-bold text-yellow-50">24,580</span>
            </div>
            <div className="glass-panel rounded-full flex items-center gap-2 px-3 py-1.5 border border-pink-500/20 neon-box-glow-pink">
              <Gem size={14} className="text-pink-400" />
              <span className="text-sm font-bold text-pink-50">312</span>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center border border-white/10 hover:border-pink-500/50 hover:text-pink-400 transition-colors button-pop group">
            <X size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        {LOCATIONS.map((loc, i) => {
          const isSelected = selectedId === loc.id;
          const colorClass = loc.color === 'cyan' ? 'text-cyan-400' : loc.color === 'pink' ? 'text-pink-400' : 'text-purple-400';
          const bgClass = loc.color === 'cyan' ? 'bg-cyan-500' : loc.color === 'pink' ? 'bg-pink-500' : 'bg-purple-500';
          const shadowClass = loc.color === 'cyan' ? 'shadow-[0_0_15px_rgba(6,182,212,0.8)]' : loc.color === 'pink' ? 'shadow-[0_0_15px_rgba(236,72,153,0.8)]' : 'shadow-[0_0_15px_rgba(168,85,247,0.8)]';

          return (
            <div
              key={loc.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group delay-${(i + 1) * 100} animate-pop-in`}
              style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
              onClick={() => setSelectedId(loc.id)}
            >
              {/* Pulse effect for selected or current */}
              {(isSelected || loc.isCurrent) && (
                <div className={`absolute inset-0 rounded-full ${bgClass} opacity-20 animate-ping scale-150`} />
              )}
              
              <div className="relative flex flex-col items-center">
                {loc.isCurrent && (
                  <div className="absolute -top-6 flex flex-col items-center animate-bounce">
                    <span className="bg-white text-black text-[9px] font-bold px-2 py-0.5 rounded-sm shadow-[0_0_10px_rgba(255,255,255,0.5)] whitespace-nowrap">
                      YOU ARE HERE
                    </span>
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white" />
                  </div>
                )}
                
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'scale-125 border-white bg-[#05050A] z-10' : `border-${loc.color}-500/50 bg-[#05050A]/80 hover:scale-110 hover:border-${loc.color}-400`}`}>
                  {loc.isCurrent ? (
                    <Navigation size={14} className={`${colorClass} ${isSelected ? shadowClass : ''}`} fill="currentColor" />
                  ) : (
                    <MapPin size={14} className={`${colorClass} ${isSelected ? shadowClass : ''}`} fill={isSelected ? "currentColor" : "none"} />
                  )}
                </div>
                
                {/* Location Label */}
                <div className={`mt-1.5 text-[10px] font-bold tracking-wider whitespace-nowrap px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border transition-all ${isSelected ? `border-${loc.color}-500 text-white shadow-[0_0_8px_rgba(255,255,255,0.2)]` : 'border-white/10 text-white/70'}`}>
                  {loc.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Info Panel */}
      <div className="absolute top-16 right-6 bottom-6 w-64 z-20 animate-slide-pop pointer-events-none">
        <div className="glass-panel h-full rounded-xl border border-white/10 flex flex-col overflow-hidden pointer-events-auto shadow-2xl shadow-black/80">
          {/* Header Image Area */}
          <div className="h-32 relative bg-gradient-to-b from-purple-900/40 to-transparent flex-shrink-0">
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,5,10,1)_0%,transparent_100%)]" />
            {selectedLoc.color === 'cyan' && <div className="absolute inset-0 bg-cyan-500/10 mix-blend-color" />}
            {selectedLoc.color === 'pink' && <div className="absolute inset-0 bg-pink-500/10 mix-blend-color" />}
            {selectedLoc.color === 'purple' && <div className="absolute inset-0 bg-purple-500/10 mix-blend-color" />}
            
            <div className="absolute bottom-3 left-4 right-4">
              <h2 className={`text-xl font-black uppercase italic tracking-wider ${selectedLoc.color === 'cyan' ? 'neon-text-glow-cyan' : selectedLoc.color === 'pink' ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'}`}>
                {selectedLoc.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 text-white/70 text-xs">
                  <Users size={12} />
                  <span>{selectedLoc.playerCount.toLocaleString()} online</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 flex flex-col gap-4">
            <p className="text-sm text-white/60 leading-relaxed font-light">
              {selectedLoc.description}
            </p>

            <div className="mt-auto space-y-3">
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-white/50">Travel Cost</span>
                <span className="flex items-center gap-1 font-bold text-white">
                  {selectedLoc.isCurrent ? 'Free' : (
                    <>
                      <Coins size={12} className="text-yellow-400" />
                      50
                    </>
                  )}
                </span>
              </div>
              
              <button 
                className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all button-pop overflow-hidden relative group
                  ${selectedLoc.isCurrent 
                    ? 'bg-white/10 text-white/50 border border-white/10' 
                    : `bg-${selectedLoc.color}-500 hover:bg-${selectedLoc.color}-400 text-white ${selectedLoc.color === 'cyan' ? 'animate-main-btn-glow-cyan' : selectedLoc.color === 'pink' ? 'animate-main-btn-glow' : 'shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]'}`
                  }
                `}
                disabled={selectedLoc.isCurrent}
              >
                {!selectedLoc.isCurrent && (
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {selectedLoc.isCurrent ? 'Current Location' : 'Fast Travel'}
                  {!selectedLoc.isCurrent && <ChevronRight size={16} />}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative scan line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500/20 pointer-events-none z-50 animate-scan" />
    </div>
  );
}
