import React from 'react';

interface TitleBarProps {
    onSettingsClick?: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ onSettingsClick }) => {
    const handleMinimize = () => {
        if (window.ipcRenderer) {
            window.ipcRenderer.windowControls.minimize();
        }
    };

    const handleMaximize = () => {
        if (window.ipcRenderer) {
            window.ipcRenderer.windowControls.maximize();
        }
    };

    const handleClose = () => {
        if (window.ipcRenderer) {
            window.ipcRenderer.windowControls.close();
        }
    };

    return (
        <div
            className="fixed top-0 left-0 w-full h-12 z-50 flex items-center justify-between px-6 select-none transition-opacity duration-300 hover:opacity-100 opacity-0"
            style={{
                WebkitAppRegion: 'drag',
                // Completely transparent to let rain show through, but interactive area exists
            } as React.CSSProperties}
        >
            <div className="flex space-x-4" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                {/* Close Button - Minimal Cross */}
                <button
                    onClick={handleClose}
                    className="group relative w-4 h-4 flex items-center justify-center focus:outline-none"
                    title="Close"
                >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-full transition-all duration-300 scale-150" />
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                        <path d="M1 1L7 7M7 1L1 7" stroke="white" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                </button>

                {/* Minimize Button - Minimal Line */}
                <button
                    onClick={handleMinimize}
                    className="group relative w-4 h-4 flex items-center justify-center focus:outline-none"
                    title="Minimize"
                >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-full transition-all duration-300 scale-150" />
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                        <path d="M1 4H7" stroke="white" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                </button>

                {/* Maximize Button - Minimal Square/Plus */}
                <button
                    onClick={handleMaximize}
                    className="group relative w-4 h-4 flex items-center justify-center focus:outline-none"
                    title="Maximize"
                >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-full transition-all duration-300 scale-150" />
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                        <rect x="1.5" y="1.5" width="5" height="5" stroke="white" strokeWidth="1" />
                    </svg>
                </button>
            </div>

            {/* Settings Button on the right */}
            {onSettingsClick && (
                <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <button
                        onClick={onSettingsClick}
                        className="group relative w-4 h-4 flex items-center justify-center focus:outline-none"
                        title="Settings"
                    >
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-full transition-all duration-300 scale-150" />
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default TitleBar;
