"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Play, RotateCcw } from "lucide-react";

interface Invader {
  id: number;
  x: number;
  y: number;
  alive: boolean;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
}

interface InvaderBullet {
  id: number;
  x: number;
  y: number;
}

const GAME_WIDTH = 280;
const GAME_HEIGHT = 320;
const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 16;
const INVADER_SIZE = 20;
const BULLET_SIZE = 4;
const INVADER_ROWS = 4;
const INVADER_COLS = 6;

export default function SpaceInvaders() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover" | "win">("idle");
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  const [invaders, setInvaders] = useState<Invader[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [invaderBullets, setInvaderBullets] = useState<InvaderBullet[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [invaderDirection, setInvaderDirection] = useState(1);
  const gameRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastShot = useRef(0);
  const bulletIdRef = useRef(0);

  const initGame = useCallback(() => {
    const newInvaders: Invader[] = [];
    let id = 0;
    for (let row = 0; row < INVADER_ROWS; row++) {
      for (let col = 0; col < INVADER_COLS; col++) {
        newInvaders.push({
          id: id++,
          x: col * 40 + 30,
          y: row * 30 + 20,
          alive: true,
        });
      }
    }
    setInvaders(newInvaders);
    setBullets([]);
    setInvaderBullets([]);
    setPlayerX(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
    setScore(0);
    setInvaderDirection(1);
    setGameState("playing");
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("space-invaders-highscore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("space-invaders-highscore", score.toString());
    }
  }, [score, highScore]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "Space", " "].includes(e.key)) {
        e.preventDefault();
        keysPressed.current.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = setInterval(() => {
      // Player movement
      if (keysPressed.current.has("ArrowLeft")) {
        setPlayerX((x) => Math.max(0, x - 5));
      }
      if (keysPressed.current.has("ArrowRight")) {
        setPlayerX((x) => Math.min(GAME_WIDTH - PLAYER_WIDTH, x + 5));
      }

      // Shooting
      if (keysPressed.current.has("Space") || keysPressed.current.has(" ")) {
        const now = Date.now();
        if (now - lastShot.current > 300) {
          lastShot.current = now;
          setBullets((prev) => [
            ...prev,
            {
              id: bulletIdRef.current++,
              x: playerX + PLAYER_WIDTH / 2 - BULLET_SIZE / 2,
              y: GAME_HEIGHT - PLAYER_HEIGHT - 10,
            },
          ]);
        }
      }

      // Move bullets
      setBullets((prev) =>
        prev
          .map((b) => ({ ...b, y: b.y - 8 }))
          .filter((b) => b.y > 0)
      );

      // Move invader bullets
      setInvaderBullets((prev) =>
        prev
          .map((b) => ({ ...b, y: b.y + 4 }))
          .filter((b) => b.y < GAME_HEIGHT)
      );
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState, playerX]);

  // Invader movement
  useEffect(() => {
    if (gameState !== "playing") return;

    const moveInvaders = setInterval(() => {
      setInvaders((prev) => {
        const aliveInvaders = prev.filter((i) => i.alive);
        if (aliveInvaders.length === 0) return prev;

        const minX = Math.min(...aliveInvaders.map((i) => i.x));
        const maxX = Math.max(...aliveInvaders.map((i) => i.x));

        let newDirection = invaderDirection;
        let moveDown = false;

        if (maxX >= GAME_WIDTH - INVADER_SIZE - 10 && invaderDirection > 0) {
          newDirection = -1;
          moveDown = true;
        } else if (minX <= 10 && invaderDirection < 0) {
          newDirection = 1;
          moveDown = true;
        }

        if (newDirection !== invaderDirection) {
          setInvaderDirection(newDirection);
        }

        return prev.map((inv) => ({
          ...inv,
          x: inv.x + newDirection * 10,
          y: moveDown ? inv.y + 15 : inv.y,
        }));
      });
    }, 500);

    return () => clearInterval(moveInvaders);
  }, [gameState, invaderDirection]);

  // Invader shooting
  useEffect(() => {
    if (gameState !== "playing") return;

    const invaderShoot = setInterval(() => {
      const aliveInvaders = invaders.filter((i) => i.alive);
      if (aliveInvaders.length === 0) return;

      const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
      setInvaderBullets((prev) => [
        ...prev,
        {
          id: bulletIdRef.current++,
          x: shooter.x + INVADER_SIZE / 2,
          y: shooter.y + INVADER_SIZE,
        },
      ]);
    }, 1500);

    return () => clearInterval(invaderShoot);
  }, [gameState, invaders]);

  // Collision detection
  useEffect(() => {
    if (gameState !== "playing") return;

    // Bullet vs Invader
    bullets.forEach((bullet) => {
      invaders.forEach((invader) => {
        if (
          invader.alive &&
          bullet.x < invader.x + INVADER_SIZE &&
          bullet.x + BULLET_SIZE > invader.x &&
          bullet.y < invader.y + INVADER_SIZE &&
          bullet.y + BULLET_SIZE > invader.y
        ) {
          setInvaders((prev) =>
            prev.map((i) => (i.id === invader.id ? { ...i, alive: false } : i))
          );
          setBullets((prev) => prev.filter((b) => b.id !== bullet.id));
          setScore((s) => s + 10);
        }
      });
    });

    // Invader bullet vs Player
    invaderBullets.forEach((bullet) => {
      if (
        bullet.x < playerX + PLAYER_WIDTH &&
        bullet.x + BULLET_SIZE > playerX &&
        bullet.y < GAME_HEIGHT - 5 &&
        bullet.y + BULLET_SIZE > GAME_HEIGHT - PLAYER_HEIGHT - 10
      ) {
        setGameState("gameover");
      }
    });

    // Check win condition
    if (invaders.length > 0 && invaders.every((i) => !i.alive)) {
      setGameState("win");
    }

    // Check if invaders reached bottom
    const aliveInvaders = invaders.filter((i) => i.alive);
    if (aliveInvaders.some((i) => i.y > GAME_HEIGHT - 60)) {
      setGameState("gameover");
    }
  }, [bullets, invaders, invaderBullets, playerX, gameState]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="widget-card glow-border p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-[var(--accent-magenta)]" />
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Space Invaders
          </span>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="text-[var(--accent-cyan)]">Score: {score}</span>
          <span className="text-[var(--text-muted)]">Hi: {highScore}</span>
        </div>
      </div>

      <div
        ref={gameRef}
        className="relative mx-auto rounded-lg overflow-hidden"
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          background: "linear-gradient(180deg, #0a0a12 0%, #12121a 100%)",
          border: "1px solid var(--border-color)",
          boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)",
        }}
        tabIndex={0}
      >
        {/* Stars background */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-[2px] bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `pulse-glow ${2 + Math.random() * 2}s ease-in-out infinite`,
            }}
          />
        ))}

        {gameState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 z-10">
            <div className="text-2xl font-bold text-[var(--accent-cyan)]" style={{ fontFamily: "Orbitron" }}>
              SPACE INVADERS
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={initGame}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-magenta)] rounded-lg font-medium"
            >
              <Play className="w-4 h-4" /> Start Game
            </motion.button>
            <p className="text-xs text-[var(--text-muted)] text-center px-4">
              ← → to move<br />Space to shoot
            </p>
          </div>
        )}

        {(gameState === "gameover" || gameState === "win") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 z-10">
            <div
              className={`text-2xl font-bold ${gameState === "win" ? "text-[var(--accent-green)]" : "text-[var(--accent-magenta)]"}`}
              style={{ fontFamily: "Orbitron" }}
            >
              {gameState === "win" ? "YOU WIN!" : "GAME OVER"}
            </div>
            <div className="text-[var(--accent-cyan)]">Score: {score}</div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={initGame}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-cyan)] rounded-lg font-medium text-black"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </motion.button>
          </div>
        )}

        {/* Invaders */}
        {invaders.map(
          (invader) =>
            invader.alive && (
              <motion.div
                key={invader.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute text-center"
                style={{
                  left: invader.x,
                  top: invader.y,
                  width: INVADER_SIZE,
                  height: INVADER_SIZE,
                  fontSize: INVADER_SIZE - 4,
                  lineHeight: `${INVADER_SIZE}px`,
                  filter: "drop-shadow(0 0 4px var(--accent-green))",
                }}
              >
                👾
              </motion.div>
            )
        )}

        {/* Player */}
        {gameState === "playing" && (
          <div
            className="absolute"
            style={{
              left: playerX,
              bottom: 10,
              width: PLAYER_WIDTH,
              height: PLAYER_HEIGHT,
              fontSize: PLAYER_WIDTH - 4,
              lineHeight: `${PLAYER_HEIGHT}px`,
              textAlign: "center",
              filter: "drop-shadow(0 0 6px var(--accent-cyan))",
            }}
          >
            🚀
          </div>
        )}

        {/* Player bullets */}
        {bullets.map((bullet) => (
          <div
            key={bullet.id}
            className="absolute rounded-full"
            style={{
              left: bullet.x,
              top: bullet.y,
              width: BULLET_SIZE,
              height: BULLET_SIZE * 2,
              background: "var(--accent-cyan)",
              boxShadow: "0 0 8px var(--accent-cyan)",
            }}
          />
        ))}

        {/* Invader bullets */}
        {invaderBullets.map((bullet) => (
          <div
            key={bullet.id}
            className="absolute rounded-full"
            style={{
              left: bullet.x,
              top: bullet.y,
              width: BULLET_SIZE,
              height: BULLET_SIZE * 2,
              background: "var(--accent-magenta)",
              boxShadow: "0 0 8px var(--accent-magenta)",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
