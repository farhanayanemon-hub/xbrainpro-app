import { useState } from "react";
import { UserCircle, Smile, Scissors, Shirt, Palette, ChevronLeft, ChevronRight, Check } from "lucide-react";
import "./_group.css";

const CATEGORIES = [
  { id: "face", label: "Face", icon: Smile },
  { id: "body", label: "Body", icon: UserCircle },
  { id: "hair", label: "Hair Style", icon: Scissors },
  { id: "skin", label: "Skin Tone", icon: Palette },
  { id: "outfit", label: "Outfit", icon: Shirt },
];

const OPTIONS = {
  face: [
    { id: "f1", bg: "bg-cyan-500/20" },
    { id: "f2", bg: "bg-pink-500/20" },
    { id: "f3", bg: "bg-purple-500/20" },
    { id: "f4", bg: "bg-blue-500/20" },
    { id: "f5", bg: "bg-teal-500/20" },
  ],
  body: [
    { id: "b1", bg: "bg-slate-700" },
    { id: "b2", bg: "bg-slate-600" },
    { id: "b3", bg: "bg-slate-500" },
  ],
  hair: [
    { id: "h1", bg: "bg-cyan-400" },
    { id: "h2", bg: "bg-pink-400" },
    { id: "h3", bg: "bg-purple-400" },
    { id: "h4", bg: "bg-white" },
    { id: "h5", bg: "bg-zinc-800" },
  ],
  skin: [
    { id: "s1", bg: "bg-[#fcd3b6]" },
    { id: "s2", bg: "bg-[#e8b593]" },
    { id: "s3", bg: "bg-[#c68660]" },
    { id: "s4", bg: "bg-[#8d5538]" },
    { id: "s5", bg: "bg-[#4a2e1f]" },
  ],
  outfit: [
    { id: "o1", bg: "bg-cyan-500/30" },
    { id: "o2", bg: "bg-pink-500/30" },
    { id: "o3", bg: "bg-yellow-500/30" },
    { id: "o4", bg: "bg-green-500/30" },
  ],
};

export function Customize() {
  const [activeCategory, setActiveCategory] = useState("hair");
  const [selections, setSelections] = useState({
    face: "f1",
    body: "b1",
    hair: "h2",
    skin: "s2",
    outfit: "o1",
  });

  const handleSelect = (categoryId: string, optionId: string) => {
    setSelections(prev => ({ ...prev, [categoryId]: optionId }));
  };

  const activeOptions = OPTIONS[activeCategory as keyof typeof OPTIONS];

  return (
    <div className="w-[844px] h-[390px] relative overflow-hidden bg-[#0a0a0f] text-white font-sans flex items-center justify-center animate-bg-drift bg-cover bg-center" style={{ backgroundImage: "url(/__mockup/images/ng-custom-bg.png)" }}>
      {/* Background Dimmer */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Top Bar */}
      <div className="absolute top-4 left-6 right-6 flex justify-between items-center z-20 animate-slide-pop">
        <div className="flex items-center gap-3 glass-panel px-4 py-1.5 rounded-full border border-white/10">
          <div className="w-2 h-2 rounded-full bg-cyan-400 neon-box-glow animate-glow-pulse" />
          <span className="font-bold tracking-wider text-sm neon-text-glow-cyan uppercase">NeoRider</span>
        </div>
        <div className="text-xs font-mono text-white/50 bg-black/40 px-3 py-1 rounded border border-white/5">
          ID: 884-2X-NEO
        </div>
      </div>

      {/* Center Character */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="relative flex flex-col items-center mt-12 animate-float">
          {/* Character */}
          <div className="w-64 h-64 flex items-center justify-center relative z-10">
            <img 
              src="/__mockup/images/neura-neon-avatar.png" 
              alt="Avatar" 
              className="h-full object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            />
          </div>
          {/* Platform */}
          <div className="w-48 h-12 rounded-[100%] border-2 border-cyan-500/50 bg-cyan-900/20 absolute bottom-[-10px] transform -rotate-x-60 neon-box-glow shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center">
            <div className="w-32 h-8 rounded-[100%] border border-pink-500/50 bg-pink-500/10 animate-spin-slow flex items-center justify-center">
               <div className="w-16 h-4 rounded-[100%] border border-cyan-400/80 bg-cyan-400/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Left Tabs */}
      <div className="absolute left-6 top-16 bottom-16 flex flex-col justify-center gap-2 z-20 animate-slide-pop-left delay-100">
        {CATEGORIES.map((cat, idx) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 button-pop ${
                isActive 
                  ? "bg-gradient-to-r from-pink-500/20 to-transparent border-l-2 border-pink-500 text-white" 
                  : "glass-panel text-white/50 hover:text-white/80 hover:bg-white/5 border-l-2 border-transparent"
              }`}
              style={{ animationDelay: (idx * 50) + "ms" }}
            >
              <div className={`p-1.5 rounded-lg ${isActive ? "bg-pink-500/20 neon-box-glow-pink text-pink-400" : "bg-white/5"}`}>
                <Icon size={18} />
              </div>
              <span className={`text-xs font-bold tracking-wider uppercase ${isActive ? "neon-text-glow" : ""}`}>
                {cat.label}
              </span>
              {isActive && (
                <div className="absolute inset-y-0 left-0 w-[1px] bg-pink-400 neon-box-glow-pink" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right Options Panel */}
      <div className="absolute right-6 top-16 bottom-24 w-64 glass-panel border border-white/10 rounded-2xl p-4 flex flex-col z-20 animate-slide-pop delay-200">
        <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <div className="w-1 h-3 bg-cyan-400 rounded-full" />
          Select {CATEGORIES.find(c => c.id === activeCategory)?.label}
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-3 gap-2">
            {activeOptions.map((opt, i) => {
              const isSelected = selections[activeCategory as keyof typeof selections] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(activeCategory, opt.id)}
                  className={`relative aspect-square rounded-xl overflow-hidden button-pop group transition-all duration-300 ${
                    isSelected ? "border-2 border-cyan-400 scale-105" : "border border-white/10 hover:border-white/30"
                  }`}
                  style={{ animationDelay: (200 + i * 50) + "ms" }}
                >
                  <div className={`absolute inset-0 ${opt.bg} opacity-80 group-hover:opacity-100 transition-opacity`} />
                  {isSelected && (
                    <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center backdrop-blur-[2px]">
                      <Check size={16} className="text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Right Confirm Button */}
      <div className="absolute right-6 bottom-6 z-20 animate-slide-pop delay-300">
        <button className="relative overflow-hidden group button-pop rounded-xl font-bold uppercase tracking-widest text-sm text-white px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400/50 hover:border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
          <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
            Enter City
            <ChevronRight size={16} className="animate-pulse" />
          </span>
        </button>
      </div>
      
      {/* Rotate Hints */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-12 text-white/30 animate-pop-in delay-500">
        <button className="p-2 hover:text-cyan-400 transition-colors button-pop">
          <ChevronLeft size={24} />
        </button>
        <div className="text-[10px] font-mono uppercase tracking-widest flex items-center">
          Rotate
        </div>
        <button className="p-2 hover:text-cyan-400 transition-colors button-pop">
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
