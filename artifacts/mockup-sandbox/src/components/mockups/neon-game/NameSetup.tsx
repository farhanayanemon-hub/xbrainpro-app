import React, { useState } from "react";
import { AlertTriangle, Check, X, ChevronRight } from "lucide-react";
import "./_group.css";

export function NameSetup() {
  const [name, setName] = useState("NeoRider");
  const maxLength = 16;
  
  const isAvailable = name.length >= 3 && name.length <= maxLength && name !== "Admin";
  const showWarning = name === "Admin";

  return (
    <div className="w-[844px] h-[390px] relative overflow-hidden bg-slate-950 font-sans text-white select-none">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-bg-drift opacity-60"
        style={{ backgroundImage: 'url(/__mockup/images/ng-name-bg.png)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-slate-950" />

      {/* Main Layout container */}
      <div className="absolute inset-0 flex items-center justify-between px-12 z-10">
        
        {/* Left Side: Avatar Preview */}
        <div className="w-1/3 flex flex-col items-center justify-center relative animate-slide-pop-left delay-100">
          <div className="absolute bottom-10 w-48 h-12 bg-cyan-500/20 rounded-full blur-2xl animate-glow-pulse" />
          <div className="absolute bottom-12 w-32 h-4 bg-cyan-400/40 rounded-full blur-md" />
          <div className="relative animate-float">
            <img 
              src="/__mockup/images/neura-neon-avatar.png" 
              alt="Character Preview" 
              className="w-64 h-80 object-contain filter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
            />
          </div>
          <div className="absolute bottom-4 text-cyan-400/60 text-xs font-bold tracking-[0.2em] uppercase">
            Model Preview
          </div>
        </div>

        {/* Right Side: Setup Panel */}
        <div className="w-1/2 flex flex-col justify-center animate-slide-pop delay-200">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden bg-slate-900/80 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-pink-500 to-cyan-500 opacity-50" />
            
            <h1 className="text-3xl font-black italic tracking-wider uppercase mb-1 neon-text-glow">
              Choose Your Name
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              This is how other citizens will see you in Neura City.
            </p>

            {/* Input Area */}
            <div className="relative mb-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, maxLength))}
                placeholder="Enter nickname..."
                className="w-full bg-slate-950/80 border-2 border-slate-700 rounded-xl px-4 py-4 text-xl font-bold text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-3">
                <span className="text-slate-500 text-xs font-mono">
                  {name.length}/{maxLength}
                </span>
                {name.length > 0 && (
                  <div className={`flex items-center space-x-1 ${isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                    {isAvailable ? (
                      <>
                        <Check size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Available</span>
                      </>
                    ) : (
                      <>
                        <X size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Taken</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start space-x-3 mb-6">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div className="text-amber-200/90 text-sm font-medium leading-snug">
                <span className="text-amber-400 font-bold uppercase">Critical:</span> You can change your name only <span className="font-bold text-white">ONCE</span>. Choose carefully!
              </div>
            </div>

            {/* Confirm Button */}
            <button 
              disabled={!isAvailable}
              className={`w-full relative group overflow-hidden rounded-xl p-[2px] transition-all duration-300 button-pop ${
                isAvailable ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed opacity-50'
              }`}
            >
              <div className={`absolute inset-0 rounded-xl ${isAvailable ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-main-btn-glow' : 'bg-slate-700'}`} />
              <div className="relative w-full bg-slate-900 px-6 py-4 rounded-[10px] flex items-center justify-center space-x-2">
                <span className={`text-xl font-black italic tracking-widest uppercase ${isAvailable ? 'text-white' : 'text-slate-500'}`}>
                  Confirm Name
                </span>
                <ChevronRight className={isAvailable ? 'text-cyan-400' : 'text-slate-500'} size={24} />
              </div>
              {isAvailable && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              )}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
