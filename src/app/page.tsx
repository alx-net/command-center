"use client";

import { motion } from "framer-motion";
import Clock from "@/components/Clock";
import Weather from "@/components/Weather";
import Calendar from "@/components/Calendar";
import Tasks from "@/components/Tasks";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import SystemStatus from "@/components/SystemStatus";
import { Terminal, Zap } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30">
              <Terminal className="w-6 h-6 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-wider"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                <span className="text-[var(--accent-cyan)]">COMMAND</span>
                <span className="text-[var(--accent-magenta)]"> CENTER</span>
              </h1>
              <p className="text-xs text-[var(--text-muted)] tracking-[0.2em] uppercase">
                Personal Dashboard v1.0
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30"
          >
            <Zap className="w-4 h-4 text-[var(--accent-green)]" />
            <span className="text-xs text-[var(--accent-green)] font-medium">
              All Systems Operational
            </span>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Clock - spans 2 columns on large screens */}
        <div className="md:col-span-2">
          <Clock />
        </div>

        {/* Weather */}
        <div className="md:col-span-1">
          <Weather />
        </div>

        {/* System Status */}
        <div className="md:col-span-1">
          <SystemStatus />
        </div>

        {/* Calendar */}
        <div className="md:col-span-1 lg:col-span-2">
          <Calendar />
        </div>

        {/* Spotify Player */}
        <div className="md:col-span-1 lg:col-span-2">
          <SpotifyPlayer />
        </div>

        {/* Tasks - full width on mobile, 2 cols on larger */}
        <div className="md:col-span-2 lg:col-span-4 min-h-[300px]">
          <Tasks />
        </div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center"
      >
        <p className="text-xs text-[var(--text-muted)]">
          <span className="text-[var(--accent-cyan)]">◆</span> Designed for
          productivity{" "}
          <span className="text-[var(--accent-magenta)]">◆</span> Built with
          Next.js + Framer Motion{" "}
          <span className="text-[var(--accent-cyan)]">◆</span>
        </p>
      </motion.footer>
    </div>
  );
}
