import { useState, useEffect } from "react";
import { Download, Wifi, Zap, Hexagon, Database, Globe2 } from "lucide-react";
import "./_group.css";

export function MapDownload() {
  const [overallProgress, setOverallProgress] = useState(0);
  const [speed, setSpeed] = useState(14.2);
  const [downloaded, setDownloaded] = useState(0);
  const totalSize = 1485.6;

  const [chunks, setChunks] = useState([
    { id: 1, name: "Neon Plaza District", progress: 100, size: 340.2, status: "complete" },
    { id: 2, name: "Harbor Industrial", progress: 84, size: 285.5, status: "downloading" },
    { id: 3, name: "Skyline Penthouses", progress: 0, size: 412.8, status: "pending" },
    { id: 4, name: "Underground Market", progress: 0, size: 447.1, status: "pending" },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setOverallProgress((prev) => {
        const next = prev + (Math.random() * 0.5);
        return next > 100 ? 100 : next;
      });
      
      setSpeed(12 + Math.random() * 5);
      
      setChunks(prevChunks => {
        const newChunks = [...prevChunks];
        const activeChunkIndex = newChunks.findIndex(c => c.status === "downloading");
        
        if (activeChunkIndex !== -1) {
          const activeChunk = newChunks[activeChunkIndex];
          activeChunk.progress += Math.random() * 2;
          
          if (activeChunk.progress >= 100) {
            activeChunk.progress = 100;
            activeChunk.status = "complete";
            
            const nextChunkIndex = activeChunkIndex + 1;
            if (nextChunkIndex < newChunks.length) {
              newChunks[nextChunkIndex].status = "downloading";
            }
          }
        }
        
        return newChunks;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setDownloaded((overallProgress / 100) * totalSize);
  }, [overallProgress]);

  return (
    <div className="w-[844px] h-[390px] relative overflow-hidden bg-slate-950 font-sans select-none flex items-center">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0 opacity-40 animate-glow-pulse"
        style={{
          backgroundImage: "url('/__mockup/images/ng-mapdl-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] animate-bg-drift" />
      
      {/* Left decorative tech elements */}
      <div className="absolute left-4 top-4 bottom-4 w-12 flex flex-col justify-between items-center z-10 opacity-60">
        <div className="w-8 h-8 rounded-full border border-cyan-500/30 flex items-center justify-center animate-spin-slow">
          <Globe2 className="w-4 h-4 text-cyan-400" />
        </div>
        
        <div className="flex-1 w-px bg-gradient-to-b from-cyan-500/0 via-cyan-500/50 to-pink-500/0 my-4 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-pink-500 animate-glow-pulse" />
        </div>
        
        <div className="w-8 h-8 flex flex-wrap gap-1 items-center justify-center">
          {[...Array(9)].map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-sm ${Math.random() > 0.5 ? 'bg-pink-500/40' : 'bg-slate-800'}`} />
          ))}
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="relative z-10 w-full h-full flex px-20 py-8 gap-8">
        
        {/* Left Column: Status & Overall Progress */}
        <div className="flex-1 flex flex-col justify-center animate-slide-pop-left">
          
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-pink-500/20 p-1.5 rounded-lg border border-pink-500/40">
              <Download className="w-5 h-5 text-pink-400" />
            </div>
            <div className="text-pink-400 text-xs font-bold tracking-widest uppercase">System Update</div>
          </div>
          
          <h1 className="text-4xl font-black text-white italic tracking-tight neon-text-glow mb-6">
            DOWNLOADING<br/>
            <span className="text-cyan-400">CITY MAP</span>
          </h1>
          
          {/* Main Progress Bar */}
          <div className="glass-panel p-4 mb-4">
            <div className="flex justify-between items-end mb-2">
              <div className="text-4xl font-black text-white italic">
                {overallProgress.toFixed(1)}<span className="text-xl text-slate-400">%</span>
              </div>
              <div className="text-right text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1 justify-end text-cyan-400 mb-0.5">
                  <Wifi className="w-3 h-3" />
                  {speed.toFixed(1)} MB/s
                </div>
                {downloaded.toFixed(1)} / {totalSize} MB
              </div>
            </div>
            
            <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full animate-bar-stripes"
                style={{ width: `${overallProgress}%` }}
              />
              <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(236,72,153,0.5)] pointer-events-none mix-blend-overlay rounded-full" />
            </div>
          </div>
          
          {/* Status Text */}
          <div className="flex items-center gap-2 text-xs text-slate-400 italic">
            <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
            <span>Do not turn off your device. Leaving the app may pause the download.</span>
          </div>
          
        </div>
        
        {/* Right Column: Chunk List */}
        <div className="w-[320px] flex flex-col justify-center animate-slide-pop delay-200">
          <div className="glass-panel p-4 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Asset Packages</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {chunks.map((chunk, idx) => (
                <div 
                  key={chunk.id} 
                  className={`p-3 rounded-xl border relative overflow-hidden transition-colors ${
                    chunk.status === 'downloading' 
                      ? 'bg-slate-800/80 border-cyan-500/50 neon-box-glow' 
                      : chunk.status === 'complete'
                      ? 'bg-slate-900/50 border-pink-500/30'
                      : 'bg-slate-900/30 border-slate-800'
                  }`}
                >
                  
                  {/* Background progress for downloading/complete */}
                  {(chunk.status === 'downloading' || chunk.status === 'complete') && (
                    <div 
                      className={`absolute inset-y-0 left-0 opacity-10 ${
                        chunk.status === 'complete' ? 'bg-pink-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${chunk.progress}%` }}
                    />
                  )}
                  
                  <div className="relative z-10 flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <Hexagon className={`w-3 h-3 ${
                        chunk.status === 'complete' ? 'text-pink-400 fill-pink-400/20' 
                        : chunk.status === 'downloading' ? 'text-cyan-400 animate-spin-slow'
                        : 'text-slate-600'
                      }`} />
                      <span className={`text-xs font-bold ${
                        chunk.status === 'complete' ? 'text-slate-300' 
                        : chunk.status === 'downloading' ? 'text-white'
                        : 'text-slate-500'
                      }`}>
                        {chunk.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {chunk.size.toFixed(1)} MB
                    </span>
                  </div>
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          chunk.status === 'complete' ? 'bg-pink-500' 
                          : chunk.status === 'downloading' ? 'bg-cyan-400 animate-bar-stripes'
                          : 'bg-transparent'
                        }`}
                        style={{ width: `${chunk.progress}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold w-8 text-right ${
                      chunk.status === 'complete' ? 'text-pink-400'
                      : chunk.status === 'downloading' ? 'text-cyan-400'
                      : 'text-slate-600'
                    }`}>
                      {Math.floor(chunk.progress)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
        
      </div>
      
    </div>
  );
}
