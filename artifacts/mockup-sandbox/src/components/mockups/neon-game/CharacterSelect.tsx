import { useState } from "react";
import { ChevronLeft, User } from "lucide-react";
import "./_group.css";

export function CharacterSelect() {
  const [selected, setSelected] = useState<"male" | "female">("male");

  return (
    <div className="w-[844px] h-[390px] bg-slate-950 overflow-hidden relative text-white font-sans select-none flex">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/__mockup/images/ng-charsel-bg.png"
          alt="Cyberpunk City"
          className="w-full h-full object-cover opacity-50 animate-bg-drift"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950/80" />
      </div>

      {/* Header */}
      <div className="absolute top-4 left-6 right-6 z-20 flex justify-between items-center animate-slide-pop-left">
        <button className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors button-pop group">
          <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold tracking-wider uppercase">Back</span>
        </button>
        <h1 className="text-xl font-black tracking-[0.3em] neon-text-glow uppercase">
          Choose Your Character
        </h1>
        <div className="w-16" /> {/* Spacer for balance */}
      </div>

      {/* Characters Area */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pt-10">
        {/* MALE CHARACTER */}
        <div
          className={`absolute transition-all duration-700 ease-in-out cursor-pointer ${
            selected === "male"
              ? "left-1/2 -translate-x-1/2 scale-100 z-20 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "left-[20%] -translate-x-1/2 scale-[0.65] opacity-40 z-10 blur-[1px] grayscale-[0.3]"
          }`}
          onClick={() => setSelected("male")}
        >
          <div className="relative w-[280px] h-[400px] flex items-end justify-center">
            {selected === "male" && (
              <div className="absolute bottom-4 w-48 h-10 rounded-[100%] bg-cyan-500/60 blur-xl animate-glow-pulse pointer-events-none" />
            )}
            <img
              src="/__mockup/images/ng-charsel-male.png"
              alt="Male Character"
              className={`w-full h-full object-contain object-bottom drop-shadow-2xl ${
                selected === "male" ? "animate-float" : ""
              }`}
            />
          </div>
        </div>

        {/* FEMALE CHARACTER */}
        <div
          className={`absolute transition-all duration-700 ease-in-out cursor-pointer ${
            selected === "female"
              ? "left-1/2 -translate-x-1/2 scale-100 z-20 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]"
              : "right-[20%] translate-x-1/2 scale-[0.65] opacity-40 z-10 blur-[1px] grayscale-[0.3]"
          }`}
          onClick={() => setSelected("female")}
        >
          <div className="relative w-[280px] h-[400px] flex items-end justify-center">
            {selected === "female" && (
              <div className="absolute bottom-4 w-48 h-10 rounded-[100%] bg-pink-500/60 blur-xl animate-glow-pulse pointer-events-none" />
            )}
            <img
              src="/__mockup/images/ng-charsel-female.png"
              alt="Female Character"
              className={`w-full h-full object-contain object-bottom drop-shadow-2xl ${
                selected === "female" ? "animate-float" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {/* Right Panel / Controls */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 w-[280px] z-20 flex flex-col gap-6 animate-slide-pop delay-200">
        {/* Selection Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setSelected("male")}
            className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl border glass-panel backdrop-blur-md transition-all duration-300 button-pop ${
              selected === "male"
                ? "neon-box-glow-cyan border-cyan-400 bg-cyan-950/60"
                : "border-slate-700/50 bg-slate-900/40 hover:bg-slate-800/60 opacity-70"
            }`}
          >
            <User
              size={28}
              className={`mb-2 transition-colors ${
                selected === "male" ? "text-cyan-400" : "text-slate-400"
              }`}
            />
            <span
              className={`text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${
                selected === "male" ? "text-cyan-400" : "text-slate-400"
              }`}
            >
              Male
            </span>
          </button>

          <button
            onClick={() => setSelected("female")}
            className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl border glass-panel backdrop-blur-md transition-all duration-300 button-pop ${
              selected === "female"
                ? "neon-box-glow-pink border-pink-400 bg-pink-950/60"
                : "border-slate-700/50 bg-slate-900/40 hover:bg-slate-800/60 opacity-70"
            }`}
          >
            <User
              size={28}
              className={`mb-2 transition-colors ${
                selected === "female" ? "text-pink-400" : "text-slate-400"
              }`}
            />
            <span
              className={`text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${
                selected === "female" ? "text-pink-400" : "text-slate-400"
              }`}
            >
              Female
            </span>
          </button>
        </div>

        {/* Info Box */}
        <div className="p-5 rounded-2xl border border-white/5 glass-panel backdrop-blur-xl text-center shadow-2xl relative overflow-hidden group">
          <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${
            selected === 'male' ? 'from-cyan-500' : 'from-pink-500'
          } to-transparent pointer-events-none transition-colors duration-500`} />
          <h3
            className={`text-lg font-black tracking-[0.25em] uppercase mb-2 transition-colors duration-500 ${
              selected === "male" ? "neon-text-glow-cyan text-cyan-50" : "neon-text-glow text-pink-50"
            }`}
          >
            {selected === "male" ? "Male Avatar" : "Female Avatar"}
          </h3>
          <p className="text-[10px] text-slate-300 leading-relaxed uppercase tracking-[0.1em]">
            Default appearance
            <br />
            <span className="text-white/50 inline-block mt-1">you can customize next</span>
          </p>
        </div>

        {/* Continue Button */}
        <button
          className={`w-full py-5 rounded-full font-black text-white text-sm tracking-[0.3em] uppercase overflow-hidden-shimmer button-pop transition-all duration-500 shadow-2xl ${
            selected === "male"
              ? "animate-main-btn-glow-cyan bg-cyan-600 hover:bg-cyan-500"
              : "animate-main-btn-glow bg-pink-600 hover:bg-pink-500"
          }`}
        >
          <div className="absolute inset-0 bg-white/20 animate-shimmer" />
          <span className="relative z-10 drop-shadow-lg">Continue</span>
        </button>
      </div>
    </div>
  );
}
