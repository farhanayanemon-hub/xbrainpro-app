import React from 'react';
import { Settings, Plus, Crown, MapPin, Store, Sparkles, Gift, Calendar, Trophy, Users, Star, ShoppingBag } from 'lucide-react';
import './_group.css';

export function Lobby() {
  return (
    <div className="neura-soft-theme relative w-[390px] h-[844px] bg-[#E8F3F1] overflow-hidden select-none">
      {/* Background slightly blurred game world */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: 'url(/__mockup/images/neura-soft-bg.png)', filter: 'blur(8px)' }}
      />
      
      {/* HUD Bar */}
      <div className="absolute top-0 inset-x-0 z-20 pt-12 pb-4 px-4 bg-gradient-to-b from-black/20 to-transparent flex flex-col gap-3">
        <div className="flex justify-between items-center">
          {/* Player Info */}
          <div className="soft-hud-pill flex items-center gap-2 pr-4 p-1 rounded-full">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center border-2 border-white text-white font-black shadow-sm">
              12
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-800 text-sm leading-none">NeoRider</span>
              <span className="text-[10px] font-bold text-yellow-500 flex items-center gap-0.5 mt-0.5">
                <Crown size={10} fill="currentColor" /> VIP PASS
              </span>
            </div>
          </div>
          
          {/* Settings */}
          <button className="w-10 h-10 soft-hud-pill rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors">
            <Settings size={20} />
          </button>
        </div>

        {/* Currency Row */}
        <div className="flex gap-3">
          {/* Coins */}
          <div className="soft-hud-pill flex-1 flex items-center justify-between p-1 pl-3 rounded-full">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-yellow-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">C</span>
              </div>
              <span className="font-black text-gray-800 text-sm">4,250</span>
            </div>
            <button className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform">
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
          
          {/* Gems */}
          <div className="soft-hud-pill flex-1 flex items-center justify-between p-1 pl-3 rounded-full">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-pink-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center transform rotate-45">
                <div className="w-2.5 h-2.5 bg-white/50 rounded-sm" />
              </div>
              <span className="font-black text-gray-800 text-sm">185</span>
            </div>
            <button className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform">
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Avatar Centerpiece */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pt-10">
        <div className="relative w-full h-[600px]">
          {/* Shadow/Glow under character */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[200px] h-[30px] bg-black/20 blur-xl rounded-full" />
          <img 
            src="/__mockup/images/neura-soft-avatar.png" 
            className="w-full h-full object-contain object-bottom drop-shadow-2xl"
            alt="Hero Avatar"
          />
        </div>
      </div>

      {/* Side Menu Items */}
      <div className="absolute right-4 top-40 flex flex-col gap-4 z-20">
        <MenuButton icon={<Gift size={24} />} label="Daily" color="bg-orange-400" />
        <MenuButton icon={<Trophy size={24} />} label="Events" color="bg-purple-400" />
        <MenuButton icon={<ShoppingBag size={24} />} label="Store" color="bg-pink-400" />
      </div>

      <div className="absolute left-4 top-40 flex flex-col gap-4 z-20">
        <MenuButton icon={<Star size={24} />} label="Mystery" color="bg-cyan-400" />
        <MenuButton icon={<Users size={24} />} label="Friends" color="bg-blue-400" />
      </div>

      {/* Bottom Action Area */}
      <div className="absolute bottom-0 inset-x-0 z-20 p-6 pt-12 bg-gradient-to-t from-white via-white/80 to-transparent flex flex-col gap-4">
        
        {/* Play Button */}
        <button className="soft-button-primary w-full rounded-3xl py-5 flex flex-col items-center justify-center gap-1 group relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <div className="flex items-center gap-2 relative z-10">
            <MapPin className="w-7 h-7" />
            <span className="font-black text-2xl tracking-widest uppercase">Enter City</span>
          </div>
          <span className="text-xs font-bold text-white/90 uppercase tracking-wider relative z-10">Neon Plaza • 45 Online</span>
        </button>

        {/* Bottom Navigation */}
        <div className="flex gap-3">
          <button className="soft-button-tertiary flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1">
            <Store className="w-6 h-6 text-pink-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Wardrobe</span>
          </button>
          <button className="soft-button-tertiary flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1">
            <Crown className="w-6 h-6 text-yellow-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Apartment</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuButton({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 group cursor-pointer">
      <div className={`w-14 h-14 rounded-2xl border-2 border-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center text-white ${color} transition-transform group-hover:scale-105 active:scale-95 group-active:translate-y-1`}>
        {icon}
      </div>
      <span className="text-xs font-black text-white drop-shadow-md">{label}</span>
    </div>
  );
}