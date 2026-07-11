import React from "react";
import { 
  Settings, 
  MessageSquare, 
  Menu, 
  Map, 
  Star, 
  Coins, 
  Diamond, 
  ArrowUp, 
  HandMetal, 
  User, 
  Zap, 
  MessageCircle, 
  Navigation,
  Gamepad2,
  Heart
} from "lucide-react";
import "./_group.css";

export function InGame() {
  return (
    <div className="relative w-[844px] h-[390px] bg-black overflow-hidden select-none touch-none font-sans">
      {/* 3D World Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/__mockup/images/ng-ingame-bg.png" 
          alt="Game World" 
          className="w-full h-full object-cover animate-bg-drift opacity-80"
        />
        {/* Environment Overlay/Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
      </div>

      {/* Floating Nametag 1 (Other Player) */}
      <div className="absolute top-[35%] left-[30%] z-10 animate-float delay-100 flex flex-col items-center pointer-events-none">
        <div className="glass-panel px-2 py-0.5 rounded-full border border-cyan-500/30 mb-1">
          <span className="text-[10px] font-bold text-cyan-400 neon-text-glow-cyan drop-shadow-md">
            Lvl 14 • CyberPunk99
          </span>
        </div>
        {/* Chat bubble for other player */}
        <div className="bg-white/90 backdrop-blur-sm text-black text-[11px] font-semibold px-2 py-1 rounded-t-xl rounded-br-xl rounded-bl-sm shadow-[0_0_10px_rgba(6,182,212,0.5)] max-w-[120px] text-center mb-1 animate-pop-in">
          Where is the party?
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-glow-pulse mt-12" />
      </div>

      {/* Floating Nametag 2 (Current Player) */}
      <div className="absolute top-[45%] left-[55%] z-10 animate-float flex flex-col items-center pointer-events-none">
        <div className="glass-panel px-2 py-0.5 rounded-full border border-pink-500/50 mb-1 flex items-center gap-1 shadow-[0_0_10px_rgba(236,72,153,0.3)]">
          <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
          <span className="text-[10px] font-bold text-pink-400 neon-text-glow drop-shadow-md">
            Lvl 27 • NeoRider
          </span>
        </div>
        <img 
          src="/__mockup/images/neura-neon-avatar.png" 
          alt="Player" 
          className="w-24 h-48 object-cover object-top mask-image-gradient mt-2 opacity-90 drop-shadow-[0_0_15px_rgba(236,72,153,0.4)]"
          style={{ maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
        />
      </div>

      {/* HUD LAYER */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        
        {/* TOP LEFT: Minimap & Profile */}
        <div className="absolute top-3 left-3 flex items-start gap-3 pointer-events-auto">
          {/* Minimap */}
          <div className="relative w-[80px] h-[80px] rounded-full border-2 border-cyan-500/50 overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pop-in">
            <img 
              src="/__mockup/images/ng-ingame-minimap.png" 
              alt="Minimap" 
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 rounded-full border border-white/10" />
            {/* Player marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_8px_#ec4899] border border-white z-10">
              <div className="absolute inset-0 border-t-2 border-white rounded-full animate-rotate-hint" />
            </div>
            {/* Scan line */}
            <div className="absolute inset-0 bg-cyan-500/20 origin-bottom rounded-full animate-scan mix-blend-screen" />
          </div>

          {/* Profile & XP */}
          <div className="flex flex-col gap-1 mt-1 animate-slide-pop-left delay-100">
            <div className="glass-panel rounded-full pr-3 pl-1 py-1 flex items-center gap-2 border-l-2 border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
              <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-0.5 shadow-[0_0_10px_#ec4899]">
                <img src="/__mockup/images/neura-neon-avatar.png" className="w-full h-full rounded-full object-cover" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center">
                  <span className="text-[8px] font-bold text-black">V</span>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-xs font-bold text-white leading-none">NeoRider</span>
                <span className="text-[9px] text-pink-400 font-semibold neon-text-glow leading-none mt-0.5">Lv. 27 VIP</span>
              </div>
            </div>
            
            {/* XP Bar */}
            <div className="w-32 h-2.5 bg-black/60 rounded-full border border-white/10 overflow-hidden relative backdrop-blur-md">
              <div className="absolute top-0 left-0 h-full w-[70%] bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_#06b6d4]">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InBhdHRlcm4iIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0wIDRMMCAwTDQgMEw4IDRMOCA4TDQgOFoiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')] animate-bar-stripes opacity-30" />
              </div>
            </div>
          </div>
        </div>

        {/* TOP RIGHT: Currency & Settings */}
        <div className="absolute top-3 right-3 flex items-start gap-4 pointer-events-auto">
          {/* Currencies */}
          <div className="flex gap-2 animate-slide-pop delay-100">
            <div className="glass-panel px-3 py-1 rounded-full flex items-center gap-1.5 border border-yellow-500/30">
              <Coins className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_5px_#facc15]" />
              <span className="text-sm font-bold text-white drop-shadow-md">24,580</span>
            </div>
            <div className="glass-panel px-3 py-1 rounded-full flex items-center gap-1.5 border border-cyan-500/30">
              <Diamond className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_5px_#06b6d4]" />
              <span className="text-sm font-bold text-white drop-shadow-md">312</span>
            </div>
          </div>
          
          {/* Menus */}
          <div className="flex gap-2 animate-pop-in delay-200">
            <button className="w-9 h-9 rounded-full glass-panel flex items-center justify-center border border-white/20 text-white hover:bg-white/20 active:scale-95 transition-all button-pop">
              <MessageSquare className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-full glass-panel flex items-center justify-center border border-white/20 text-white hover:bg-white/20 active:scale-95 transition-all button-pop">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LEFT CENTER: Quick Actions */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto animate-slide-pop-left delay-300">
          <button className="w-10 h-10 rounded-full glass-panel border border-pink-500/40 text-pink-400 flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.2)] active:scale-95 transition-all hover:bg-pink-500/20">
            <Heart className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full glass-panel border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.2)] active:scale-95 transition-all hover:bg-cyan-500/20">
            <User className="w-5 h-5" />
          </button>
        </div>

        {/* BOTTOM LEFT: Joystick */}
        <div className="absolute bottom-6 left-10 pointer-events-auto animate-pop-in delay-200">
          <div className="w-32 h-32 rounded-full glass-panel border-2 border-white/10 flex items-center justify-center shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-md">
            <div className="absolute inset-2 rounded-full border border-cyan-500/20" />
            {/* Knob */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_15px_#06b6d4,inset_0_2px_4px_rgba(255,255,255,0.5)] border border-cyan-300 transform -translate-x-3 -translate-y-3 cursor-pointer active:scale-95 transition-transform" />
          </div>
        </div>

        {/* BOTTOM RIGHT: Action Buttons */}
        <div className="absolute bottom-6 right-10 pointer-events-auto animate-slide-pop delay-300">
          <div className="relative w-40 h-40">
            {/* Main Action (Jump) */}
            <button className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-[0_0_20px_#ec4899,inset_0_2px_5px_rgba(255,255,255,0.4)] border border-pink-300 flex items-center justify-center active:scale-95 transition-all animate-main-btn-glow z-10 text-white">
              <ArrowUp className="w-8 h-8 drop-shadow-md" />
            </button>

            {/* Sub Action 1 (Interact) */}
            <button className="absolute bottom-24 right-4 w-12 h-12 rounded-full glass-panel border border-cyan-500/50 bg-cyan-950/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] flex items-center justify-center active:scale-95 transition-all button-pop">
              <HandMetal className="w-6 h-6" />
            </button>

            {/* Sub Action 2 (Sit) */}
            <button className="absolute bottom-16 right-20 w-12 h-12 rounded-full glass-panel border border-cyan-500/50 bg-cyan-950/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] flex items-center justify-center active:scale-95 transition-all button-pop">
              <Zap className="w-6 h-6" />
            </button>

            {/* Sub Action 3 (Emote) */}
            <button className="absolute bottom-2 right-24 w-12 h-12 rounded-full glass-panel border border-cyan-500/50 bg-cyan-950/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] flex items-center justify-center active:scale-95 transition-all button-pop">
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* BOTTOM CENTER: Quick Chat */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto animate-pop-in delay-400 w-80">
          <div className="glass-panel h-10 rounded-full flex items-center px-4 border border-white/10 shadow-lg cursor-text hover:bg-white/10 transition-colors">
            <MessageSquare className="w-4 h-4 text-white/50 mr-3" />
            <span className="text-sm text-white/50 font-medium">Tap to chat...</span>
          </div>
        </div>

      </div>
    </div>
  );
}
