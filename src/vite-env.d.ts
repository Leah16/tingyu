export { };

declare global {
    interface Window {
        ipcRenderer: {
            musicLib: {
                getLibrary: () => Promise<any[]>;
                saveTrack: (track: { id: string; name: string; path: string; bpm: number }) => Promise<any>;
                deleteTrack: (id: string) => Promise<void>;
                selectMusicFiles: () => Promise<string[]>;
            };
            on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
            off: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
            send: (channel: string, ...args: any[]) => void;
            invoke: (channel: string, ...args: any[]) => Promise<any>;
        };
    }
}
