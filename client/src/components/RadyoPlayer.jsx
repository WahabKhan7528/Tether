import { useRef } from 'react';
import { Play, Pause, Upload, FastForward, Rewind, SkipForward, SkipBack } from 'lucide-react';
import { useRadio } from '../context/RadioContext';

export default function RadyoPlayer() {
  const { 
    isPlaying, 
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
    seek 
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
        <div className="rounded-xl border-[4px] md:border-[6px] border-ethereal-outline shadow-inner bg-ethereal-surface-dim overflow-hidden flex flex-col h-[220px] md:h-[300px]">
          
          {/* Top Section: Speaker Grill Area */}
          <div className="flex-1 flex w-full relative overflow-hidden">
            
            {/* Left Vertical Slats */}
            <div className="w-12 md:w-16 h-full bg-[#1a1a1a] border-r-2 md:border-r-4 border-black/50 relative overflow-hidden flex justify-evenly shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1 md:w-1.5 h-full bg-gradient-to-r from-gray-700 via-gray-600 to-black/80 shadow-[2px_0_5px_rgba(0,0,0,0.8)]" />
              ))}
            </div>

            {/* Main Speaker Grill */}
            <div className="flex-1 h-full bg-[#2a2a2a] relative overflow-hidden flex items-center justify-center p-2 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)]">
              
              {/* Cassette Reels behind grill */}
              <div className="absolute inset-0 flex justify-around items-center opacity-80 z-0 px-2 md:px-4">
                
                {/* Magnetic Tape Connecting Reels */}
                <div className="absolute top-[48%] left-6 right-6 md:left-10 md:right-10 h-0.5 md:h-1 bg-black/80 shadow-[0_1px_1px_rgba(255,255,255,0.1)] z-0" />
                <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-24 md:w-32 h-4 md:h-6 bg-black/60 rounded-t-lg border-t border-x border-gray-600/30 z-0 flex justify-center pt-1">
                   <div className="w-16 md:w-20 h-0.5 md:h-1 bg-gray-400/20 rounded-full" />
                </div>

                {/* Left Reel */}
                <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full border-2 md:border-[3px] border-gray-500/40 flex items-center justify-center relative ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''} bg-black/40 shadow-[inset_0_0_12px_rgba(0,0,0,0.8),0_5px_10px_rgba(0,0,0,0.5)] z-10`}>
                  <div className="absolute inset-1 md:inset-2 rounded-full border-4 md:border-[6px] border-[#111] shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
                  <div className="w-6 h-6 md:w-10 md:h-10 rounded-full border border-gray-400/50 bg-gray-200/90 flex items-center justify-center relative z-10 shadow-md">
                    <div className="absolute w-full h-[2px] md:h-[3px] bg-[#222]" />
                    <div className="absolute w-full h-[2px] md:h-[3px] bg-[#222]" style={{ transform: 'rotate(60deg)' }} />
                    <div className="absolute w-full h-[2px] md:h-[3px] bg-[#222]" style={{ transform: 'rotate(120deg)' }} />
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gray-400 relative z-20 shadow-inner border border-gray-500" />
                  </div>
                </div>

                {/* Right Reel */}
                <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full border-2 md:border-[3px] border-gray-500/40 flex items-center justify-center relative ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''} bg-black/40 shadow-[inset_0_0_12px_rgba(0,0,0,0.8),0_5px_10px_rgba(0,0,0,0.5)] z-10`}>
                  <div className="absolute inset-1 md:inset-2 rounded-full border-4 md:border-[6px] border-[#111] shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
                  <div className="w-6 h-6 md:w-10 md:h-10 rounded-full border border-gray-400/50 bg-gray-200/90 flex items-center justify-center relative z-10 shadow-md">
                    <div className="absolute w-full h-[2px] md:h-[3px] bg-[#222]" />
                    <div className="absolute w-full h-[2px] md:h-[3px] bg-[#222]" style={{ transform: 'rotate(60deg)' }} />
                    <div className="absolute w-full h-[2px] md:h-[3px] bg-[#222]" style={{ transform: 'rotate(120deg)' }} />
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gray-400 relative z-20 shadow-inner border border-gray-500" />
                  </div>
                </div>
              </div>

              {/* Glass Window Reflection */}
              <div className="absolute inset-0 z-10 opacity-20 pointer-events-none"
                   style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.6) 45%, transparent 50%)' }}
              />

              {/* Perforated Metal Speaker Grill - Mobile (smaller mesh) */}
              <div 
                className="absolute inset-0 z-20 opacity-80 pointer-events-none shadow-[inset_0_0_25px_rgba(0,0,0,0.9)] mix-blend-overlay md:hidden"
                style={{
                  backgroundImage: 'radial-gradient(black 35%, transparent 35%), radial-gradient(black 35%, transparent 35%)',
                  backgroundSize: '4px 4px',
                  backgroundPosition: '0 0, 2px 2px'
                }}
              />
              {/* Perforated Metal Speaker Grill - Desktop */}
              <div 
                className="absolute inset-0 z-20 opacity-80 pointer-events-none shadow-[inset_0_0_25px_rgba(0,0,0,0.9)] mix-blend-overlay hidden md:block"
                style={{
                  backgroundImage: 'radial-gradient(black 35%, transparent 35%), radial-gradient(black 35%, transparent 35%)',
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 4px 4px'
                }}
              />

              {/* Center Logo Plate on Grill */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 px-3 md:px-4 py-1 md:py-1.5 rounded-sm shadow-[0_4px_6px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-black/60 flex items-center justify-center"
                   style={{ background: 'linear-gradient(to bottom, #4a4a4a, #1a1a1a)' }}>
                 {/* Screws */}
                 <div className="absolute left-1 top-1/2 -translate-y-1/2 w-[2px] md:w-[3px] h-[2px] md:h-[3px] rounded-full bg-black/80 shadow-[inset_0_0_1px_rgba(255,255,255,0.4)]" />
                 <div className="absolute right-1 top-1/2 -translate-y-1/2 w-[2px] md:w-[3px] h-[2px] md:h-[3px] rounded-full bg-black/80 shadow-[inset_0_0_1px_rgba(255,255,255,0.4)]" />
                 
                 <span className="text-[7px] md:text-[9px] font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-200 to-gray-500 tracking-widest uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">Tether</span>
              </div>
            </div>
          </div>

          {/* Bottom Section: Control Panel */}
          <div className="h-auto md:h-32 bg-ethereal-surface border-t-[3px] md:border-t-4 border-ethereal-outline relative p-2 md:p-3 flex flex-col justify-between shadow-inner">
            
            {/* Top row of control panel: Tuning Window */}
            <div className="w-full flex items-center justify-between mb-3 md:mb-4 gap-2 md:gap-3 px-1 md:px-2">
               
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

            {/* Bottom row: Knobs and Buttons */}
            <div className="flex justify-between items-center px-1 relative">
              
              {/* Play/Pause Button */}
              <button 
                onClick={togglePlay}
                className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-ethereal-primary shadow-[inset_0_2px_3px_rgba(255,255,255,0.25),0_3px_5px_rgba(0,0,0,0.4)] border border-black/20 flex items-center justify-center active:scale-[0.98] active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-0.5 text-ethereal-surface hover:brightness-110 transition-all"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={10} className="fill-current md:w-3 md:h-3" /> : <Play size={10} className="fill-current ml-0.5 md:w-3 md:h-3" />}
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
