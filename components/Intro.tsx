
import React, { useRef } from 'react';

interface IntroProps {
  onFileSelect: (file: File | string) => void;
  isLoading: boolean;
}

const Intro: React.FC<IntroProps> = ({ onFileSelect, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = async () => {
    if (!isLoading) {
      if (window.ipcRenderer) {
        // Use Electron dialog
        const filePaths = await window.ipcRenderer.musicLib.selectMusicFiles();
        if (filePaths.length > 0) {
          // We'll trigger the callback with file paths instead of File objects
          onFileSelect(filePaths[0]); // Pass the first file path
        }
      } else {
        // Fallback to HTML input for browser
        inputRef.current?.click();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-center h-screen w-full px-4 animate-fade-in bg-gradient-to-b from-black/20 to-black/60">

      {/* Decorative Blur Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-slate-800/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="relative flex flex-col items-center">
        <div
          onClick={handleClick}
          className={`group relative flex items-center justify-center w-24 h-24 transition-all duration-700 ${isLoading ? 'cursor-wait' : 'cursor-pointer'}`}
        >
          {/* Button Background */}
          <div className={`absolute inset-0 rounded-full border border-stone-700/30 bg-black/10 backdrop-blur-sm transition-all duration-700 ${isLoading ? 'scale-100 border-stone-500/50 animate-pulse' : 'scale-90 group-hover:scale-100 group-hover:border-stone-500/50 group-hover:bg-white/5'}`} />

          {/* Inner Ring */}
          <div className={`absolute inset-0 rounded-full border border-white/5 transition-all duration-700 ${isLoading ? 'scale-100 opacity-50' : 'scale-75 opacity-0 group-hover:scale-90 group-hover:opacity-100'}`} />

          {/* Icon */}
          <div className={`relative transition-all duration-500 ${isLoading ? 'opacity-50' : 'opacity-80 group-hover:opacity-100 group-hover:scale-110'}`}>
            {isLoading ? (
              <svg className="w-8 h-8 text-stone-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="1" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="1" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-stone-300 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Intro;
