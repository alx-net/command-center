"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-tasks");
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("dashboard-tasks", JSON.stringify(tasks));
    }
  }, [tasks, mounted]);

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      text: newTask.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    setTasks([task, ...tasks]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addTask();
  };

  if (!mounted) {
    return (
      <div className="widget-card glow-border p-4 h-full">
        <div className="text-[var(--text-muted)]">Loading tasks...</div>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="widget-card glow-border p-4 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--accent-green)]">
          Tasks
        </h3>
        <span className="text-xs text-[var(--text-muted)]">
          {completedCount}/{totalCount} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--bg-secondary)] rounded-full mb-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%",
          }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-green)]"
        />
      </div>

      {/* Add task input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task..."
          className="flex-1 text-sm"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={addTask}
          className="p-2 bg-[var(--accent-cyan)] rounded-lg hover:shadow-[0_0_15px_var(--accent-cyan)] transition-shadow"
        >
          <Plus className="w-5 h-5 text-[var(--bg-primary)]" />
        </motion.button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[var(--text-muted)] py-8"
            >
              No tasks yet. Add one above!
            </motion.div>
          ) : (
            tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                layout
                className={`
                  flex items-center gap-3 p-3 rounded-lg 
                  bg-[var(--bg-secondary)] border border-[var(--border-color)]
                  hover:border-[var(--accent-cyan)] transition-all duration-200
                  ${task.completed ? "opacity-60" : ""}
                `}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleTask(task.id)}
                  className="flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[var(--accent-green)]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                </motion.button>
                <span
                  className={`flex-1 text-sm ${
                    task.completed
                      ? "line-through text-[var(--text-muted)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {task.text}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deleteTask(task.id)}
                  className="flex-shrink-0 p-1 rounded hover:bg-[var(--accent-magenta)]/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-[var(--accent-magenta)]" />
                </motion.button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
