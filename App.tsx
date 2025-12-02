
import React, { useState, useRef, useEffect } from 'react';
import Intro from './components/Intro';
import RainCanvas from './components/RainCanvas';
import PlayerControls from './components/PlayerControls';
import Playlist from './components/Playlist';
import TitleBar from './components/TitleBar';
import { AppState, AudioAnalysis, Track } from './types';
import { detectBPM } from './utils/bpm';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [analysis, setAnalysis] = useState<AudioAnalysis>({ intensity: 0, bass: 0, mid: 0, treble: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  // UI Visibility
  const [controlsVisible, setControlsVisible] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const requestAnimFrameRef = useRef<number>();

  // Ref to access latest playlist state in callbacks
  const playlistRef = useRef(playlist);
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);

  // Initialize App with first file
  const handleFileSelect = async (selectedFile: File | string) => {
    const tempId = Math.random().toString(36).substr(2, 9);

    let filePath: string;
    let fileName: string;

    if (typeof selectedFile === 'string') {
      // It's a file path from Electron dialog
      filePath = selectedFile;
      fileName = filePath.split('/').pop() || 'unknown';
    } else {
      // It's a File object from HTML input (browser fallback)
      // @ts-ignore
      filePath = selectedFile.path || '';
      fileName = selectedFile.name;
    }

    // Detect BPM
    let bpm = 0;
    if (window.ipcRenderer && typeof selectedFile === 'string') {
      // For Electron with file path, we'll detect BPM after saving
      // Actually, we need to read the file. Let's use fs in main process
      // For now, skip BPM detection and do it during playback
    } else if (typeof selectedFile !== 'string') {
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
        bpm = await detectBPM(audioBuffer);
        tempCtx.close();
      } catch (e) { console.error("BPM detection failed", e); }
    }

    // Save to library if in Electron
    let newTrack: Track;
    if (window.ipcRenderer && filePath) {
      console.log('Saving track to library:', fileName, filePath);
      const savedTrack = await window.ipcRenderer.musicLib.saveTrack({
        id: tempId,
        name: fileName.replace(/\.[^/.]+$/, ""),
        path: filePath,
        bpm: bpm
      });
      console.log('Track saved:', savedTrack);

      newTrack = {
        ...savedTrack,
        url: `media://${savedTrack.fileName}`
      };
    } else {
      // Fallback for browser
      newTrack = {
        id: tempId,
        file: selectedFile as File,
        name: fileName.replace(/\.[^/.]+$/, ""),
        bpm: bpm,
        url: URL.createObjectURL(selectedFile as File)
      };
    }

    setPlaylist(prev => [...prev, newTrack]);
    // If this is the first track, start playing
    if (playlist.length === 0) {
      setCurrentTrackIndex(0);
      setAppState(AppState.PROCESSING);
    }
  };

  // Load library on mount
  useEffect(() => {
    const loadLibrary = async () => {
      console.log('Checking for Electron environment:', !!window.ipcRenderer);
      if (window.ipcRenderer) {
        try {
          const library = await window.ipcRenderer.musicLib.getLibrary();
          console.log('Loaded library:', library);
          if (library.length > 0) {
            const tracks: Track[] = library.map((t: any) => ({
              id: t.id,
              name: t.name,
              bpm: t.bpm,
              artist: t.artist,
              addedAt: t.addedAt,
              fileName: t.fileName,
              url: `media://${t.fileName}`
            }));
            console.log('Converted tracks:', tracks);
            setPlaylist(tracks);
            setCurrentTrackIndex(0);
            // Trigger processing to setup audio engine and show controls
            setAppState(AppState.PROCESSING);
          }
        } catch (e) {
          console.error('Failed to load library:', e);
        }
      } else {
        console.warn('Not running in Electron - library persistence disabled');
      }
    };
    loadLibrary();
  }, []);

  const handleReupload = () => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      setIsPlaying(false);
    }
    setPlaylist([]);
    setCurrentTrackIndex(-1);
    setAppState(AppState.IDLE);
    setAnalysis({ intensity: 0, bass: 0, mid: 0, treble: 0 });
    setIsPlaylistOpen(false);

    if (window.ipcRenderer) {
      window.ipcRenderer.musicLib.updateLibrary([]);
    }
  };

  const handleUserInteraction = () => {
    setControlsVisible(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (!audioElRef.current) return;
    if (isPlaying) {
      audioElRef.current.pause();
    } else {
      audioElRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // --- Playlist Logic ---

  const handleAddFiles = async (files: FileList | string[]) => {
    const newTracks: Track[] = [];

    const fileArray = Array.isArray(files) ? files : Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const f = fileArray[i];
      const tempId = Math.random().toString(36).substr(2, 9);

      let filePath: string;
      let fileName: string;
      let bpm = 0;

      let format = 'UNKNOWN';
      let size = 0;
      let sampleRate = 0;
      let bitrate = 0;

      if (typeof f === 'string') {
        // It's a file path from Electron dialog
        filePath = f;
        fileName = filePath.split('/').pop() || 'unknown';
        format = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
        // Size/Bitrate/SampleRate will be fetched during playback for Electron files
      } else {
        // It's a File object from HTML input
        // @ts-ignore
        filePath = f.path || '';
        fileName = f.name;
        format = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
        size = f.size;

        // Detect BPM and Metadata for File objects
        try {
          const arrayBuffer = await f.arrayBuffer();
          const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
          bpm = await detectBPM(audioBuffer);

          sampleRate = audioBuffer.sampleRate;
          if (audioBuffer.duration > 0) {
            bitrate = Math.round((size * 8) / audioBuffer.duration / 1000);
          }

          tempCtx.close();
        } catch (e) { console.error("BPM/Metadata detection failed", e); }
      }

      if (window.ipcRenderer && filePath) {
        const savedTrack = await window.ipcRenderer.musicLib.saveTrack({
          id: tempId,
          name: fileName.replace(/\.[^/.]+$/, ""),
          path: filePath,
          bpm: bpm,
          format,
          size,
          sampleRate,
          bitrate
        });
        newTracks.push({
          ...savedTrack,
          url: `media://${savedTrack.fileName}`,
          format,
          size,
          sampleRate,
          bitrate
        });
      } else if (typeof f !== 'string') {
        newTracks.push({
          id: tempId,
          file: f,
          name: fileName.replace(/\.[^/.]+$/, ""),
          bpm: bpm,
          url: URL.createObjectURL(f),
          format,
          size,
          sampleRate,
          bitrate
        });
      }
    }
    setPlaylist(prev => [...prev, ...newTracks]);
  };

  const handleRemoveTrack = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index === currentTrackIndex) {
      // If removing current track
      if (playlist.length === 1) {
        handleReupload();
        return;
      } else {
        // If it's the last one, go back; otherwise stay at same index (which becomes next song)
        if (index === playlist.length - 1) {
          setCurrentTrackIndex(index - 1);
        } else {
          // We need to force a re-load if the index doesn't change but the song does.
          // Setting processing state will trigger the effect.
          setAppState(AppState.PROCESSING);
        }
      }
    } else if (index < currentTrackIndex) {
      // Shift index if we removed a track before current
      setCurrentTrackIndex(prev => prev - 1);
    }

    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylist(newPlaylist);

    if (window.ipcRenderer) {
      window.ipcRenderer.musicLib.updateLibrary(newPlaylist);
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < playlist.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
      setAppState(AppState.PROCESSING);
    }
  };

  const handlePrev = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
      setAppState(AppState.PROCESSING);
    }
  };

  const handleSelectTrack = (index: number) => {
    if (index !== currentTrackIndex) {
      setCurrentTrackIndex(index);
      setAppState(AppState.PROCESSING);
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= playlist.length) return;

    const newPlaylist = [...playlist];
    const [movedTrack] = newPlaylist.splice(fromIndex, 1);
    newPlaylist.splice(toIndex, 0, movedTrack);

    setPlaylist(newPlaylist);

    // Update currentTrackIndex if necessary
    if (currentTrackIndex === fromIndex) {
      setCurrentTrackIndex(toIndex);
    } else if (currentTrackIndex === toIndex) {
      setCurrentTrackIndex(fromIndex); // This logic might be slightly off if moving across, but for adjacent moves it's fine.
      // Actually, let's just find the track ID
      const currentId = playlist[currentTrackIndex].id;
      const newIndex = newPlaylist.findIndex(t => t.id === currentId);
      setCurrentTrackIndex(newIndex);
    } else {
      // If we moved something else, we need to adjust index if it affected our position
      const currentId = playlist[currentTrackIndex].id;
      const newIndex = newPlaylist.findIndex(t => t.id === currentId);
      setCurrentTrackIndex(newIndex);
    }

    // Persist to Electron
    if (window.ipcRenderer) {
      await window.ipcRenderer.musicLib.updateLibrary(newPlaylist);
    }
  };

  // --- Audio Engine ---

  useEffect(() => {
    // Watch for track changes trigger
    if (appState === AppState.PROCESSING && currentTrackIndex !== -1 && playlist[currentTrackIndex]) {
      const track = playlist[currentTrackIndex];

      const playSequence = async () => {
        // 1. Detect BPM and Metadata if needed
        let bpmToUse = track.bpm;
        let sizeToUse = track.size || 0;
        let formatToUse = track.format || 'UNKNOWN';
        let bitrateToUse = track.bitrate || 0;
        let sampleRateToUse = track.sampleRate || 0;
        let needsUpdate = false;

        // Fetch size if missing (Electron)
        if (window.ipcRenderer && (track.path || track.fileName) && (!sizeToUse || sizeToUse === 0)) {
          try {
            const pathOrName = track.path || track.fileName || '';
            sizeToUse = await window.ipcRenderer.musicLib.getFileSize(pathOrName);
            console.log('Fetched file size:', sizeToUse, 'for', pathOrName);
            needsUpdate = true;
          } catch (e) { console.error("Failed to get file size", e); }
        }

        // Infer format if missing
        if (formatToUse === 'UNKNOWN' && (track.path || track.name)) {
          const name = track.path || track.name;
          formatToUse = name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
          needsUpdate = true;
        }

        if (bpmToUse === 0 && track.file) {
          try {
            const arrayBuffer = await track.file.arrayBuffer();
            const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
            bpmToUse = await detectBPM(audioBuffer);

            // Also get metadata if we decoded
            sampleRateToUse = audioBuffer.sampleRate;
            console.log('Decoded sample rate:', sampleRateToUse);

            if (audioBuffer.duration > 0 && sizeToUse > 0) {
              bitrateToUse = Math.round((sizeToUse * 8) / audioBuffer.duration / 1000);
            } else if (audioBuffer.duration > 0 && track.file.size > 0) {
              sizeToUse = track.file.size;
              bitrateToUse = Math.round((sizeToUse * 8) / audioBuffer.duration / 1000);
            }
            console.log('Calculated bitrate (from buffer):', bitrateToUse);

            tempCtx.close();
            needsUpdate = true;
          } catch (e) { console.error("BPM detection failed", e); }
        }

        // 2. Setup Audio
        if (audioElRef.current) {
          audioElRef.current.pause();
          if (sourceRef.current) sourceRef.current.disconnect();
        }

        const audioEl = new Audio();

        // Wait for metadata to calc bitrate if we have size but no duration yet
        audioEl.addEventListener('loadedmetadata', () => {
          console.log('Audio loadedmetadata. Duration:', audioEl.duration, 'Size:', sizeToUse);

          // If we haven't calculated bitrate yet, try now
          if (sizeToUse > 0 && (!bitrateToUse || bitrateToUse === 0) && audioEl.duration > 0) {
            bitrateToUse = Math.round((sizeToUse * 8) / audioEl.duration / 1000);
            console.log('Calculated bitrate (from audioEl):', bitrateToUse);

            // We also need sample rate. Audio element doesn't give it directly without Web Audio API context.
            // But we connect it to context later.
          }

          // Update playlist state with all gathered info
          setPlaylist(prev => {
            const copy = [...prev];
            if (copy[currentTrackIndex]) {
              // Only update if something changed
              const current = copy[currentTrackIndex];
              if (current.bitrate !== bitrateToUse || current.sampleRate !== sampleRateToUse || current.size !== sizeToUse) {
                console.log('Updating track metadata in state:', { bitrate: bitrateToUse, sampleRate: sampleRateToUse, size: sizeToUse });
                copy[currentTrackIndex] = {
                  ...copy[currentTrackIndex],
                  bpm: bpmToUse,
                  size: sizeToUse,
                  format: formatToUse,
                  bitrate: bitrateToUse,
                  sampleRate: sampleRateToUse
                };
              }
            }
            return copy;
          });
        });

        if (track.url) {
          console.log('Loading audio from URL:', track.url);
          audioEl.src = track.url;
        } else if (track.file) {
          const blobUrl = URL.createObjectURL(track.file);
          console.log('Loading audio from blob:', blobUrl);
          audioEl.src = blobUrl;
        }
        audioElRef.current = audioEl;

        // 3. Auto Advance
        audioEl.addEventListener('ended', () => {
          setCurrentTrackIndex(prevIndex => {
            if (prevIndex < playlistRef.current.length - 1) {
              setAppState(AppState.PROCESSING);
              return prevIndex + 1;
            }
            setIsPlaying(false);
            return prevIndex;
          });
        });

        // 4. Connect Web Audio API
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        let ctx = audioContextRef.current;
        if (!ctx) {
          ctx = new AudioContextClass();
          audioContextRef.current = ctx;
        }

        // Capture sample rate if we don't have it
        if ((!sampleRateToUse || sampleRateToUse === 0) && ctx.sampleRate) {
          sampleRateToUse = ctx.sampleRate;
          console.log('Captured sample rate from context:', sampleRateToUse);

          // Trigger a state update if we found new info
          setPlaylist(prev => {
            const copy = [...prev];
            if (copy[currentTrackIndex]) {
              const current = copy[currentTrackIndex];
              if (current.sampleRate !== sampleRateToUse) {
                copy[currentTrackIndex] = {
                  ...copy[currentTrackIndex],
                  sampleRate: sampleRateToUse
                };
              }
            }
            return copy;
          });
        }

        if (!analyserRef.current) {
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.connect(ctx.destination);
          analyserRef.current = analyser;
        }

        const source = ctx.createMediaElementSource(audioEl);
        source.connect(analyserRef.current!);
        sourceRef.current = source;

        try {
          await audioEl.play();
          setIsPlaying(true);
          setAppState(AppState.PLAYING);

          // Update Media Session Metadata
          if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: track.name || "Unknown Track",
              artist: track.artist || "TingYu",
              // artwork: [] // Add artwork if available later
            });

            navigator.mediaSession.setActionHandler('play', () => {
              audioEl.play();
              setIsPlaying(true);
            });
            navigator.mediaSession.setActionHandler('pause', () => {
              audioEl.pause();
              setIsPlaying(false);
            });
            navigator.mediaSession.setActionHandler('previoustrack', () => {
              if (currentTrackIndex > 0) {
                setCurrentTrackIndex(prev => prev - 1);
                setAppState(AppState.PROCESSING);
              }
            });
            navigator.mediaSession.setActionHandler('nexttrack', () => {
              if (currentTrackIndex < playlistRef.current.length - 1) {
                setCurrentTrackIndex(prev => prev + 1);
                setAppState(AppState.PROCESSING);
              }
            });
          }

        } catch (e) { console.error("Play failed", e); }
      };

      playSequence();
    }
  }, [appState, currentTrackIndex]); // Only re-run when these specifically change

  // Analysis Loop
  useEffect(() => {
    if (appState !== AppState.PLAYING) return;

    const updateAnalysis = () => {
      if (analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        const third = Math.floor(bufferLength / 3);
        let totalSum = 0, bassSum = 0, midSum = 0, trebleSum = 0;

        for (let i = 0; i < bufferLength; i++) {
          totalSum += dataArray[i];
          if (i < third) bassSum += dataArray[i];
          else if (i < third * 2) midSum += dataArray[i];
          else trebleSum += dataArray[i];
        }

        setAnalysis({
          intensity: (totalSum / bufferLength) / 255,
          bass: (bassSum / third) / 255,
          mid: (midSum / third) / 255,
          treble: (trebleSum / (bufferLength - third * 2)) / 255
        });
      }
      requestAnimFrameRef.current = requestAnimationFrame(updateAnalysis);
    };
    updateAnalysis();

    return () => {
      if (requestAnimFrameRef.current) cancelAnimationFrame(requestAnimFrameRef.current);
    };
  }, [appState]);

  const currentTrack = playlist[currentTrackIndex];

  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden select-none"
      onClick={handleUserInteraction}
    >
      {/* Custom Title Bar */}
      {window.ipcRenderer && <TitleBar />}

      <RainCanvas
        analysis={analysis}
        bpm={currentTrack?.bpm || 0}
      />

      {/* Intro Layer - Show if playlist is empty */}
      <div className={`relative z-20 w-full h-full transition-opacity duration-1000 ${appState === AppState.IDLE && playlist.length === 0 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {(appState === AppState.IDLE && playlist.length === 0) && (
          <Intro
            onFileSelect={handleFileSelect}
            isLoading={appState === AppState.PROCESSING}
          />
        )}
      </div>

      {/* Main Player Interface */}
      {appState === AppState.PLAYING && (
        <>
          <PlayerControls
            onReupload={handleReupload}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            fileName={currentTrack?.name || "Unknown Track"}
            bpm={currentTrack?.bpm || 0}
            format={currentTrack?.format}
            bitrate={currentTrack?.bitrate}
            sampleRate={currentTrack?.sampleRate}
            onNext={handleNext}
            onPrev={handlePrev}
            hasPrev={currentTrackIndex > 0}
            hasNext={currentTrackIndex < playlist.length - 1}
            onTogglePlaylist={() => setIsPlaylistOpen(true)}
            visible={controlsVisible}
          />

          <Playlist
            tracks={playlist}
            currentIndex={currentTrackIndex}
            isOpen={isPlaylistOpen}
            onClose={() => setIsPlaylistOpen(false)}
            onSelect={handleSelectTrack}
            onAdd={handleAddFiles}
            onRemove={handleRemoveTrack}
            onReorder={handleReorder}
            onClear={handleReupload}
          />

          {/* Invisible overlay for cursor hiding logic if needed, or just interactions */}
          <div className="absolute inset-0 z-10" onClick={() => setIsPlaylistOpen(false)} style={{ pointerEvents: isPlaylistOpen ? 'auto' : 'none' }} />
        </>
      )}

    </div>
  );
};

export default App;
