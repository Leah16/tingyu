import React, { useRef } from 'react';
import { Track } from '../types';

interface PlaylistProps {
  tracks: Track[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
  onAdd: (files: FileList) => void;
  onRemove: (e: React.MouseEvent, index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClear: () => void;
}

const Playlist: React.FC<PlaylistProps> = ({
  tracks,
  currentIndex,
  isOpen,
  onClose,
  onSelect,
  onAdd,
  onRemove,
  onReorder,
  onClear
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddClick = async () => {
    if (window.ipcRenderer) {
      const filePaths = await window.ipcRenderer.musicLib.selectMusicFiles();
      if (filePaths.length > 0) {
        onAdd(filePaths as any);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAdd(e.target.files);
    }
    if (e.target) e.target.value = '';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-700 ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[420px] bg-black/60 backdrop-blur-2xl border-l border-white/5 z-50 transform transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        <div className="flex flex-col h-full p-10">

          {/* Header */}
          <div className="flex justify-between items-end mb-12 pb-6 border-b border-white/5">
            <h2 className="text-2xl font-thin tracking-[0.3em] text-white/90">
              PLAYLIST
            </h2>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/80 transition-colors duration-300 text-[10px] tracking-[0.2em] uppercase"
            >
              Close
            </button>
          </div>

          {/* Track List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                onClick={() => onSelect(index)}
                className={`group relative flex items-center justify-between py-4 px-4 cursor-pointer transition-all duration-500 rounded-sm border border-transparent hover:border-white/5 hover:bg-white/5 ${index === currentIndex ? 'bg-white/5 border-white/5' : ''}`}
              >
                <div className="flex items-center gap-6 overflow-hidden">
                  <span className={`text-[10px] font-light tracking-widest w-6 transition-colors duration-300 ${index === currentIndex ? 'text-white/90' : 'text-white/20'}`}>
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="flex flex-col overflow-hidden gap-1">
                    <span className={`text-sm tracking-[0.1em] truncate font-light transition-colors duration-300 ${index === currentIndex ? 'text-white/90' : 'text-white/50 group-hover:text-white/80'}`}>
                      {track.name}
                    </span>
                    {track.bpm > 0 && (
                      <span className="text-[9px] text-white/20 tracking-widest">
                        {track.bpm} BPM
                      </span>
                    )}
                  </div>
                </div>

                {/* Controls - Fade in on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                  {/* Move Up */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onReorder(index, index - 1); }}
                    disabled={index === 0}
                    className={`p-2 text-white/20 hover:text-white/80 transition-colors ${index === 0 ? 'invisible' : ''}`}
                    title="Move Up"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 8V2M5 2L2 5M5 2L8 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onReorder(index, index + 1); }}
                    disabled={index === tracks.length - 1}
                    className={`p-2 text-white/20 hover:text-white/80 transition-colors ${index === tracks.length - 1 ? 'invisible' : ''}`}
                    title="Move Down"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 2V8M5 8L2 5M5 8L8 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => onRemove(e, index)}
                    className="p-2 text-white/20 hover:text-red-400/80 transition-colors ml-2"
                    title="Remove"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {tracks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-white/20 space-y-4">
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                <span className="text-[10px] tracking-[0.3em] font-light">EMPTY LIBRARY</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-8 mt-6 border-t border-white/5">
            <div className="flex gap-4">
              <button
                onClick={handleAddClick}
                className="flex-1 py-4 border border-white/10 hover:border-white/30 bg-white/0 hover:bg-white/5 text-white/40 hover:text-white/90 transition-all duration-500 text-[10px] tracking-[0.3em] uppercase group relative overflow-hidden"
              >
                <span className="relative z-10">Add Tracks</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Clear all tracks?')) {
                    onClear();
                  }
                }}
                className="px-6 py-4 border border-white/10 hover:border-red-500/30 bg-white/0 hover:bg-red-500/5 text-white/40 hover:text-red-400/90 transition-all duration-500 text-[10px] tracking-[0.3em] uppercase"
              >
                Clear
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

        </div>
      </div>
    </>
  );
};

export default Playlist;
