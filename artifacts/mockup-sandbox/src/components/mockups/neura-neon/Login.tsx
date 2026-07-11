import React, { useState } from 'react';
import { Mail, Lock, Gamepad2, User } from 'lucide-react';
import './_group.css';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="w-[390px] h-[844px] relative overflow-hidden bg-slate-900 font-sans text-white select-none">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-[-10%] bg-cover bg-center z-0 animate-bg-drift"
          style={{ backgroundImage: 'url(/__mockup/images/neura-neon-bg-login.png)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-fuchsia-900/20 mix-blend-overlay"></div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col h-full px-6 py-12">
        
        {/* Header / Logo Area */}
        <div className="mt-20 flex-1 flex flex-col items-center animate-logo-in">
          <div className="relative mb-2 animate-text-pulse">
            <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-fuchsia-500 to-purple-600 drop-shadow-2xl">
              NEURA
            </h1>
            <h1 className="text-5xl font-black italic tracking-tighter text-white absolute -bottom-6 right-0 neon-text-glow">
              CITY
            </h1>
          </div>
          <p className="mt-10 text-cyan-200/80 font-medium tracking-wide uppercase text-sm drop-shadow-md">
            Enter the electric nightlife
          </p>
        </div>

        {/* Form Area */}
        <div className="glass-panel rounded-3xl p-6 mb-8 neon-box-glow w-full flex flex-col gap-4">
          <div className="flex bg-slate-900/50 rounded-xl p-1 mb-2">
            <button 
              className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase transition-all ${isLogin ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 shadow-lg text-white' : 'text-slate-400'}`}
              onClick={() => setIsLogin(true)}
            >
              Log In
            </button>
            <button 
              className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase transition-all ${!isLogin ? 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg text-white' : 'text-slate-400'}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <input 
                type="email" 
                placeholder="Email Address"
                className="w-full bg-slate-900/80 border border-cyan-500/30 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fuchsia-400" />
              <input 
                type="password" 
                placeholder="Password"
                className="w-full bg-slate-900/80 border border-fuchsia-500/30 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400 transition-all font-medium"
              />
            </div>
          </div>

          <button className="button-pop overflow-hidden-shimmer animate-shimmer animate-main-btn-glow w-full mt-2 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-500 text-white font-black italic uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 text-lg border-b-4 border-purple-700/50">
            <Gamepad2 className="w-6 h-6" />
            Enter City
          </button>
        </div>

        {/* Guest */}
        <div className="pb-6">
          <button className="button-pop w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-colors">
            <User className="w-5 h-5" />
            Continue as Guest
          </button>
        </div>

      </div>
    </div>
  );
}
