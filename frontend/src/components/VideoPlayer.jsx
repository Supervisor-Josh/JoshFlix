import React, { useState, useRef, useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, X, RotateCcw, RotateCw } from 'lucide-react';
import { saveWatchProgress, getWatchProgress } from '../services/db';

export default function VideoPlayer({ media, onClose }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  const videoSrc = convertFileSrc(media.path);

  // Hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // Load previous watch progress and resume playback
  useEffect(() => {
    async function loadProgress() {
      try {
        const saved = await getWatchProgress(media.path);
        if (saved && saved.progress > 5 && saved.progress < saved.duration - 10) {
          if (videoRef.current) {
            videoRef.current.currentTime = saved.progress;
            setProgress(saved.progress);
          }
        }
      } catch (err) {
        console.error("Failed to load watch progress:", err);
      }
    }
    loadProgress();
  }, [media.path]);

  // Auto-save progress to SQLite every 5 seconds during playback
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        saveWatchProgress(media.path, videoRef.current.currentTime, videoRef.current.duration);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [media.path]);

  // Save progress when closing player
  const handleClose = () => {
    if (videoRef.current) {
      saveWatchProgress(media.path, videoRef.current.currentTime, videoRef.current.duration);
    }
    onClose();
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setProgress(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none">
      
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        onTimeUpdate={(e) => setProgress(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      <div className={`absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-t from-black/80 via-transparent to-black/60 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{media.category}</span>
            <h2 className="text-xl font-bold text-white drop-shadow-md">{media.title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-neutral-900/80 hover:bg-red-600 text-white rounded-full transition border border-neutral-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-neutral-300">{formatStringTime => formatTime(progress)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
            />
            <span className="text-xs font-mono text-neutral-300">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="p-3 bg-[#E50914] hover:bg-red-700 text-white rounded-full transition shadow-lg shadow-red-900/40"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              <button
                onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }}
                className="text-neutral-300 hover:text-white transition"
                title="Rewind 10s"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }}
                className="text-neutral-300 hover:text-white transition"
                title="Forward 10s"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-neutral-300 hover:text-white transition">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition border border-neutral-700"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}