"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, HardDrive, Wifi, Battery, Activity } from "lucide-react";

interface SystemMetric {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

export default function SystemStatus() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    {
      label: "CPU",
      value: 42,
      icon: <Cpu className="w-4 h-4" />,
      color: "var(--accent-cyan)",
    },
    {
      label: "Memory",
      value: 67,
      icon: <Activity className="w-4 h-4" />,
      color: "var(--accent-purple)",
    },
    {
      label: "Storage",
      value: 54,
      icon: <HardDrive className="w-4 h-4" />,
      color: "var(--accent-orange)",
    },
    {
      label: "Network",
      value: 89,
      icon: <Wifi className="w-4 h-4" />,
      color: "var(--accent-green)",
    },
    {
      label: "Battery",
      value: 85,
      icon: <Battery className="w-4 h-4" />,
      color: "var(--accent-magenta)",
    },
  ]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((m) => ({
          ...m,
          value: Math.min(
            100,
            Math.max(10, m.value + Math.floor(Math.random() * 21) - 10)
          ),
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="widget-card glow-border p-4">
        <div className="text-[var(--text-muted)]">Loading system status...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="widget-card glow-border p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--accent-purple)] uppercase tracking-wider">
          System Status
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Online</span>
          <div className="status-online" />
        </div>
      </div>

      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2" style={{ color: metric.color }}>
                {metric.icon}
                <span className="text-xs text-[var(--text-secondary)]">
                  {metric.label}
                </span>
              </div>
              <span
                className="text-xs font-mono font-medium"
                style={{ color: metric.color }}
              >
                {metric.value}%
              </span>
            </div>
            <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.value}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${metric.color}, ${metric.color}88)`,
                  boxShadow: `0 0 10px ${metric.color}`,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
