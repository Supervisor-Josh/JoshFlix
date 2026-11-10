import React, { useState, useEffect } from 'react';
import { X, Settings, Database, HardDrive, ShieldCheck, RefreshCw, Check } from 'lucide-react';
import { getSetting, saveSetting } from '../services/db';

export default function SettingsModal({ onClose, onRefreshLibrary }) {
  const [autoResume, setAutoResume] = useState(true);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      const resumeSetting = await getSetting('auto_resume', 'true');
      setAutoResume(resumeSetting === 'true');
      
      const hwSetting = await getSetting('hw_accel', 'false');
      setHardwareAcceleration(hwSetting === 'true');
    }
    loadPreferences();
  }, []);

  const handleSavePreferences = async (newAutoResume, newHwAccel) => {
    await saveSetting('auto_resume', String(newAutoResume));
    await saveSetting('hw_accel', String(newHwAccel));
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-[#181818] border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-[#121212]">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#E50914]" />
            <h2 className="font-bold text-lg text-white">JoshFlix Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          
          {/* Playback Preferences */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Playback & Performance</h3>
            
            <div className="flex items-center justify-between p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
              <div>
                <p className="text-sm font-semibold text-white">Auto-Resume Playback</p>
                <p className="text-xs text-neutral-400">Remember last played position and prompt resume.</p>
              </div>
              <input
                type="checkbox"
                checked={autoResume}
                onChange={(e) => {
                  setAutoResume(e.target.checked);
                  handleSavePreferences(e.target.checked, hardwareAcceleration);
                }}
                className="w-4 h-4 accent-[#E50914] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
              <div>
                <p className="text-sm font-semibold text-white">Software Rendering Mode</p>
                <p className="text-xs text-neutral-400">Force software rendering for stable WSL/Linux UI display.</p>
              </div>
              <input
                type="checkbox"
                checked={hardwareAcceleration}
                onChange={(e) => {
                  setHardwareAcceleration(e.target.checked);
                  handleSavePreferences(autoResume, e.target.checked);
                }}
                className="w-4 h-4 accent-[#E50914] cursor-pointer"
              />
            </div>
          </div>

          {/* Database & Storage */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Database & Cache</h3>
            
            <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-neutral-300">
                  <Database className="w-4 h-4 text-emerald-400" /> SQLite Local Store
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-900">
                  Healthy
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Media indexes and watch history are stored locally in <code className="text-neutral-300 font-mono">joshflix.db</code>.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onRefreshLibrary}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-lg transition border border-neutral-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-scan Library
                </button>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">About JoshFlix</h3>
            <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">JoshFlix Local v1.0.0</p>
                <p className="text-xs text-neutral-400">Powered by Tauri v2, React, and Rust.</p>
              </div>
              <span className="text-xs font-mono text-red-500 font-bold bg-red-950/40 px-2 py-1 rounded border border-red-900/50">
                STACS Tech
              </span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between bg-[#121212]">
          {savedStatus ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium animate-fadeIn">
              <Check className="w-4 h-4" /> Preferences saved
            </span>
          ) : (
            <span className="text-xs text-neutral-500">Changes apply instantly</span>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#E50914] hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-red-900/30"
          >
            Close Settings
          </button>
        </div>

      </div>
    </div>
  );
}