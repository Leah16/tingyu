import { contextBridge, ipcRenderer } from 'electron'

console.log('Preload script is running!');

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
    on(...args: Parameters<typeof ipcRenderer.on>) {
        const [channel, listener] = args
        return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
        const [channel, ...omit] = args
        return ipcRenderer.off(channel, ...omit)
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args
        return ipcRenderer.send(channel, ...omit)
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args
        return ipcRenderer.invoke(channel, ...omit)
    },

    musicLib: {
        getLibrary: () => ipcRenderer.invoke('get-library'),
        saveTrack: (track: any) => ipcRenderer.invoke('save-track', track),
        deleteTrack: (id: string) => ipcRenderer.invoke('delete-track', id),
        updateLibrary: (tracks: any[]) => ipcRenderer.invoke('update-library', tracks),
        selectMusicFiles: () => ipcRenderer.invoke('select-music-files'),
        getFileSize: (path: string) => ipcRenderer.invoke('get-file-size', path)
    },

    windowControls: {
        minimize: () => ipcRenderer.send('window-minimize'),
        maximize: () => ipcRenderer.send('window-maximize'),
        close: () => ipcRenderer.send('window-close')
    },

    // You can expose other APTs you need here.
    // ...
})

console.log('Preload script completed. window.ipcRenderer should now be available.');
