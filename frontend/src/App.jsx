import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { 
  Film, Music, Image as ImageIcon, FileText, Trash2, 
  Play, HardDrive, Search, ShieldCheck, FolderOpen, Loader2, Settings,
  RotateCcw, Trash
} from 'lucide-react';
import { 
  getStoredMedia, saveScannedMedia, getDB, 
  setMediaDeletedStatus, permanentlyDeleteMedia 
} from './services/db';
import VideoPlayer from './components/VideoPlayer';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [diskFreeSpace, setDiskFreeSpace] = useState('Loading...');
  const [mediaItems, setMediaItems] = useState([]);
  const [watchHistory, setWatchHistory] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanPath, setScanPath] = useState('');
  const [currentPlayingMedia, setCurrentPlayingMedia] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load cached media, watch history, and disk space on startup
  const loadAppData = async () => {
    try {
      const cached = await getStoredMedia();
      if (cached && cached.length > 0) {
        setMediaItems(cached);
      }

      // Fetch watch history map from SQLite
      const db = await getDB();
      const historyRows = await db.select('SELECT path, progress, duration FROM watch_history');
      const historyMap = {};
      historyRows.forEach(row => {
        historyMap[row.path] = row;
      });
      setWatchHistory(historyMap);

      // Fetch live disk space from Rust backend
      const disks = await invoke('get_disk_space');
      if (disks && disks.length > 0) {
        const freeBytes = disks[0][2];
        const freeGB = (freeBytes / (1024 * 1024 * 1024)).toFixed(1);
        setDiskFreeSpace(`${freeGB} GB Free`);
      }
    } catch (err) {
      console.error("Initialization error:", err);
      setDiskFreeSpace('142 GB Free');
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  // Open native dialog to pick a folder, scan via Rust, and save to SQLite
  async function handleSelectFolder() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Local Media Directory',
      });

      if (selected) {
        setIsScanning(true);
        setScanPath(selected);
        
        const results = await invoke('scan_directory', { dirPath: selected });
        await saveScannedMedia(results);
        
        await loadAppData();
        setIsScanning(false);
      }
    } catch (err) {
      console.error("Failed to scan directory:", err);
      setIsScanning(false);
    }
  }

  // Soft-delete item (move to trash tab)
  const handleSoftDelete = async (e, id) => {
    e.stopPropagation();
    await setMediaDeletedStatus(id, true);
    await loadAppData();
  };

  // Restore item back to main library
  const handleRestore = async (e, id) => {
    e.stopPropagation();
    await setMediaDeletedStatus(id, false);
    await loadAppData();
  };

  // Permanently delete item record
  const handlePermanentDelete = async (e, id) => {
    e.stopPropagation();
    await permanentlyDeleteMedia(id);
    await loadAppData();
  };

  // Filter media items based on active tab, trash status, and search query
  const filteredMedia = mediaItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const isTrash = item.is_deleted === 1;

    if (activeTab === 'trash') {
      return isTrash && matchesSearch;
    }

    // Hide deleted items from active library tabs
    if (isTrash) return false;

    if (activeTab === 'home') return matchesSearch;
    if (activeTab === 'movies') return matchesSearch && item.media_type === 'video';
    if (activeTab === 'music') return matchesSearch && item.media_type === 'audio';
    if (activeTab === 'photos') return matchesSearch && item.media_type === 'image';
    if (activeTab === 'docs') return matchesSearch && item.media_type === 'document';
    return matchesSearch;
  });

  return (
    <div className="flex h-screen bg-[#141414] text-white overflow-hidden select-none">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-neutral-800 flex flex-col justify-between p-4 z-20">
        <div>
          <div className="flex items-center gap-2 px-2 py-4">
            <span className="text-3xl font-extrabold tracking-widest text-[#E50914] drop-shadow-md">
              JOSHFLIX
            </span>
            <span className="text-[10px] bg-red-900/50 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-800">
              LOCAL
            </span>
          </div>

          <nav className="mt-6 space-y-1">
            {[
              { id: 'home', label: 'Home', icon: Film },
              { id: 'movies', label: 'Movies & Shows', icon: Film },
              { id: 'music', label: 'Music & Audio', icon: Music },
              { id: 'photos', label: 'Photos & Art', icon: ImageIcon },
              { id: 'docs', label: 'Documents', icon: FileText },
              { id: 'trash', label: 'Recycle Bin', icon: Trash2 },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-[#E50914] text-white font-semibold shadow-lg shadow-red-900/30' 
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleSelectFolder}
            disabled={isScanning}
            className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs py-2.5 px-3 rounded-xl border border-neutral-700 transition shadow"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <FolderOpen className="w-4 h-4 text-red-500" />}
            {isScanning ? 'Scanning Directory...' : 'Scan Local Folder'}
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-medium text-xs py-2.5 px-3 rounded-xl border border-neutral-800 transition shadow"
          >
            <Settings className="w-4 h-4 text-neutral-400" />
            Settings & Preferences
          </button>

          <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" /> SQLite Cached
              </span>
              <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300">Offline</span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5 text-neutral-400" /> Disk</span>
                <span className="font-mono">{diskFreeSpace}</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-red-500 h-full w-[55%]" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <header className="sticky top-0 z-10 bg-[#141414]/90 backdrop-blur-md border-b border-neutral-800/50 px-8 py-4 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search cached local library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-700/60 rounded-full text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 transition"
            />
          </div>

          <div className="flex items-center gap-4">
            {scanPath && (
              <span className="text-xs text-neutral-400 truncate max-w-xs">
                Folder: <span className="text-neutral-200 font-mono">{scanPath}</span>
              </span>
            )}
            <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-red-500">
              J
            </div>
          </div>
        </header>

        {/* MEDIA GRID DISPLAY */}
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-wide">
              {activeTab === 'home' && 'Cached Local Library'}
              {activeTab === 'movies' && 'Movies & Video Library'}
              {activeTab === 'music' && 'Music & Audio Tracks'}
              {activeTab === 'photos' && 'Photos & Artwork'}
              {activeTab === 'docs' && 'Local Documents'}
              {activeTab === 'trash' && 'Recycle Bin'}
            </h2>
            <span className="text-xs text-neutral-400">{filteredMedia.length} items loaded</span>
          </div>

          {filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 bg-neutral-900/40 border border-neutral-800 rounded-2xl text-center p-8 space-y-4">
              <FolderOpen className="w-12 h-12 text-neutral-600" />
              <div className="space-y-1">
                <p className="font-semibold text-neutral-300">
                  {activeTab === 'trash' ? 'Recycle bin is empty' : 'No media items in library'}
                </p>
                <p className="text-xs text-neutral-500 max-w-sm">
                  {activeTab === 'trash'
                    ? 'Soft-deleted media items will show up here until purged.'
                    : 'Click "Scan Local Folder" to index your media files.'}
                </p>
              </div>
              {activeTab !== 'trash' && (
                <button 
                  onClick={handleSelectFolder}
                  className="bg-[#E50914] hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition shadow-lg shadow-red-900/30"
                >
                  Choose Folder to Scan
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6">
              {filteredMedia.map((item) => {
                const history = watchHistory[item.path];
                const progressPct = history && history.duration > 0 
                  ? Math.min(100, Math.max(0, (history.progress / history.duration) * 100)) 
                  : 0;

                return (
                  <div 
                    key={item.id}
                    onClick={() => {
                      if (item.media_type === 'video' && item.is_deleted !== 1) {
                        setCurrentPlayingMedia(item);
                      }
                    }}
                    className="group relative bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 hover:border-red-600 transition duration-300 cursor-pointer shadow-lg hover:scale-[1.02]"
                  >
                    <div className="h-40 w-full bg-neutral-950 flex items-center justify-center border-b border-neutral-800 relative">
                      <Film className="w-10 h-10 text-neutral-700 group-hover:text-red-500 transition" />
                      
                      {item.media_type === 'video' && item.is_deleted !== 1 && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <div className="p-3 bg-[#E50914] rounded-full text-white shadow-lg">
                            <Play className="w-5 h-5 fill-white" />
                          </div>
                        </div>
                      )}

                      {/* Action buttons (Delete / Restore) */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition flex gap-1 z-10">
                        {activeTab === 'trash' ? (
                          <>
                            <button
                              onClick={(e) => handleRestore(e, item.id)}
                              className="p-1.5 bg-neutral-900/90 hover:bg-emerald-600 text-white rounded-lg transition border border-neutral-700"
                              title="Restore to Library"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handlePermanentDelete(e, item.id)}
                              className="p-1.5 bg-neutral-900/90 hover:bg-red-700 text-white rounded-lg transition border border-neutral-700"
                              title="Delete Permanently"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => handleSoftDelete(e, item.id)}
                            className="p-1.5 bg-neutral-900/90 hover:bg-red-600 text-white rounded-lg transition border border-neutral-700"
                            title="Move to Recycle Bin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <span className="absolute top-2 right-2 text-[10px] font-mono bg-black/70 px-2 py-0.5 rounded text-neutral-300">
                        {item.size ? (item.size / (1024 * 1024)).toFixed(1) + ' MB' : ''}
                      </span>

                      {/* Watch Progress Bar */}
                      {item.media_type === 'video' && progressPct > 0 && item.is_deleted !== 1 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                          <div 
                            className="h-full bg-[#E50914]" 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-1">
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{item.category}</span>
                      <h3 className="font-bold text-base text-white truncate" title={item.title}>{item.title}</h3>
                      <p className="text-[11px] text-neutral-500 truncate font-mono">{item.path}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* VIDEO PLAYER MODAL OVERLAY */}
      {currentPlayingMedia && (
        <VideoPlayer 
          media={currentPlayingMedia} 
          onClose={() => {
            setCurrentPlayingMedia(null);
            loadAppData();
          }} 
        />
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          onRefreshLibrary={handleSelectFolder} 
        />
      )}
    </div>
  );
}