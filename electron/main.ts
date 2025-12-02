import { app, BrowserWindow, protocol, ipcMain, net, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    console.log('Creating Electron window...');
    console.log('Preload path:', path.join(__dirname, 'preload.js'));
    console.log('VITE_DEV_SERVER_URL:', VITE_DEV_SERVER_URL);
    console.log('userData path:', app.getPath('userData'));

    win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false, // Frameless window
        titleBarStyle: 'hidden', // Hide default title bar
        trafficLightPosition: { x: 20, y: 20 }, // Adjust traffic lights
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false // Allow loading local files
        },
        icon: path.join(__dirname, '../Icon-iOS-Default-1024x1024@1x.png') // Set app icon
    })

    // Open DevTools automatically in development
    if (VITE_DEV_SERVER_URL) {
        win.webContents.openDevTools();
    }

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    }
    else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(process.env.DIST || '', 'index.html'));
    }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// Register privileged schemes before app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'media', privileges: { standard: true, secure: true, supportFetchAPI: true } }
])

app.whenReady().then(() => {
    // Register 'media' protocol to serve files from userData/music
    protocol.handle('media', async (request) => {
        console.log('Raw request URL:', request.url);

        try {
            // Extract just the filename part from media://filename
            const mediaUrl = new URL(request.url);
            // Combine hostname and pathname, then decode
            let filename = (mediaUrl.host + mediaUrl.pathname).replace(/\/$/, '');

            // URL decode
            filename = decodeURIComponent(filename);

            console.log('Extracted filename:', filename);

            const musicPath = path.join(app.getPath('userData'), 'music', filename);
            console.log('Resolved file path:', musicPath);
            console.log('File exists:', fs.existsSync(musicPath));

            if (!fs.existsSync(musicPath)) {
                console.error('File not found!');
                return new Response('File not found', { status: 404 });
            }

            // Read file and determine MIME type
            const data = fs.readFileSync(musicPath);
            const ext = path.extname(filename).toLowerCase();
            const mimeTypes: { [key: string]: string } = {
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.flac': 'audio/flac',
                '.m4a': 'audio/mp4',
                '.aac': 'audio/aac'
            };
            const mimeType = mimeTypes[ext] || 'audio/mpeg';

            console.log('Returning file with MIME type:', mimeType);

            return new Response(data, {
                headers: {
                    'Content-Type': mimeType,
                    'Content-Length': data.length.toString()
                }
            });
        } catch (e) {
            console.error('Protocol handler error:', e);
            return new Response('Error loading file', { status: 500 });
        }
    });

    createWindow()
    setupLibraryHandlers()
})

function setupLibraryHandlers() {
    const musicDir = path.join(app.getPath('userData'), 'music');
    const libraryPath = path.join(app.getPath('userData'), 'library.json');

    console.log('Setting up library handlers...');
    console.log('Music directory:', musicDir);
    console.log('Library path:', libraryPath);

    if (!fs.existsSync(musicDir)) {
        fs.mkdirSync(musicDir, { recursive: true });
        console.log('Created music directory');
    }

    ipcMain.handle('get-library', async () => {
        console.log('IPC: get-library called');
        if (fs.existsSync(libraryPath)) {
            try {
                const data = fs.readFileSync(libraryPath, 'utf-8');
                const library = JSON.parse(data);
                console.log('Library loaded:', library.length, 'tracks');
                return library;
            } catch (e) {
                console.error('Failed to read library', e);
                return [];
            }
        }
        console.log('No library file found');
        return [];
    });

    ipcMain.handle('save-track', async (_, trackData: { id: string, name: string, path: string, bpm: number }) => {
        console.log('IPC: save-track called', trackData);

        // Extract file extension
        const ext = path.extname(trackData.path);
        // Use ID as filename to avoid Unicode/special character issues
        const safeFileName = `${trackData.id}${ext}`;
        const destPath = path.join(musicDir, safeFileName);

        // Copy file
        try {
            fs.copyFileSync(trackData.path, destPath);
            console.log('File copied to:', destPath);
        } catch (e) {
            console.error('Failed to copy file:', e);
            throw e;
        }

        // Update library
        let library: any[] = []
        if (fs.existsSync(libraryPath)) {
            try {
                library = JSON.parse(fs.readFileSync(libraryPath, 'utf-8'))
            } catch (e) { }
        }

        const newTrack = {
            id: trackData.id,
            name: trackData.name,
            fileName: safeFileName, // Store the safe filename
            bpm: trackData.bpm,
            addedAt: Date.now()
        }

        library.push(newTrack)
        fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2))

        return newTrack
    })

    ipcMain.handle('update-library', async (_, tracks: any[]) => {
        console.log('IPC: update-library called', tracks.length);
        if (fs.existsSync(libraryPath)) {
            try {
                // We only need to save the metadata, not the full track objects if they contain blobs (which they shouldn't in Electron)
                // But let's be safe and map to the stored format
                const libraryToSave = tracks.map(t => ({
                    id: t.id,
                    name: t.name,
                    fileName: t.fileName || path.basename(t.path), // Fallback if fileName missing
                    bpm: t.bpm,
                    artist: t.artist,
                    addedAt: t.addedAt || Date.now()
                }));
                fs.writeFileSync(libraryPath, JSON.stringify(libraryToSave, null, 2));
                return true;
            } catch (e) {
                console.error('Failed to update library:', e);
                return false;
            }
        }
        return false;
    })

    ipcMain.handle('select-music-files', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'] }
            ]
        })

        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths
        }
        return []
    })

    ipcMain.handle('delete-track', async (_, id: string) => {
        if (!fs.existsSync(libraryPath)) return

        let library = JSON.parse(fs.readFileSync(libraryPath, 'utf-8'))
        const track = library.find((t: any) => t.id === id)

        if (track) {
            const filePath = path.join(musicDir, track.fileName)
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
            }

            library = library.filter((t: any) => t.id !== id)
            fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2))
        }
    })

    ipcMain.handle('get-file-size', async (_, filePath: string) => {
        try {
            let targetPath = filePath;
            if (!fs.existsSync(targetPath)) {
                // Try resolving relative to musicDir
                targetPath = path.join(musicDir, filePath);
            }

            if (fs.existsSync(targetPath)) {
                const stats = fs.statSync(targetPath);
                return stats.size;
            }
            return 0;
        } catch (e) {
            console.error('Failed to get file size:', e);
            return 0;
        }
    })

    // Window Controls
    ipcMain.on('window-minimize', () => {
        win?.minimize();
    });

    ipcMain.on('window-maximize', () => {
        if (win?.isMaximized()) {
            win.unmaximize();
        } else {
            win?.maximize();
        }
    });

    ipcMain.on('window-close', () => {
        win?.close();
    });
}
