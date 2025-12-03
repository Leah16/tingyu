
import React from 'react';

interface PlayerControlsProps {
  onReupload: () => void; // Kept for type compatibility if needed, but unused in UI
  isPlaying: boolean;
  togglePlay: () => void;
  fileName: string;
  bpm: number;
  format?: string;
  bitrate?: number;
  sampleRate?: number;
  onNext: () => void;
  onPrev: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onTogglePlaylist: () => void;
  visible: boolean;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  onReupload,
  isPlaying,
  togglePlay,
  fileName,
  bpm,
  format,
  bitrate,
  sampleRate,
  onNext,
  onPrev,
  hasPrev,
  hasNext,
  onTogglePlaylist,
  visible
}) => {
  const [showInfo, setShowInfo] = React.useState(false);

  return (
    <div className="fixed bottom-0 left-0 w-full p-6 md:p-12 z-30 transition-all duration-1000 group">

      {/* Background gradient on hover or visible */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-1000 pointer-events-none ${visible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

      <div className={`relative max-w-screen-md mx-auto flex flex-col items-center space-y-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}>

        {/* Title / Info Display */}
        <div className="relative flex flex-col items-center justify-center h-16 w-full">
          {/* Technical Info */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 transform ${showInfo ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="text-stone-500 text-[10px] tracking-[0.4em] uppercase h-4 flex items-center">
              Track Info
            </div>
            <div className="text-stone-300 text-sm font-light tracking-widest mt-2 font-mono opacity-80 h-6 flex items-center">
              {bitrate ? `${bitrate}kbps` : '---'} • {sampleRate ? `${sampleRate}Hz` : '---'}
            </div>
          </div>

          {/* Standard Info */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 transform ${!showInfo ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="text-stone-500 text-[10px] tracking-[0.4em] uppercase h-4 flex items-center">
              Now Playing {bpm > 0 && `• ${bpm} BPM`}
            </div>
            <div className="text-stone-200 text-lg font-light tracking-widest text-center opacity-90 font-serif max-w-[80vw] truncate mt-2 h-6 flex items-center justify-center">
              {fileName}
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-8 w-full relative">

          {/* Info Button (Replaces Eject) */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`absolute left-0 md:left-4 transition-colors duration-500 text-[10px] tracking-[0.2em] uppercase py-2 border-b border-transparent hover:border-stone-500 ${showInfo ? 'text-white border-stone-500' : 'text-stone-500 hover:text-white'}`}
          >
            Info
          </button>

          <div className="flex items-center gap-6">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className={`text-stone-400 hover:text-white transition-all duration-300 ${!hasPrev ? 'opacity-20 cursor-not-allowed' : 'opacity-100'}`}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 flex items-center justify-center rounded-full border border-stone-700 hover:border-stone-400 text-stone-300 hover:text-white bg-black/20 hover:bg-white/5 backdrop-blur-md transition-all duration-500 hover:scale-105"
            >
              {isPlaying ? (
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <rect x="7" y="5" width="3" height="14" />
                  <rect x="14" y="5" width="3" height="14" />
                </svg>
              ) : (
                <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!hasNext}
              className={`text-stone-400 hover:text-white transition-all duration-300 ${!hasNext ? 'opacity-20 cursor-not-allowed' : 'opacity-100'}`}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          <button
            onClick={onTogglePlaylist}
            className="absolute right-0 md:right-4 text-stone-400 hover:text-white transition-colors duration-300"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;
