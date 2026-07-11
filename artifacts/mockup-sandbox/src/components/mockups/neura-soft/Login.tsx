import React, { useState } from 'react';
import { Mail, Lock, Gamepad2, ArrowRight } from 'lucide-react';
import './_group.css';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="neura-soft-theme relative w-[390px] h-[844px] bg-pink-100 overflow-hidden select-none">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/__mockup/images/neura-soft-bg.png)' }}
      />
      
      {/* Overlay gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white/60" />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-16 px-6">
        
        {/* Logo Area */}
        <div className="flex flex-col items-center mt-12 animate-bounce" style={{ animationDuration: '3s' }}>
          <div className="w-24 h-24 bg-white/90 rounded-3xl shadow-[0_8px_32px_rgba(255,154,158,0.5)] border-4 border-white flex items-center justify-center mb-4 transform rotate-3">
            <Gamepad2 className="w-12 h-12 text-pink-400" />
          </div>
          <h1 className="text-5xl font-black candy-text-white tracking-tight mb-2">NEURA</h1>
          <div className="bg-white/80 backdrop-blur-sm px-4 py-1 rounded-full shadow-sm">
            <p className="text-pink-400 font-bold text-sm tracking-widest uppercase">The Soft City</p>
          </div>
        </div>

        {/* Login Form Panel */}
        <div className="w-full soft-glass rounded-[2rem] p-6 flex flex-col gap-5 mb-8">
          <div className="flex bg-white/50 rounded-full p-1 shadow-inner mb-2">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-full font-bold text-sm transition-all ${isLogin ? 'bg-white text-pink-500 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-full font-bold text-sm transition-all ${!isLogin ? 'bg-white text-pink-500 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full bg-white/80 border-2 border-white focus:border-pink-300 outline-none rounded-2xl py-4 pl-12 pr-4 font-semibold text-gray-700 shadow-inner placeholder:text-gray-400 transition-colors"
              />
            </div>
            
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full bg-white/80 border-2 border-white focus:border-pink-300 outline-none rounded-2xl py-4 pl-12 pr-4 font-semibold text-gray-700 shadow-inner placeholder:text-gray-400 transition-colors"
              />
            </div>
          </div>

          <button className="soft-button-primary w-full rounded-2xl py-4 mt-2 flex items-center justify-center gap-2 group">
            <span className="font-black text-xl tracking-wide uppercase">{isLogin ? 'Enter City' : 'Create Avatar'}</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="text-center font-bold text-gray-500 text-sm hover:text-pink-500 transition-colors mt-2">
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}