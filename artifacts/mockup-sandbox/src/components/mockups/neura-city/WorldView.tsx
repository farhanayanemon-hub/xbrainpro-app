import React from 'react';
import './_group.css';
import { Settings, Map, Navigation, Maximize } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function WorldView() {
  return (
    <div className="w-[390px] h-[844px] relative overflow-hidden bg-zinc-900 rounded-3xl shadow-2xl mx-auto my-8 border-4 border-zinc-800 neura-font">
      {/* Background World Image */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src="/__mockup/images/neura-city-street.png" 
          alt="Neura City Street" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10">
        {/* Player Chip */}
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

        {/* Right Icons */}
        <div className="flex gap-3">
          <button className="w-10 h-10 rounded-full neura-glass flex items-center justify-center text-white active:scale-95 transition-transform">
            <Map size={20} strokeWidth={2.5} />
          </button>
          <button className="w-10 h-10 rounded-full neura-glass flex items-center justify-center text-white active:scale-95 transition-transform">
            <Settings size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end z-10">
        {/* Virtual Joystick */}
        <div className="w-28 h-28 rounded-full border-2 border-white/20 bg-white/5 flex items-center justify-center relative">
          <div className="w-12 h-12 rounded-full bg-white/40 backdrop-blur-md shadow-lg border border-white/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          {/* Subtle directional arrows */}
          <Navigation className="absolute top-2 text-white/30" size={14} />
          <Navigation className="absolute bottom-2 text-white/30 rotate-180" size={14} />
          <Navigation className="absolute left-2 text-white/30 -rotate-90" size={14} />
          <Navigation className="absolute right-2 text-white/30 rotate-90" size={14} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <button className="w-12 h-12 rounded-full neura-action-btn flex items-center justify-center text-white ml-auto active:scale-95 transition-transform">
            <Maximize size={22} strokeWidth={2.5} />
          </button>
          <button className="w-20 h-20 rounded-full neura-action-btn flex items-center justify-center text-white active:scale-95 transition-transform">
            <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center">
              <span className="font-bold text-sm tracking-wider uppercase opacity-80">Jump</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
