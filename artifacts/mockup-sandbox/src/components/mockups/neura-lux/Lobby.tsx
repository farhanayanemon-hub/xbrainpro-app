import React from 'react';
import { 
  Play, ShoppingBag, Calendar, Gift, 
  Crown, Home, User, Users, Trophy, 
  Settings, MessageCircle, Plus, Star,
  Box, BarChart3
} from 'lucide-react';
import './_group.css';

export function Lobby() {
  return (
    <div className="neura-lux relative w-[390px] h-[844px] overflow-hidden bg-[#0a0e17] text-white flex flex-col mx-auto shadow-2xl">
      {/* Background Image / 3D World */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div 
          className="absolute inset-[-10%] bg-cover bg-center animate-lux-bg-drift"
          style={{ backgroundImage: "url('/__mockup/images/neura-lux-bg.png')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/60 to-[#0a0e17]/80 z-10" />
        </div>
        {/* Particles */}
        <div className="absolute inset-0 z-10 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="lux-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 15 + 8}s`,
                animationDelay: `${Math.random() * 10}s`,
                opacity: 0
              }}
            />
          ))}
        </div>
      </div>

      {/* Avatar Centerpiece */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none mt-12 animate-lux-float">
        <img 
          src="/__mockup/images/neura-lux-avatar.png" 
          alt="Avatar" 
          className="w-full h-auto object-contain max-h-[85%] mix-blend-normal opacity-100 drop-shadow-2xl animate-lux-float-shadow"
          style={{ filter: "drop-shadow(0 0 40px rgba(212,175,55,0.2))" }}
        />
      </div>

      {/* Top HUD */}
      <div className="relative z-20 px-4 pt-12 pb-4 neura-lux-glass-dark rounded-b-[2rem] border-t-0 flex flex-col gap-3 animate-lux-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {/* Top Row: Profile & Settings */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative lux-hover-scale">
              <div className="w-12 h-12 rounded-full border-2 border-[#d4af37] overflow-hidden bg-[#0a0e17]">
                <img src="/__mockup/images/neura-lux-avatar.png" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-[#d4af37] to-[#aa7c11] text-[#0a0e17] text-[10px] font-bold px-1.5 py-0.5 rounded-sm border border-[#0a0e17] lux-shimmer-wrapper">
                Lv.42
              </div>
            </div>
            <div>
              <div className="font-bold text-lg flex items-center gap-2">
                NeoRider <Crown className="w-4 h-4 text-[#d4af37] animate-lux-glow-pulse" />
              </div>
              <div className="text-xs text-[#d4af37] lux-shimmer-wrapper lux-shimmer-slow inline-block">VIP Member</div>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full neura-lux-glass flex items-center justify-center text-white/80 hover:text-white lux-hover-scale">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Currency Row */}
        <div className="flex gap-2">
          {/* Coins */}
          <div className="flex-1 neura-lux-glass rounded-full p-1.5 flex items-center justify-between lux-shimmer-wrapper lux-shimmer-slow">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-inner border border-yellow-300">
                <span className="text-[#0a0e17] text-xs font-black font-serif">C</span>
              </div>
              <span className="font-bold text-sm tracking-wide">12,450</span>
            </div>
            <button className="w-6 h-6 rounded-full bg-[#d4af37]/20 flex items-center justify-center mr-0.5 lux-hover-scale">
              <Plus className="w-4 h-4 text-[#d4af37]" />
            </button>
          </div>
          {/* Gems */}
          <div className="flex-1 neura-lux-glass rounded-full p-1.5 flex items-center justify-between border-[#d4af37]/50 lux-shimmer-wrapper lux-shimmer-slow" style={{ animationDelay: '1.5s' }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center shadow-inner border border-pink-300">
                <Star className="w-3.5 h-3.5 text-white animate-lux-glow-pulse" fill="currentColor" />
              </div>
              <span className="font-bold text-sm tracking-wide text-white">850</span>
            </div>
            <button className="w-6 h-6 rounded-full bg-[#d4af37]/20 flex items-center justify-center mr-0.5 lux-hover-scale">
              <Plus className="w-4 h-4 text-[#d4af37]" />
            </button>
          </div>
        </div>
      </div>

      {/* Side Menu (Left & Right floating) */}
      <div className="relative z-20 flex-1 px-4 py-6 flex justify-between pointer-events-none">
        {/* Left Side */}
        <div className="flex flex-col gap-3 pointer-events-auto">
          <MenuButton icon={<Gift className="w-6 h-6" />} label="Daily" badge="1" delay={0.2} />
          <MenuButton icon={<ShoppingBag className="w-6 h-6" />} label="Store" delay={0.3} />
          <MenuButton icon={<Box className="w-6 h-6" />} label="Mystery" delay={0.4} />
          <MenuButton icon={<Trophy className="w-6 h-6" />} label="Events" delay={0.5} />
        </div>
        {/* Right Side */}
        <div className="flex flex-col gap-3 pointer-events-auto">
          <MenuButton icon={<MessageCircle className="w-6 h-6" />} label="Chat" badge="3" delay={0.2} />
          <MenuButton icon={<Users className="w-6 h-6" />} label="Friends" delay={0.3} />
          <MenuButton icon={<BarChart3 className="w-6 h-6" />} label="Ranks" delay={0.4} />
          <MenuButton icon={<Crown className="w-6 h-6 text-[#d4af37]" />} label="VIP" glow delay={0.5} />
        </div>
      </div>

      {/* Bottom Menu / Play Button */}
      <div className="relative z-20 px-6 pb-8 pt-12 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/90 to-transparent flex flex-col items-center animate-lux-fade-in-up" style={{ animationDelay: '0.6s' }}>
        {/* Bottom Actions */}
        <div className="flex justify-between w-full mb-6">
          <BottomActionButton icon={<Home className="w-6 h-6" />} label="Apartment" />
          <BottomActionButton icon={<User className="w-6 h-6" />} label="Wardrobe" />
        </div>

        {/* Big Play Button */}
        <button className="neura-lux-btn-primary w-full h-16 rounded-2xl flex items-center justify-center gap-3 relative overflow-hidden group lux-shimmer-wrapper lux-hover-scale">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <Play className="w-7 h-7" fill="currentColor" />
          <span className="text-xl">ENTER CITY</span>
        </button>
      </div>
    </div>
  );
}

function MenuButton({ icon, label, badge, glow = false, delay = 0 }: { icon: React.ReactNode, label: string, badge?: string, glow?: boolean, delay?: number }) {
  return (
    <button className="group flex flex-col items-center gap-1.5 w-16 relative animate-lux-fade-in-up lux-hover-scale" style={{ animationDelay: `${delay}s` }}>
      <div className={`w-14 h-14 rounded-2xl neura-lux-glass-dark flex items-center justify-center transition-all ${glow ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)] lux-shimmer-wrapper' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${glow ? 'text-[#d4af37]' : 'text-white/80'}`}>{label}</span>
      {badge && (
        <div className="absolute -top-1 right-0 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-[#0a0e17]">
          {badge}
        </div>
      )}
    </button>
  );
}

function BottomActionButton({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="group flex flex-col items-center gap-2 lux-hover-scale">
      <div className="w-16 h-16 rounded-full neura-lux-glass flex items-center justify-center text-white/90">
        {icon}
      </div>
      <span className="text-xs font-bold tracking-widest uppercase text-white/70">{label}</span>
    </button>
  );
}