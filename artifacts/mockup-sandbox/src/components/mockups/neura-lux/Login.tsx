import React, { useState } from 'react';
import { Mail, Lock, ChevronRight, User, Sparkles } from 'lucide-react';
import './_group.css';

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="neura-lux relative w-[390px] h-[844px] overflow-hidden bg-[#0a0e17] text-white flex flex-col items-center justify-between mx-auto shadow-2xl">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/__mockup/images/neura-lux-bg.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17]/40 via-transparent to-[#0a0e17] z-10" />
      </div>

      {/* Content */}
      <div className="relative z-20 w-full flex-1 flex flex-col items-center px-6 pt-24 pb-12">
        {/* Logo/Header */}
        <div className="flex flex-col items-center mb-auto mt-8">
          <div className="w-16 h-16 rounded-2xl neura-lux-glass-dark flex items-center justify-center mb-6">
             <Sparkles className="w-8 h-8 text-[#d4af37]" />
          </div>
          <h1 className="neura-lux-title text-5xl font-bold tracking-tight text-center mb-3">
            <span className="neura-lux-text-gold">NEURA</span><br/>CITY
          </h1>
          <p className="text-[#f3e5ab]/70 text-sm tracking-widest uppercase font-medium">The Premium Life Simulator</p>
        </div>

        {/* Login Form Panel */}
        <div className="w-full neura-lux-glass-dark rounded-3xl p-6 mb-6">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setIsSignUp(false)}
              className={`flex-1 pb-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${!isSignUp ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-white/40'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => setIsSignUp(true)}
              className={`flex-1 pb-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${isSignUp ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-white/40'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d4af37]/70" />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full bg-[#0a0e17]/80 border border-[#d4af37]/30 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37] transition-colors"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d4af37]/70" />
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full bg-[#0a0e17]/80 border border-[#d4af37]/30 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37] transition-colors"
              />
            </div>
          </div>

          {!isSignUp && (
            <div className="text-right mt-3 mb-6">
              <button className="text-xs text-[#d4af37]/80 hover:text-[#d4af37]">Forgot password?</button>
            </div>
          )}

          <button className="neura-lux-btn-primary w-full rounded-xl py-4 flex items-center justify-center gap-2 mt-6">
            <span>{isSignUp ? 'Create Account' : 'Enter City'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button className="text-white/60 text-sm font-medium hover:text-white transition-colors flex items-center gap-2">
          <User className="w-4 h-4" />
          Continue as Guest
        </button>
      </div>
    </div>
  );
}