
export interface RainDrop {
  x: number;
  y: number;
  z: number; // Depth for parallax
  length: number;
  opacity: number;
  speed: number;
  active: boolean; // Whether the drop is currently falling
}

export interface AudioAnalysis {
  intensity: number; // 0 to 1, overall volume
  bass: number; // 0 to 1, low frequency energy
  mid: number; // 0 to 1
  treble: number; // 0 to 1
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  PLAYING = 'PLAYING',
}

export interface Track {
  id: string;
  file?: File; // Optional, used during initial upload
  path?: string; // Path to the file in the library (for Electron)
  fileName?: string; // Filename in the music directory
  url?: string; // URL to play (blob: or media://)
  name: string;
  bpm: number;
  artist?: string;
  addedAt?: number;
  // Metadata
  format?: string;
  bitrate?: number;
  sampleRate?: number;
  size?: number; // bytes
}

declare global {
  interface Window {
    ipcRenderer: {
      musicLib: {
        getLibrary: () => Promise<any[]>;
        saveTrack: (track: any) => Promise<any>;
        deleteTrack: (id: string) => Promise<void>;
        updateLibrary: (tracks: any[]) => Promise<boolean>;
        selectMusicFiles: () => Promise<string[]>;
        getFileSize: (path: string) => Promise<number>;
      };
      windowControls: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
      };
      on: (channel: string, func: (...args: any[]) => void) => void;
      off: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
}
