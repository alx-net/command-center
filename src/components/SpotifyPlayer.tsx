"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Music, Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

interface Track {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  progress: number;
  duration: number;
  isPlaying: boolean;
}

const demoTracks: Track[] = [
  {
    name: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    albumArt: "https://i.scdn.co/image/ab67616d0000b273c79b600289a80aaef74d155d",
    progress: 45,
    duration: 243,
    isPlaying: true,
  },
  {
    name: "Digital Love",
    artist: "Daft Punk",
    album: "Discovery",
    albumArt: "https://i.scdn.co/image/ab67616d0000b2731d5cf960a92bb8b03bc2795a",
    progress: 120,
    duration: 301,
    isPlaying: false,
  },
  {
    name: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    albumArt: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
    progress: 80,
    duration: 200,
    isPlaying: false,
  },
];

export default function SpotifyPlayer() {
  const [currentTrack, setCurrentTrack] = useState<Track>(demoTracks[0]);
  const [progress, setProgress] = useState(currentTrack.progress);
  const [isPlaying, setIsPlaying] = useState(currentTrack.isPlaying);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= currentTrack.duration) {
          const nextIndex =
            (demoTracks.findIndex((t) => t.name === currentTrack.name) + 1) %
            demoTracks.length;
          setCurrentTrack(demoTracks[nextIndex]);
          return 0;
        }
        return p + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const skipTrack = (direction: "next" | "prev") => {
    const currentIndex = demoTracks.findIndex(
      (t) => t.name === currentTrack.name
    );
    const newIndex =
      direction === "next"
        ? (currentIndex + 1) % demoTracks.length
        : (currentIndex - 1 + demoTracks.length) % demoTracks.length;
    setCurrentTrack(demoTracks[newIndex]);
    setProgress(0);
  };

  if (!mounted) {
    return (
      <div className="widget-card glow-border p-4">
        <div className="text-[var(--text-muted)]">Loading player...</div>
      </div>
    );
  }

  const progressPercent = (progress / currentTrack.duration) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="widget-card glow-border p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Music className="w-4 h-4 text-[var(--accent-green)]" />
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
          Now Playing
        </span>
        {isPlaying && <div className="status-online ml-auto" />}
      </div>

      <div className="flex gap-4">
        {/* Album art */}
        <motion.div
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{
            duration: 3,
            repeat: isPlaying ? Infinity : 0,
            ease: "linear",
          }}
          className="relative flex-shrink-0"
        >
          <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-[var(--border-color)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTrack.albumArt}
              alt={currentTrack.album}
              className="w-full h-full object-cover"
            />
          </div>
          {isPlaying && (
            <div className="absolute inset-0 rounded-lg border-2 border-[var(--accent-green)] animate-pulse" />
          )}
        </motion.div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--text-primary)] truncate">
            {currentTrack.name}
          </h4>
          <p className="text-sm text-[var(--text-secondary)] truncate">
            {currentTrack.artist}
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {currentTrack.album}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-cyan)]"
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-[var(--text-muted)]">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => skipTrack("prev")}
          className="p-2 rounded-full hover:bg-[var(--border-color)] transition-colors"
        >
          <SkipBack className="w-5 h-5 text-[var(--text-secondary)]" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-3 rounded-full bg-[var(--accent-green)] shadow-[0_0_20px_var(--accent-green)] hover:shadow-[0_0_30px_var(--accent-green)] transition-shadow"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-[var(--bg-primary)]" />
          ) : (
            <Play className="w-6 h-6 text-[var(--bg-primary)] ml-0.5" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => skipTrack("next")}
          className="p-2 rounded-full hover:bg-[var(--border-color)] transition-colors"
        >
          <SkipForward className="w-5 h-5 text-[var(--text-secondary)]" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          className="p-2 rounded-full hover:bg-[var(--border-color)] transition-colors ml-4"
        >
          <Volume2 className="w-4 h-4 text-[var(--text-muted)]" />
        </motion.button>
      </div>
    </motion.div>
  );
}
