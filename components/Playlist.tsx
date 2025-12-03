import React, { useRef, useState, useEffect } from 'react';
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
  playlists: string[];
  viewedPlaylist: string;
  playingPlaylist: string;
  onSwitchPlaylist: (name: string) => void;
  onCreatePlaylist: (name: string) => void;
  onDeletePlaylist: (name: string) => void;
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
  onClear,
  playlists,
  viewedPlaylist,
  playingPlaylist,
  onSwitchPlaylist,
  onCreatePlaylist,
  onDeletePlaylist
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'tracks' | 'playlists'>('tracks');
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Reset view to tracks when opening
  useEffect(() => {
    if (isOpen) {
      setView('tracks');
    }
  }, [isOpen]);

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

  const submitCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreating(false);
    }
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

        <div className="relative w-full h-full overflow-hidden">

          {/* VIEW: TRACKS */}
          <div
            className={`absolute inset-0 flex flex-col p-10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${view === 'tracks' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-[40px] pointer-events-none'}`}
          >
            {/* Header */}
            <div className="flex justify-between items-end mb-8 pb-6 border-b border-white/5">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setView('playlists')}
                  className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-white/40 hover:text-white uppercase transition-colors group"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:-translate-x-1">
                    <path d="M6 8L3 5L6 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Playlists
                </button>
                <h2 className="text-2xl font-thin tracking-[0.3em] text-white/90 uppercase truncate max-w-[280px]">
                  {viewedPlaylist}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/30 hover:text-white/80 transition-colors duration-300 text-[10px] tracking-[0.2em] uppercase mb-1"
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
                  className={`group relative flex items-center justify-between py-4 px-4 cursor-pointer transition-all duration-500 rounded-sm border border-transparent hover:border-white/5 hover:bg-white/5 ${(index === currentIndex && viewedPlaylist === playingPlaylist) ? 'bg-white/5 border-white/5' : ''}`}
                >
                  <div className="flex items-center gap-6 overflow-hidden">
                    <span className={`text-[10px] font-light tracking-widest w-6 transition-colors duration-300 ${(index === currentIndex && viewedPlaylist === playingPlaylist) ? 'text-white/90' : 'text-white/20'}`}>
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="flex flex-col overflow-hidden gap-1">
                      <span className={`text-sm tracking-[0.1em] truncate font-light transition-colors duration-300 ${(index === currentIndex && viewedPlaylist === playingPlaylist) ? 'text-white/90' : 'text-white/50 group-hover:text-white/80'}`}>
                        {track.name}
                      </span>
                      {track.bpm > 0 && (
                        <span className="text-[9px] text-white/20 tracking-widest">
                          {track.bpm} BPM
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onReorder(index, index - 1); }}
                      disabled={index === 0}
                      className={`p-2 text-white/20 hover:text-white/80 transition-colors ${index === 0 ? 'invisible' : ''}`}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8V2M5 2L2 5M5 2L8 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onReorder(index, index + 1); }}
                      disabled={index === tracks.length - 1}
                      className={`p-2 text-white/20 hover:text-white/80 transition-colors ${index === tracks.length - 1 ? 'invisible' : ''}`}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 2V8M5 8L2 5M5 8L8 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <button
                      onClick={(e) => onRemove(e, index)}
                      className="p-2 text-white/20 hover:text-red-400/80 transition-colors ml-2"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                </div>
              ))}

              {tracks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-white/20 space-y-4">
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                  <span className="text-[10px] tracking-[0.3em] font-light">EMPTY PLAYLIST</span>
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
                  onClick={() => { if (confirm('Clear all tracks?')) onClear(); }}
                  className="px-6 py-4 border border-white/10 hover:border-red-500/30 bg-white/0 hover:bg-red-500/5 text-white/40 hover:text-red-400/90 transition-all duration-500 text-[10px] tracking-[0.3em] uppercase"
                >
                  Clear
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleFileChange} />
            </div>
          </div>

          {/* VIEW: PLAYLISTS */}
          <div
            className={`absolute inset-0 flex flex-col p-10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${view === 'playlists' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-[40px] pointer-events-none'}`}
          >
            {/* Header */}
            <div className="flex justify-between items-end mb-12 pb-6 border-b border-white/5">
              <h2 className="text-2xl font-thin tracking-[0.3em] text-white/90">
                PLAYLISTS
              </h2>
              <button
                onClick={onClose}
                className="text-white/30 hover:text-white/80 transition-colors duration-300 text-[10px] tracking-[0.2em] uppercase"
              >
                Close
              </button>
            </div>

            {/* Playlist List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {playlists.map(playlist => (
                <div
                  key={playlist}
                  onClick={() => {
                    onSwitchPlaylist(playlist);
                    setView('tracks');
                  }}
                  className={`group flex items-center justify-between py-5 px-6 cursor-pointer transition-all duration-500 rounded-sm border border-transparent hover:border-white/5 hover:bg-white/5 ${viewedPlaylist === playlist ? 'bg-white/5 border-white/5' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-1 h-1 rounded-full transition-all duration-500 ${viewedPlaylist === playlist ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/10 group-hover:bg-white/40'}`} />
                    <span className={`text-sm tracking-[0.2em] font-light transition-colors duration-300 ${viewedPlaylist === playlist ? 'text-white/90' : 'text-white/40 group-hover:text-white/80'}`}>
                      {playlist}
                    </span>
                  </div>

                  {playlist !== 'Default' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeletePlaylist(playlist); }}
                      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all duration-300 p-2"
                      title="Delete Playlist"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Create New Playlist */}
            <div className="pt-8 mt-6 border-t border-white/5">
              {!isCreating ? (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full py-4 border border-white/10 hover:border-white/30 bg-white/0 hover:bg-white/5 text-white/40 hover:text-white/90 transition-all duration-500 text-[10px] tracking-[0.3em] uppercase"
                >
                  + Create New Playlist
                </button>
              ) : (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <input
                    autoFocus
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitCreatePlaylist();
                      if (e.key === 'Escape') setIsCreating(false);
                    }}
                    onBlur={() => !newPlaylistName && setIsCreating(false)}
                    placeholder="PLAYLIST NAME..."
                    className="w-full bg-transparent border-b border-white/20 text-white text-sm py-2 focus:outline-none focus:border-white/60 placeholder-white/20 tracking-widest font-light text-center"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsCreating(false)}
                      className="flex-1 py-3 border border-white/5 hover:border-white/20 text-white/30 hover:text-white/60 text-[10px] tracking-[0.2em] uppercase transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitCreatePlaylist}
                      className="flex-1 py-3 border border-white/10 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] tracking-[0.2em] uppercase transition-all"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Playlist;
