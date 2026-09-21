import { useRef } from 'react';
import { Play, Pause, Upload, FastForward, Rewind, SkipForward, SkipBack, Loader2 } from 'lucide-react';
import { useRadio } from '../context/RadioContext';

export default function RadyoPlayer() {
  const { 
    isPlaying,
    isLoading,
    volume, 
    setVolume, 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    addTrack, 
    fastForward, 
    rewind,
    currentTime,
    duration,
    progress,
    seek,
    currentTrack
  } = useRadio();
  
  const fileInputRef = useRef(null);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      addTrack(file);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto transform hover:scale-[1.02] transition-transform duration-500 z-10 pb-24 md:pb-0">

      {/* Shadow under the radio */}
      <div className="absolute bottom-20 md:-bottom-4 left-4 right-4 h-8 bg-black/40 dark:bg-black/80 blur-xl rounded-full z-0" />

      {/* Main Radio Body - Theme Colors */}
      <div 
        className="relative z-10 rounded-2xl p-2 md:p-3 bg-ethereal-surface overflow-hidden border border-ethereal-tertiary/30 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.6),inset_0_2px_3px_rgba(255,255,255,0.1)]"
        style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)' }}
      >
        
        {/* Inner border frame */}
        <div className="rounded-xl border-[4px] md:border-[6px] border-ethereal-outline shadow-inner bg-ethereal-surface-dim overflow-hidden flex flex-col h-[270px] md:h-[300px]">
          
          {/* Top Section: Speaker Grill Area (Reel-to-Reel Design) */}
          <div className="flex-1 flex w-full relative overflow-hidden">
            
            {/* Left Vertical Slats (Heatsink / Grill look) */}
            <div className="w-12 md:w-16 h-full bg-[#0a0a0a] border-r border-black relative overflow-hidden flex justify-evenly shadow-[inset_-8px_0_20px_rgba(0,0,0,1)] z-20 py-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-1 md:w-1.5 h-full bg-gradient-to-r from-[#3a3a3a] via-[#1a1a1a] to-[#050505] shadow-[2px_0_3px_rgba(0,0,0,1)] rounded-full" />
              ))}
            </div>

            {/* Main Speaker Grill and Reels */}
            <div className="flex-1 h-full relative overflow-hidden flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,1)] bg-[#181818]">
              
              {/* Premium Perforated Metal Mesh */}
              <div 
                className="absolute inset-0 z-0 opacity-60"
                style={{
                  backgroundImage: 'radial-gradient(circle at center, #000 1.5px, transparent 2px), radial-gradient(circle at center, #000 1.5px, transparent 2px)',
                  backgroundSize: '10px 10px',
                  backgroundPosition: '0 0, 5px 5px'
                }}
              />
              
              {/* Lighting overlay for the mesh to make it look curved/lit */}
              <div className="absolute inset-0 z-0 opacity-60 pointer-events-none bg-gradient-to-b from-white/10 via-transparent to-black/90" />

              {/* Reels Area Container */}
              <div className="absolute inset-0 flex justify-between items-center px-2 md:px-4 z-10">
                
                {/* Tape Path Behind Reels */}
                <div className="absolute top-[48%] left-8 right-8 md:left-12 md:right-12 h-[1px] md:h-[2px] bg-black/90 shadow-[0_1px_1px_rgba(255,255,255,0.15)] z-0" />
                
                {/* Tape Bridge (Bottom) */}
                <div className="absolute bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 w-32 md:w-48 h-6 md:h-8 bg-gradient-to-b from-[#2a2a2a] to-[#151515] rounded-t-xl border-t border-x border-gray-600/40 shadow-[0_-5px_15px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.1)] z-0 flex justify-between items-start px-4 md:px-8 pt-1.5 md:pt-2">
                   {/* Left Pinch Roller */}
                   <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#050505] shadow-[inset_0_1px_3px_rgba(0,0,0,1),0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-gray-600 shadow-inner" />
                   </div>
                   {/* Center Tape Head */}
                   <div className="w-12 md:w-16 h-2 md:h-2.5 bg-[#111] rounded-sm shadow-[inset_0_1px_3px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.1)] relative flex justify-center overflow-hidden">
                     <div className="w-[70%] h-full bg-gradient-to-r from-gray-700 via-gray-400 to-gray-700 opacity-80" />
                     <div className="absolute bottom-0 w-full h-[1px] md:h-[1.5px] bg-[#0a0a0a] shadow-[0_-1px_1px_rgba(0,0,0,0.5)]" />
                   </div>
                   {/* Right Capstan / Guide */}
                   <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.8)] border border-gray-700 flex items-center justify-center">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-[#111] shadow-inner" />
                   </div>
                </div>

                {/* Left Reel (Supply) */}
                <div className="relative w-[88px] h-[88px] md:w-[100px] md:h-[100px] rounded-full shadow-[0_15px_25px_rgba(0,0,0,0.9)] border-[3px] md:border-[4px] border-[#333] bg-black/50">
                  <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,1)] pointer-events-none z-30" />
                  <div className={`absolute inset-0 rounded-full ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                    {/* Tape pack */}
                    <div 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#111] shadow-[0_0_10px_rgba(0,0,0,1),inset_0_0_8px_rgba(0,0,0,1)] border border-[#222] transition-all duration-1000 z-0"
                      style={{
                        width: `calc(40% + (1 - ${(Number(progress) || 0)/100}) * 55%)`,
                        height: `calc(40% + (1 - ${(Number(progress) || 0)/100}) * 55%)`,
                      }}
                    >
                       <div className="absolute inset-0 rounded-full border border-white/[0.02] m-[10%]" />
                       <div className="absolute inset-0 rounded-full border border-white/[0.03] m-[20%]" />
                       <div className="absolute inset-0 rounded-full border border-white/[0.01] m-[30%]" />
                    </div>
                    {/* Spokes */}
                    <div className="absolute inset-0 z-10">
                       {[0, 120, 240].map(deg => (
                         <div 
                           key={deg} 
                           className="absolute top-1/2 left-1/2 bg-gradient-to-r from-[#555] via-[#aaa] to-[#555] rounded-[2px] shadow-[0_4px_6px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.7)] border border-gray-600" 
                           style={{ 
                             width: '35%', height: '10%', transformOrigin: '0% 50%',
                             transform: `translate(0, -50%) rotate(${deg}deg) translateX(35%)`, 
                           }} 
                         />
                       ))}
                    </div>
                    {/* Center Spindle */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-400 border border-gray-500 shadow-[0_3px_6px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.9)] flex items-center justify-center z-20">
                       <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)] flex items-center justify-center">
                          <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-gray-400" />
                       </div>
                    </div>
                  </div>
                </div>

                {/* Right Reel (Take-up) */}
                <div className="relative w-[88px] h-[88px] md:w-[100px] md:h-[100px] rounded-full shadow-[0_15px_25px_rgba(0,0,0,0.9)] border-[3px] md:border-[4px] border-[#333] bg-black/50">
                  <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,1)] pointer-events-none z-30" />
                  <div className={`absolute inset-0 rounded-full ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                    {/* Tape pack */}
                    <div 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#111] shadow-[0_0_10px_rgba(0,0,0,1),inset_0_0_8px_rgba(0,0,0,1)] border border-[#222] transition-all duration-1000 z-0"
                      style={{
                        width: `calc(40% + (${(Number(progress) || 0)/100}) * 55%)`,
                        height: `calc(40% + (${(Number(progress) || 0)/100}) * 55%)`,
                      }}
                    >
                       <div className="absolute inset-0 rounded-full border border-white/[0.02] m-[10%]" />
                       <div className="absolute inset-0 rounded-full border border-white/[0.03] m-[20%]" />
                       <div className="absolute inset-0 rounded-full border border-white/[0.01] m-[30%]" />
                    </div>
                    {/* Spokes */}
                    <div className="absolute inset-0 z-10">
                       {[0, 120, 240].map(deg => (
                         <div 
                           key={deg} 
                           className="absolute top-1/2 left-1/2 bg-gradient-to-r from-[#555] via-[#aaa] to-[#555] rounded-[2px] shadow-[0_4px_6px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.7)] border border-gray-600" 
                           style={{ 
                             width: '35%', height: '10%', transformOrigin: '0% 50%',
                             transform: `translate(0, -50%) rotate(${deg}deg) translateX(35%)`, 
                           }} 
                         />
                       ))}
                    </div>
                    {/* Center Spindle */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-400 border border-gray-500 shadow-[0_3px_6px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.9)] flex items-center justify-center z-20">
                       <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#111] shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)] flex items-center justify-center">
                          <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-gray-400" />
                       </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Center Logo Plate on Grill */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 px-4 md:px-5 py-1 md:py-1.5 rounded-md md:rounded-lg shadow-[0_12px_25px_rgba(0,0,0,0.9),0_2px_5px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-black flex items-center justify-center bg-[#252525] overflow-hidden">
                 {/* Brushed metal texture */}
                 <div className="absolute inset-0 opacity-50 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.15) 1px, rgba(255,255,255,0.15) 2px)' }} />
                 {/* Lighting gradient */}
                 <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/80 pointer-events-none" />
                 
                 {/* Screws */}
                 <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-gradient-to-br from-gray-300 to-gray-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center border border-black/50">
                   <div className="w-[70%] h-[1px] md:h-[1.5px] bg-[#111] rotate-45 shadow-[inset_0_1px_0_rgba(0,0,0,1)]" />
                 </div>
                 <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-gradient-to-br from-gray-300 to-gray-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center border border-black/50">
                   <div className="w-[70%] h-[1px] md:h-[1.5px] bg-[#111] -rotate-12 shadow-[inset_0_1px_0_rgba(0,0,0,1)]" />
                 </div>
                 
                 <span className="relative z-10 text-[10px] md:text-[12px] font-heading font-light text-transparent bg-clip-text bg-gradient-to-b from-gray-100 to-gray-500 tracking-[0.25em] uppercase drop-shadow-[0_2px_3px_rgba(0,0,0,1)] ml-[0.25em]">Tether</span>
              </div>

              {/* Front Glass Reflection */}
              <div 
                className="absolute inset-0 z-40 opacity-40 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 65%, rgba(255,255,255,0.1) 100%)' }}
              />

            </div>
          </div>

          {/* Bottom Section: Control Panel */}
          <div className="h-[135px] md:h-36 bg-ethereal-surface border-t-[3px] md:border-t-4 border-ethereal-outline relative p-2 md:p-3 flex flex-col justify-between shadow-inner">
            <style>{`
              @keyframes marquee {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-150%); }
              }
              .animate-marquee {
                display: inline-block;
                white-space: nowrap;
                animation: marquee 18s linear infinite;
              }
            `}</style>
            
            {/* Top section of control panel: Track Name & Tuning Window */}
            <div className="w-full flex flex-col gap-1.5 md:gap-2 mb-3 md:mb-4">
               
               {/* Digital Track Name Display */}
               <div className="w-full flex justify-center px-4">
                 <div className="bg-[#0a0a0a] border border-[#222] shadow-[inset_0_1px_4px_rgba(0,0,0,1)] rounded px-3 py-0.5 md:py-1 flex items-center max-w-[85%] overflow-hidden relative w-full">
                   <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none z-20" />
                   {/* Left and right fade for the marquee effect */}
                   <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
                   <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
                   
                   <div className="w-full overflow-hidden relative z-10 flex">
                     <span className="text-[9px] md:text-[11px] font-mono text-ethereal-primary drop-shadow-[0_0_4px_currentColor] animate-marquee">
                       {currentTrack ? currentTrack.name : 'NO TAPE LOADED'}
                     </span>
                   </div>
                 </div>
               </div>

               <div className="w-full flex items-center justify-between gap-2 md:gap-3 px-1 md:px-2">
                 {/* LED Power Indicator */}
                 <div 
                   className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 transition-all duration-300 ${
                     isPlaying 
                       ? 'bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.8),inset_0_1px_2px_rgba(255,255,255,0.8)]' 
                       : 'bg-red-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] border border-black/30'
                   }`}
                   title={isPlaying ? "Power On" : "Power Off"}
                 />

                 {/* Left timestamp */}
                 <span className="text-[8px] md:text-[10px] text-ethereal-tertiary/70 font-mono w-6 md:w-8 text-right">{formatTime(currentTime)}</span>
                 
                 {/* Tuning Window (Progress Bar) */}
                 <div className="flex-1 h-4 md:h-6 bg-ethereal-surface-dim border border-ethereal-outline rounded-full flex items-center px-2 md:px-4 relative overflow-hidden shadow-inner group cursor-pointer">
                   <div className="flex space-x-1 items-end h-full w-full justify-between opacity-50">
                      {[...Array(24)].map((_, i) => (
                        <div key={i} className={`w-px bg-ethereal-tertiary ${i % 4 === 0 ? 'h-2 md:h-3' : 'h-1 md:h-1.5'}`} />
                      ))}
                   </div>
                   {/* Tuning Needle */}
                   <div 
                     className="absolute w-[2px] h-full bg-ethereal-error shadow-[0_0_8px_2px_rgba(var(--color-error),0.9),0_0_15px_rgba(var(--color-error),0.6)] transition-all duration-75"
                     style={{ left: `calc(1rem + (100% - 2rem) * ${progress / 100})` }}
                   />
                   
                   {/* Hidden Range Input for Seeking */}
                   <input
                     type="range"
                     min="0"
                     max={duration || 100}
                     value={currentTime}
                     onChange={(e) => seek(Number(e.target.value))}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     title="Seek"
                   />
                 </div>

                 {/* Right timestamp */}
                 <span className="text-[8px] md:text-[10px] text-ethereal-tertiary/70 font-mono w-8 md:w-10 text-left">{formatTime(duration)}</span>
               </div>
            </div>

            {/* Bottom row: Knobs and Buttons */}
            <div className="flex justify-between items-center px-1 relative">
              
              {/* Play/Pause Button */}
              <button 
                onClick={togglePlay}
                className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-ethereal-primary shadow-[inset_0_2px_3px_rgba(255,255,255,0.25),0_3px_5px_rgba(0,0,0,0.4)] border border-black/20 flex items-center justify-center active:scale-[0.98] active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-0.5 text-ethereal-surface hover:brightness-110 transition-all"
                title={isPlaying ? "Pause" : "Play"}
              >
              {isLoading 
                ? <Loader2 size={10} className="animate-spin md:w-3 md:h-3" />
                : isPlaying 
                  ? <Pause size={10} className="fill-current md:w-3 md:h-3" />
                  : <Play size={10} className="fill-current ml-0.5 md:w-3 md:h-3" />}
              </button>

              {/* Prev Track */}
              <button 
                onClick={prevTrack}
                className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-ethereal-surface shadow-[inset_0_2px_3px_rgba(255,255,255,0.1),0_3px_5px_rgba(0,0,0,0.3)] border border-black/20 flex items-center justify-center active:scale-[0.98] active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-0.5 text-ethereal-tertiary hover:brightness-110 transition-all"
                title="Previous Track"
              >
                <SkipBack size={10} className="md:w-3 md:h-3" />
              </button>

              {/* Rewind */}
              <button 
                onClick={rewind}
                className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-ethereal-surface shadow-[inset_0_2px_3px_rgba(255,255,255,0.1),0_4px_6px_rgba(0,0,0,0.3)] border border-black/20 flex items-center justify-center active:scale-[0.98] active:shadow-[inset_0_4px_6px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-0.5 text-ethereal-tertiary hover:brightness-110 transition-all"
                title="Rewind 10s"
              >
                 <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-black/20 shadow-inner flex items-center justify-center bg-ethereal-surface-dim">
                    <Rewind size={8} className="md:w-2.5 md:h-2.5" />
                 </div>
              </button>

              {/* Main Center Knob (Volume) */}
              <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-ethereal-primary shadow-[inset_0_3px_5px_rgba(255,255,255,0.3),0_6px_10px_rgba(0,0,0,0.5)] border border-black/30 flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-[0.98] active:shadow-[inset_0_3px_5px_rgba(255,255,255,0.3),0_4px_6px_rgba(0,0,0,0.5)] active:translate-y-[1px] transition-all">
                 {/* Grip ridges */}
                 <div className="absolute inset-1 rounded-full border-[2px] border-black/20 border-dashed opacity-70" />
                 {/* Center Indent */}
                 <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-ethereal-primary shadow-[inset_0_3px_5px_rgba(0,0,0,0.4),0_1px_1px_rgba(255,255,255,0.2)] border border-black/20" />
                 {/* Indicator */}
                 <div 
                    className="absolute top-1 md:top-1.5 w-1 h-2 md:w-1.5 md:h-3 bg-white rounded-sm origin-[50%_16px] md:origin-[50%_18px] shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                    style={{ transform: `rotate(${(volume / 100) * 270 - 135}deg)` }}
                 />
                 <input 
                    type="range" 
                    min="0" max="100" 
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Volume"
                  />
              </div>

              {/* Fast Forward */}
              <button 
                onClick={fastForward}
                className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-ethereal-surface shadow-[inset_0_2px_3px_rgba(255,255,255,0.1),0_4px_6px_rgba(0,0,0,0.3)] border border-black/20 flex items-center justify-center active:scale-[0.98] active:shadow-[inset_0_4px_6px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-0.5 text-ethereal-tertiary hover:brightness-110 transition-all"
                title="Fast Forward 10s"
              >
                 <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-black/20 shadow-inner flex items-center justify-center bg-ethereal-surface-dim">
                    <FastForward size={8} className="md:w-2.5 md:h-2.5" />
                 </div>
              </button>
              
              {/* Next Track */}
              <button 
                onClick={nextTrack}
                className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-ethereal-surface shadow-[inset_0_2px_3px_rgba(255,255,255,0.1),0_3px_5px_rgba(0,0,0,0.3)] border border-black/20 flex items-center justify-center active:scale-[0.98] active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-0.5 text-ethereal-tertiary hover:brightness-110 transition-all"
                title="Next Track"
              >
                <SkipForward size={10} className="md:w-3 md:h-3" />
              </button>

              {/* Upload Button */}
              <button 
                onClick={handleUploadClick}
                className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-ethereal-primary shadow-[inset_0_2px_3px_rgba(255,255,255,0.25),0_3px_5px_rgba(0,0,0,0.4)] border border-black/20 flex items-center justify-center active:scale-[0.98] active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-0.5 text-ethereal-surface relative group hover:brightness-110 transition-all"
                title="Upload Song"
              >
                <Upload size={10} className="md:w-3 md:h-3" />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="audio/*"
                  onChange={handleFileChange}
                />
              </button>
              
            </div>

            {/* Small text below knobs */}
            <div className="flex justify-between w-full px-1 md:px-2 mt-1 opacity-60 text-[5px] md:text-[7px] text-ethereal-tertiary font-sans uppercase tracking-widest">
               <span>Play</span>
               <span>Prev</span>
               <span>Rew</span>
               <span>Vol</span>
               <span>Fwd</span>
               <span>Next</span>
               <span>Upl</span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
