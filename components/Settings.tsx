import React, { useState, useEffect } from 'react';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
    const [musicPath, setMusicPath] = useState<string>('');
    const [isMigrating, setIsMigrating] = useState(false);
    const [status, setStatus] = useState<string>('');

    useEffect(() => {
        if (isOpen && window.ipcRenderer) {
            window.ipcRenderer.musicLib.getMusicPath().then(setMusicPath);
        }
    }, [isOpen]);

    const handleChangeLocation = async () => {
        if (!window.ipcRenderer) return;

        try {
            const newPath = await window.ipcRenderer.musicLib.selectMusicPath();
            if (newPath && newPath !== musicPath) {
                if (confirm(`Move music library to "${newPath}"?\nThis will move all files and delete them from the current location.`)) {
                    setIsMigrating(true);
                    setStatus('Moving files... This may take a while.');

                    const success = await window.ipcRenderer.musicLib.updateMusicPath(newPath);

                    setIsMigrating(false);
                    if (success) {
                        setMusicPath(newPath);
                        setStatus('Library moved successfully!');
                        setTimeout(() => setStatus(''), 3000);
                    } else {
                        setStatus('Failed to move library. Check console for details.');
                    }
                }
            }
        } catch (e) {
            console.error(e);
            setIsMigrating(false);
            setStatus('An error occurred.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity duration-500">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-10 rounded-3xl w-[550px] shadow-2xl relative overflow-hidden group">
                {/* Subtle gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors duration-300"
                    disabled={isMigrating}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="relative z-10">
                    <h2 className="text-3xl font-light text-white mb-2 tracking-wide">Library</h2>
                    <p className="text-white/40 text-sm font-light mb-10">Manage your music storage location.</p>

                    <div className="space-y-8">
                        <div>
                            <label className="block text-white/60 text-xs uppercase tracking-widest mb-3 font-medium">Current Location</label>
                            <div className="group/path relative bg-black/40 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors duration-300">
                                <div className="flex items-center space-x-3 text-white/80 font-mono text-xs break-all leading-relaxed">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 flex-shrink-0">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    <span>{musicPath || 'Loading...'}</span>
                                </div>
                            </div>
                        </div>

                        {status && (
                            <div className={`p-4 rounded-xl text-sm font-light tracking-wide flex items-center space-x-3 ${status.includes('Failed') ? 'bg-red-500/10 text-red-200 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20'}`}>
                                {status.includes('Moving') && (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                )}
                                <span>{status}</span>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleChangeLocation}
                                disabled={isMigrating}
                                className={`
                                    relative px-8 py-3 rounded-full bg-white text-black font-medium text-sm tracking-wide
                                    hover:bg-zinc-200 transition-all duration-300 transform hover:scale-105 active:scale-95
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                                    shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]
                                `}
                            >
                                {isMigrating ? 'Migrating...' : 'Change Location'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
