import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  Film, Music, Image as ImageIcon, FileText, Trash2, 
  Play, Info, HardDrive, Search, ShieldCheck, ArrowUpCircle 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [diskFreeSpace, setDiskFreeSpace] = useState('Loading...');

  // Fetch live disk space from Rust backend on load
  useEffect(() => {
    async function fetchDiskSpace() {
      try {
        const disks = await invoke('get_disk_space');
        if (disks && disks.length > 0) {
          // Calculate free space in GB from the first available drive
          const freeBytes = disks[0][2];
          const freeGB = (freeBytes / (1024 * 1024 * 1024)).toFixed(1);
          setDiskFreeSpace(`${freeGB} GB Free`);
        }
      } catch (err) {
        console.error("Failed to load disk space from backend:", err);
        setDiskFreeSpace('142 GB Free'); // Fallback mock value
      }
    }
    fetchDiskSpace();
  }, []);

  const mockMedia = [
    { id: 1, title: 'Inception', type: 'video', category: 'Movies', poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop', desc: 'A thief who steals corporate secrets through dream-sharing technology.' },
    { id: 2, title: 'Cyberpunk Beats', type: 'audio', category: 'Music', poster: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop', desc: 'Synthwave track - 320kbps MP3' },
    { id: 3, title: 'Sunset Wallpapers', type: 'image', category: 'Photos', poster: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&auto=format&fit=crop', desc: '4K Ultra HD Nature Photography' },
    { id: 4, title: 'Project Proposal.pdf', type: 'document', category: 'Documents', poster: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=500&auto=format&fit=crop', desc: 'Technical Architecture & Specifications' },
  ];

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

        <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" /> Data Protected
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
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <header className="sticky top-0 z-10 bg-[#141414]/90 backdrop-blur-md border-b border-neutral-800/50 px-8 py-4 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search local movies, tracks, documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-700/60 rounded-full text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 transition"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-xs bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/50 px-3 py-1.5 rounded-full transition">
              <ArrowUpCircle className="w-4 h-4" /> Check Updates
            </button>
            <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-red-500">
              J
            </div>
          </div>
        </header>

        <div className="relative h-[380px] w-full bg-neutral-900 overflow-hidden flex items-end p-8">
          <img 
            src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop" 
            alt="Hero background" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
          
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-red-500 bg-red-950/80 px-2.5 py-1 rounded-md border border-red-800/60">
              Featured Local Media
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight">Inception (2010)</h1>
            <p className="text-sm text-neutral-300 line-clamp-2">
              A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-6 py-2.5 rounded-lg font-bold text-sm transition">
                <Play className="w-4 h-4 fill-current" /> Play File
              </button>
              <button className="flex items-center gap-2 bg-neutral-800/80 hover:bg-neutral-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm border border-neutral-700 transition backdrop-blur">
                <Info className="w-4 h-4" /> Details
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-4 tracking-wide">Recently Added</h2>
            <div className="grid grid-cols-4 gap-6">
              {mockMedia.map((item) => (
                <div 
                  key={item.id}
                  className="group relative bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 hover:border-red-600 transition duration-300 cursor-pointer shadow-lg hover:scale-[1.02]"
                >
                  <div className="h-44 w-full overflow-hidden">
                    <img 
                      src={item.poster} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500 opacity-90 group-hover:opacity-100"
                    />
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-bold text-red-500 uppercase">{item.category}</span>
                    <h3 className="font-bold text-base text-white truncate">{item.title}</h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
