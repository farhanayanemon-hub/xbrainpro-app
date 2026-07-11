import { useState } from "react";
import { ShieldCheck, Check, X } from "lucide-react";
import "./_group.css";

export function Terms() {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="w-[844px] h-[390px] relative overflow-hidden bg-slate-900 text-white font-sans flex select-none">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 4px;
          box-shadow: 0 0 5px rgba(6, 182, 212, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.8);
        }
      `}</style>

      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 animate-bg-drift"
        style={{ backgroundImage: "url('/__mockup/images/ng-terms-bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-950/90 pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 animate-pop-in">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/50 neon-box-glow-pink">
            <ShieldCheck className="w-6 h-6 text-pink-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 neon-text-glow shadow-black drop-shadow-md">
            Terms & Conditions
          </h1>
        </div>

        {/* Scrollable Document Area */}
        <div className="glass-panel w-[640px] h-[190px] rounded-xl border border-cyan-500/30 bg-slate-900/60 p-5 mb-4 overflow-y-auto custom-scrollbar relative neon-box-glow shadow-xl">
          <div className="space-y-5 text-sm text-gray-300">
            <section>
              <h2 className="text-cyan-400 font-bold uppercase tracking-wide mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-glow-pulse"></span>
                1. Acceptance of Terms
              </h2>
              <p className="leading-relaxed">
                By accessing or using Neura City, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the application. These terms constitute a legally binding agreement between you and Neura Games.
              </p>
            </section>
            
            <section>
              <h2 className="text-cyan-400 font-bold uppercase tracking-wide mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                2. Player Conduct & Safety
              </h2>
              <p className="leading-relaxed">
                We maintain a zero-tolerance policy for harassment, hate speech, or malicious behavior. You agree to treat all citizens of Neura City with respect. Automated bots, exploiting glitches, and unapproved third-party software are strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-cyan-400 font-bold uppercase tracking-wide mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                3. Privacy & Data
              </h2>
              <p className="leading-relaxed">
                Your privacy is paramount. We collect basic device and usage data to improve your game experience. We never sell your personal information to third parties. For full details, please review our separate Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-cyan-400 font-bold uppercase tracking-wide mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                4. Virtual Items & Purchases
              </h2>
              <p className="leading-relaxed">
                Neura Credits (NC) and virtual items have no real-world monetary value. All purchases are final and non-refundable unless required by local law. We reserve the right to modify virtual item properties for game balance.
              </p>
            </section>

            <section>
              <h2 className="text-cyan-400 font-bold uppercase tracking-wide mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                5. Age Requirement
              </h2>
              <p className="leading-relaxed">
                You must be at least 13 years of age to play Neura City. If you are under 18, you must have permission from a parent or legal guardian to make in-app purchases or accept these terms.
              </p>
            </section>
          </div>
        </div>

        {/* Checkbox & Buttons Container */}
        <div className="w-[640px] flex flex-col gap-4">
          <label className="flex items-center justify-center gap-3 cursor-pointer group w-fit mx-auto button-pop">
            <div 
              className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                accepted 
                  ? 'bg-pink-500 border-pink-400 neon-box-glow-pink' 
                  : 'bg-slate-800 border-gray-500 group-hover:border-pink-500/60 group-hover:bg-slate-700'
              }`}
            >
              {accepted && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
            </div>
            <span className={`text-sm transition-colors ${accepted ? 'text-white font-semibold neon-text-glow drop-shadow-md' : 'text-gray-300 group-hover:text-white'}`}>
              I have read and agree to the Terms & Conditions
            </span>
          </label>

          <div className="flex gap-4 justify-center">
            <button className="flex-1 max-w-[160px] h-12 rounded bg-slate-800/80 border border-slate-600 text-gray-300 font-bold uppercase tracking-wider hover:bg-slate-700 hover:text-white transition-colors button-pop flex items-center justify-center gap-2 glass-panel">
              <X className="w-4 h-4" />
              Decline
            </button>
            <button 
              onClick={() => setAccepted(!accepted)}
              className={`flex-1 max-w-[280px] h-12 rounded font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                accepted 
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white animate-main-btn-glow button-pop cursor-pointer hover:brightness-110 border border-pink-400/50' 
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-500 cursor-not-allowed glass-panel'
              }`}
              disabled={!accepted}
            >
              {accepted && <ShieldCheck className="w-5 h-5" />}
              Accept & Continue
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
