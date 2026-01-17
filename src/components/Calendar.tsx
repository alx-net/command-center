"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  if (!mounted) {
    return (
      <div className="widget-card glow-border p-4">
        <div className="text-[var(--text-muted)]">Loading calendar...</div>
      </div>
    );
  }

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="p-2" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayNum = day;
    days.push(
      <motion.button
        key={day}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() =>
          setSelectedDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum)
          )
        }
        className={`
          p-2 rounded-lg text-sm font-medium transition-all duration-200
          ${
            isToday(day)
              ? "bg-[var(--accent-cyan)] text-[var(--bg-primary)] shadow-[0_0_15px_var(--accent-cyan)]"
              : isSelected(day)
                ? "bg-[var(--accent-purple)] text-white"
                : "hover:bg-[var(--border-color)] text-[var(--text-secondary)]"
          }
        `}
      >
        {day}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="widget-card glow-border p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={prevMonth}
          className="p-1 rounded hover:bg-[var(--border-color)] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
        </motion.button>
        <h3 className="text-lg font-semibold text-[var(--accent-cyan)]">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={nextMonth}
          className="p-1 rounded hover:bg-[var(--border-color)] transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
        </motion.button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{days}</div>
    </motion.div>
  );
}
