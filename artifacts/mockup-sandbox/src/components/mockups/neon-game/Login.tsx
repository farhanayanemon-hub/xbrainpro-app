import React, { useState } from "react";
import { Mail, Lock, User, ChevronRight, Gamepad2, Sparkles } from "lucide-react";
import "./_group.css";

export function Login() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="w-[844px] h-[390px] relative overflow-hidden bg-slate-950 font-sans select-none flex items-center">
      {/* Background with pan/drift animation */}
      <div 
        className="absolute inset-0 z-0 animate-bg-drift bg-cover bg-center opacity-60"
        style={{ 
          backgroundImage: 'url(/__mockup/images/ng-login-bg.png)',
          transformOrigin: 'center center',
          width: '110%', height: '110%', left: '-5%', top: '-5%'
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent w-2/3" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
      
      {/* Scanline overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 animate-scan mix-blend-overlay bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_51%)] bg-[length:100%_4px]" />

      {/* Main Content Layout (Landscape) */}
      <div className="relative z-10 flex w-full h-full p-6 items-center justify-between">
        
        {/* Left Side: Branding */}
        <div className="flex flex-col items-start justify-center h-full w-[45%] pl-4">
          <div className="animate-logo-in mb-2">
            <h1 className="text-6xl font-black italic tracking-tighter text-white neon-text-glow leading-none flex flex-col">
              <span>NEURA</span>
              <span className="text-cyan-400 neon-text-glow-cyan ml-4 mt-[-8px]">CITY</span>
            </h1>
          </div>
          
          <p className="text-slate-300 text-sm font-medium tracking-widest uppercase mt-4 animate-text-pulse flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500" />
            Enter the metaverse
          </p>
          
          <div className="mt-auto mb-4 animate-slide-pop delay-500">
            <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-full border border-white/10">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Server Status</span>
                <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-glow-pulse" /> Online — 24k Players
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-[45%] max-w-[340px] h-[90%] glass-panel rounded-2xl border border-white/10 p-5 flex flex-col justify-between relative overflow-hidden animate-slide-pop-left mr-4">
          
          {/* Animated decorative line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500" />
          
          {/* Toggle Tabs */}
          <div className="flex bg-black/40 rounded-lg p-1 mb-4 relative z-10 border border-white/5">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all duration-300 ${isLogin ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-slate-400 hover:text-white'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all duration-300 ${!isLogin ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-slate-400 hover:text-white'}`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-3 relative z-10">
            {!isLogin && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  placeholder="USERNAME" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all uppercase tracking-wider"
                />
              </div>
            )}
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-pink-400 transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <input 
                type="email" 
                placeholder="EMAIL" 
                defaultValue={isLogin ? "neo@neuracity.io" : ""}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all tracking-wider"
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-pink-400 transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <input 
                type="password" 
                placeholder="PASSWORD" 
                defaultValue={isLogin ? "••••••••" : ""}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all tracking-wider"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto pt-4 flex flex-col gap-2 relative z-10">
            <button className="w-full relative overflow-hidden group rounded-lg py-3 flex justify-center items-center gap-2 bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 text-white font-black text-sm uppercase tracking-widest button-pop animate-main-btn-glow">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10">{isLogin ? 'ENTER CITY' : 'JOIN CITY'}</span>
              <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-colors tracking-widest py-1 flex items-center justify-center gap-1 opacity-80 hover:opacity-100">
              Continue as Guest
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
