import React from 'react';
import './_group.css';
import { X, Send, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ChatOverlay() {
  return (
    <div className="w-[390px] h-[844px] relative overflow-hidden bg-zinc-900 rounded-3xl shadow-2xl mx-auto my-8 border-4 border-zinc-800 neura-font">
      {/* Blurred Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src="/__mockup/images/neura-city-npc.png" 
          alt="Neura City Background" 
          className="w-full h-full object-cover blur-sm brightness-[0.6] scale-105"
        />
      </div>

      {/* Top HUD (Dimmed) */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 opacity-30">
        <div className="neura-glass rounded-full p-1.5 pr-4 flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white/50">
            <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=You&backgroundColor=b6e3f4" />
            <AvatarFallback>Y</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm leading-tight drop-shadow-md">You</span>
            <span className="text-white/80 text-[10px] font-semibold tracking-wider uppercase drop-shadow">Plaza</span>
          </div>
        </div>
      </div>

      {/* Chat Sheet sliding up from bottom */}
      <div className="absolute bottom-0 left-0 w-full h-[75%] neura-glass-dark rounded-t-[32px] flex flex-col z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="p-6 pb-4 flex justify-between items-start border-b border-white/10 relative">
          {/* Decorative Drag Handle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full"></div>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="relative">
              <Avatar className="w-14 h-14 border-2 border-pink-400/50 shadow-[0_0_15px_rgba(255,154,158,0.3)]">
                <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Lumi&backgroundColor=fecfef" />
                <AvatarFallback>L</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#1a1f2e] flex items-center justify-center">
                <Sparkles size={10} className="text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-white font-bold text-xl leading-none">Lumi</h2>
                <span className="text-pink-400 text-xs mt-0.5">✦</span>
              </div>
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mt-1">AI Citizen • Plaza District</span>
            </div>
          </div>
          
          <button className="w-8 h-8 mt-2 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-hide">
          {/* NPC Message */}
          <div className="flex gap-3 max-w-[85%]">
            <Avatar className="w-8 h-8 border border-white/20 flex-shrink-0">
              <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Lumi&backgroundColor=fecfef" />
            </Avatar>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5">
              <p className="text-white text-[15px] leading-relaxed">
                Hey! First time in the Plaza? I can show you around ✦ It gets pretty lively here at night.
              </p>
            </div>
          </div>

          {/* User Message */}
          <div className="flex gap-3 max-w-[85%] self-end flex-row-reverse">
            <div className="bg-gradient-to-br from-pink-500/80 to-purple-600/80 backdrop-blur-md rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg">
              <p className="text-white text-[15px] leading-relaxed">
                What's cool around here?
              </p>
            </div>
          </div>

          {/* NPC Typing Indicator */}
          <div className="flex gap-3 max-w-[85%]">
            <Avatar className="w-8 h-8 border border-white/20 flex-shrink-0">
              <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Lumi&backgroundColor=fecfef" />
            </Avatar>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5 flex items-center gap-1.5 h-[46px]">
              <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 pt-2 bg-black/20 border-t border-white/10 pb-8">
          {/* Suggestion Chips */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide px-1">
            <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-semibold hover:bg-white/20 transition-colors">
              Show me around
            </button>
            <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-semibold hover:bg-white/20 transition-colors">
              Who lives here?
            </button>
            <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-semibold hover:bg-white/20 transition-colors">
              Bye!
            </button>
          </div>

          {/* Text Input */}
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Say something to Lumi..." 
              className="w-full h-12 bg-white/10 border border-white/20 rounded-full pl-5 pr-12 text-white placeholder:text-white/40 focus:outline-none focus:border-pink-400/50 focus:bg-white/15 transition-all text-[15px]"
            />
            <button className="absolute right-1.5 w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform">
              <Send size={16} className="ml-0.5" />
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
