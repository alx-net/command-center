"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Clock() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="widget-card glow-border p-6 flex flex-col items-center justify-center">
        <div className="text-6xl font-bold tracking-wider text-[var(--accent-cyan)]">
          --:--:--
        </div>
      </div>
    );
  }

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  const dateStr = time.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="widget-card glow-border p-6 flex flex-col items-center justify-center"
    >
      <div className="text-[var(--text-muted)] text-xs uppercase tracking-[0.3em] mb-2">
        Local Time
      </div>
      <div className="flex items-baseline gap-1">
        <motion.span
          key={hours}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-bold tracking-wider text-[var(--accent-cyan)] neon-text"
        >
          {hours}
        </motion.span>
        <span className="text-6xl font-bold text-[var(--accent-cyan)] pulse-glow">
          :
        </span>
        <motion.span
          key={minutes}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-bold tracking-wider text-[var(--accent-cyan)] neon-text"
        >
          {minutes}
        </motion.span>
        <span className="text-6xl font-bold text-[var(--accent-cyan)] pulse-glow">
          :
        </span>
        <motion.span
          key={seconds}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-wider text-[var(--accent-magenta)]"
        >
          {seconds}
        </motion.span>
      </div>
      <div className="text-[var(--text-secondary)] text-sm mt-3">{dateStr}</div>
    </motion.div>
  );
}
