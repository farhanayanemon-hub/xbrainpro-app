import React from 'react';
import { Play, Store, Calendar, Gift, Award, Crown, Home, User, Users, Trophy, Diamond, Coins, Plus, Menu } from 'lucide-react';
import './_group.css';

export function Lobby() {
  return (
    <div className="w-[390px] h-[844px] relative overflow-hidden bg-[#0a0a0f] font-sans text-white select-none">
      
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-60"
        style={{ backgroundImage: 'url(/__mockup/images/neura-neon-bg-lobby.png)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-transparent to-[#0a0a0f]"></div>
      </div>

      {/* Avatar Centerpiece */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pt-10 pointer-events-none">
        <img 
          src="/__mockup/images/neura-neon-avatar.png" 
          alt="Hero Avatar"
          className="h-[75%] object-contain drop-shadow-[0_0_30px_rgba(236,72,153,0.4)]"
        />
        {/* Ground Glow */}
        <div className="absolute bottom-[20%] w-[250px] h-[40px] bg-cyan-500/30 blur-2xl rounded-full"></div>
      </div>

      {/* UI Layer */}
      <div className="relative z-20 h-full flex flex-col justify-between p-4 pointer-events-auto">
        
        {/* Top HUD */}
        <div className="flex flex-col gap-3 pt-8">
          <div className="flex items-center justify-between">
            {/* Player Info */}
            <div className="glass-panel rounded-full pl-1 pr-4 py-1 flex items-center gap-2 neon-box-glow-pink border-fuchsia-500/30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-600 flex items-center justify-center border-2 border-white/20 font-black italic shadow-inner">
                NR
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black italic tracking-wide text-white">NeoRider</span>
                <span className="text-[10px] font-bold text-fuchsia-300 uppercase tracking-wider bg-fuchsia-900/50 px-1.5 rounded w-fit">Lvl 24</span>
              </div>
            </div>
            
            {/* Settings/Menu */}
            <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-cyan-400 border-cyan-500/30 button-pop">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Currencies */}
          <div className="flex justify-between gap-2">
            <div className="flex-1 glass-panel rounded-xl flex items-center p-1.5 border border-amber-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay"></div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-b from-yellow-300 to-amber-600 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.5)] border border-yellow-200">
                <Coins className="w-4 h-4 text-amber-900" />
              </div>
              <span className="ml-2 font-black text-amber-100 text-sm flex-1">12,450</span>
              <button className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 glass-panel rounded-xl flex items-center p-1.5 border border-cyan-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay"></div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-b from-cyan-300 to-blue-600 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)] border border-cyan-200">
                <Diamond className="w-4 h-4 text-cyan-900" />
              </div>
              <span className="ml-2 font-black text-cyan-100 text-sm flex-1">1,200</span>
              <button className="w-6 h-6 rounded-md bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Side Actions Right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          <button className="button-pop group flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-2xl glass-panel bg-fuchsia-900/40 border border-fuchsia-400/50 flex items-center justify-center neon-box-glow-pink">
              <Store className="w-6 h-6 text-fuchsia-300 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-200 bg-black/50 px-2 rounded-full py-0.5">Store</span>
          </button>
          
          <button className="button-pop group flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-2xl glass-panel bg-cyan-900/40 border border-cyan-400/50 flex items-center justify-center neon-box-glow relative">
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a0a0f]"></div>
              <Calendar className="w-6 h-6 text-cyan-300 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-200 bg-black/50 px-2 rounded-full py-0.5">Tasks</span>
          </button>

          <button className="button-pop group flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-2xl glass-panel bg-purple-900/40 border border-purple-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Gift className="w-6 h-6 text-purple-300 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 bg-black/50 px-2 rounded-full py-0.5">Mystery</span>
          </button>
          
          <button className="button-pop group flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-600 border border-yellow-200 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)]">
              <Crown className="w-6 h-6 text-amber-900 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300 bg-black/50 px-2 rounded-full py-0.5">VIP</span>
          </button>
        </div>

        {/* Side Actions Left */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          <button className="button-pop group flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full glass-panel bg-slate-800/60 border border-slate-500/50 flex items-center justify-center">
              <Home className="w-6 h-6 text-slate-300 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-black/50 px-2 rounded-full py-0.5">Home</span>
          </button>
          
          <button className="button-pop group flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full glass-panel bg-slate-800/60 border border-slate-500/50 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-300 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-black/50 px-2 rounded-full py-0.5">Avatar</span>
          </button>

          <button className="button-pop group flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full glass-panel bg-slate-800/60 border border-slate-500/50 flex items-center justify-center relative">
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-fuchsia-500 rounded-full border-2 border-[#0a0a0f] text-[9px] flex items-center justify-center font-bold">2</div>
              <Users className="w-6 h-6 text-slate-300 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-black/50 px-2 rounded-full py-0.5">Friends</span>
          </button>
        </div>

        {/* Bottom Area */}
        <div className="pb-6 pt-2 flex flex-col items-center w-full gap-4 relative z-20">
          
          {/* Main Action */}
          <button className="button-pop w-[85%] bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-700 p-1 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.6)]">
            <div className="bg-gradient-to-r from-cyan-400 to-blue-500 w-full py-4 rounded-2xl flex items-center justify-center gap-3 border-t-2 border-cyan-200 border-b-4 border-blue-900">
              <Play className="w-8 h-8 text-white fill-white" />
              <span className="text-3xl font-black italic tracking-wider text-white drop-shadow-md uppercase">Enter City</span>
            </div>
          </button>
          
        </div>

      </div>
    </div>
  );
}
