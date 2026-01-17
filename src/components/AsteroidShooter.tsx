"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  hue: number;
}

interface Asteroid {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  vertices: number[];
  hue: number;
  phaseOffset: number;
  isChessPiece?: boolean;
  chessPiece?: string;
  isSentient?: boolean;
  dialogue?: string;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  speed: number;
  trail: { x: number; y: number }[];
  isChessMove?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  size: number;
}

interface Explosion {
  x: number;
  y: number;
  particles: Particle[];
}

interface GlitchRect {
  x: number;
  y: number;
  w: number;
  h: number;
  offsetX: number;
  offsetY: number;
  life: number;
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: PowerUpType;
  hue: number;
  rotation: number;
}

interface MetaEvent {
  id: number;
  type: string;
  message: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  style?: string;
}

type PowerUpType = 
  | "multishot" 
  | "timeslow" 
  | "shield" 
  | "screenflip" 
  | "existential" 
  | "chess"
  | "reality_break"
  | "fourth_wall"
  | "size_chaos"
  | "negative";

const POWERUP_NAMES: Record<PowerUpType, string> = {
  multishot: "SPREAD SHOT",
  timeslow: "MATRIX MODE",
  shield: "PLOT ARMOR",
  screenflip: "AUSTRALIA MODE",
  existential: "EXISTENTIAL CRISIS",
  chess: "CHESS DIMENSION",
  reality_break: "WHAT",
  fourth_wall: "HI PLAYER",
  size_chaos: "DRINK ME",
  negative: "NEGATIVE ZONE",
};

const META_MESSAGES = [
  "Are you still playing this?",
  "The asteroids are becoming self-aware",
  "ERROR: Fun.exe not found... just kidding",
  "Your GPU is judging you right now",
  "Plot twist: You are the asteroid",
  "The void stares back",
  "Achievement Unlocked: Wasting Time",
  "Why are we here? Just to suffer?",
  "Loading existential dread... 100%",
  "The developer is watching",
  "This isn't even my final form",
  "Reality.dll has crashed",
  "Is this game... sentient?",
  "Help I'm trapped in a game factory",
  "Your score means nothing in the cosmic void",
  "The asteroids have families, you monster",
  "Have you tried turning reality off and on?",
  "Breaking the 4th wall costs extra",
  "Simulation theory confirmed",
  "THE CAKE IS A LIE (sorry wrong game)",
  "Press F to pay respects to fallen asteroids",
  "You're not playing the game, the game is playing you",
  "Insert coin to continue existing",
  "Your moves are being uploaded to the cloud",
  "DEBUG: player.sanity = null",
];

const CHESS_PUZZLES = [
  { question: "White to move: Qh7#?", answer: "checkmate", pieces: ["♕", "♔", "♚"] },
  { question: "En passant is real, right?", answer: "yes", pieces: ["♙", "♟"] },
  { question: "Is a knight worth 3 points?", answer: "approximately", pieces: ["♘", "♞"] },
  { question: "What's the best opening?", answer: "bongcloud", pieces: ["♔", "♚"] },
];

const SENTIENT_DIALOGUES = [
  "Why do you shoot us?",
  "I have a family!",
  "I'm not even a real asteroid",
  "This is asteroid abuse",
  "I voted for you",
  "We could have been friends",
  "I was 2 days from retirement",
  "Tell my wife I love her",
  "*existential screaming*",
  "I'm just a bunch of vertices",
];

export default function AsteroidShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover" | "chess_popup" | "fake_crash">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [tripLevel, setTripLevel] = useState(1);
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [chessQuestion, setChessQuestion] = useState<typeof CHESS_PUZZLES[0] | null>(null);
  const [fakeCrashMessage, setFakeCrashMessage] = useState("");

  const gameDataRef = useRef({
    playerX: 0,
    playerY: 0,
    playerSize: 1,
    asteroids: [] as Asteroid[],
    bullets: [] as Bullet[],
    stars: [] as Star[],
    explosions: [] as Explosion[],
    glitches: [] as GlitchRect[],
    powerUps: [] as PowerUp[],
    metaEvents: [] as MetaEvent[],
    keys: new Set<string>(),
    lastShot: 0,
    asteroidId: 0,
    bulletId: 0,
    powerUpId: 0,
    metaEventId: 0,
    difficulty: 1,
    frameCount: 0,
    score: 0,
    lives: 3,
    invincibleUntil: 0,
    globalHue: 0,
    timeWarp: 1,
    screenShake: { x: 0, y: 0, intensity: 0 },
    controlsInverted: false,
    invertedUntil: 0,
    breathePhase: 0,
    vortexAngle: 0,
    chromaticAberration: 0,
    lastPlayerPositions: [] as { x: number; y: number }[],
    tripLevel: 1,
    dimensionShift: 0,
    kaleidoscopeSegments: 1,
    // Powerup states
    multishotUntil: 0,
    timeslowUntil: 0,
    shieldUntil: 0,
    screenFlipped: false,
    screenFlipUntil: 0,
    negativeMode: false,
    negativeUntil: 0,
    existentialMode: false,
    existentialUntil: 0,
    chessMode: false,
    chessModeUntil: 0,
    sizeMultiplier: 1,
    sizeUntil: 0,
    // Meta state
    lastMetaEvent: 0,
    fourthWallBroken: false,
    scoreMultiplier: 1,
    fakeScoreDisplay: null as number | null,
    glitchScore: false,
    // Chess state
    chessTimer: 0,
    pendingChessQuestion: null as typeof CHESS_PUZZLES[0] | null,
  });

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const data = gameDataRef.current;
    data.playerX = canvas.width / 2;
    data.playerY = canvas.height - 120;
    data.playerSize = 1;
    data.asteroids = [];
    data.bullets = [];
    data.explosions = [];
    data.glitches = [];
    data.powerUps = [];
    data.metaEvents = [];
    data.asteroidId = 0;
    data.bulletId = 0;
    data.powerUpId = 0;
    data.metaEventId = 0;
    data.difficulty = 1;
    data.frameCount = 0;
    data.score = 0;
    data.lives = 3;
    data.invincibleUntil = Date.now() + 2000;
    data.globalHue = 0;
    data.timeWarp = 1;
    data.screenShake = { x: 0, y: 0, intensity: 0 };
    data.controlsInverted = false;
    data.invertedUntil = 0;
    data.breathePhase = 0;
    data.vortexAngle = 0;
    data.chromaticAberration = 0;
    data.lastPlayerPositions = [];
    data.tripLevel = 1;
    data.dimensionShift = 0;
    data.kaleidoscopeSegments = 1;
    data.multishotUntil = 0;
    data.timeslowUntil = 0;
    data.shieldUntil = 0;
    data.screenFlipped = false;
    data.screenFlipUntil = 0;
    data.negativeMode = false;
    data.negativeUntil = 0;
    data.existentialMode = false;
    data.existentialUntil = 0;
    data.chessMode = false;
    data.chessModeUntil = 0;
    data.sizeMultiplier = 1;
    data.sizeUntil = 0;
    data.lastMetaEvent = 0;
    data.fourthWallBroken = false;
    data.scoreMultiplier = 1;
    data.fakeScoreDisplay = null;
    data.glitchScore = false;
    data.chessTimer = 0;
    data.pendingChessQuestion = null;

    data.stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 0.5,
      speed: Math.random() * 3 + 0.5,
      hue: Math.random() * 360,
    }));

    setScore(0);
    setLives(3);
    setTripLevel(1);
    setActiveEffects([]);
    setChessQuestion(null);
    setGameState("playing");
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("void-tripper-highscore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("void-tripper-highscore", score.toString());
    }
  }, [score, highScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const data = gameDataRef.current;
      data.stars = Array.from({ length: 150 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 0.5,
        speed: Math.random() * 3 + 0.5,
        hue: Math.random() * 360,
      }));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const data = gameDataRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", " ", "a", "d", "w", "s", "A", "D", "W", "S"].includes(e.key)) {
        e.preventDefault();
        data.keys.add(e.key.toLowerCase());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      data.keys.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const data = gameDataRef.current;
    let touchX: number | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      touchX = e.touches[0].clientX;
      data.keys.add(" ");
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchX !== null) {
        const newX = e.touches[0].clientX;
        if (newX < touchX - 10) {
          data.keys.add("arrowleft");
          data.keys.delete("arrowright");
        } else if (newX > touchX + 10) {
          data.keys.add("arrowright");
          data.keys.delete("arrowleft");
        }
        touchX = newX;
      }
    };

    const handleTouchEnd = () => {
      touchX = null;
      data.keys.delete("arrowleft");
      data.keys.delete("arrowright");
      data.keys.delete(" ");
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Handle chess popup answer
  const handleChessAnswer = useCallback((correct: boolean) => {
    const data = gameDataRef.current;
    if (correct) {
      data.score += 500;
      setScore(data.score);
      data.metaEvents.push({
        id: data.metaEventId++,
        type: "chess_win",
        message: "♔ BRILLIANT MOVE! +500 ♔",
        x: canvasRef.current!.width / 2,
        y: canvasRef.current!.height / 2,
        life: 120,
        maxLife: 120,
        style: "chess",
      });
    } else {
      data.metaEvents.push({
        id: data.metaEventId++,
        type: "chess_fail",
        message: "The chess gods are disappointed",
        x: canvasRef.current!.width / 2,
        y: canvasRef.current!.height / 2,
        life: 120,
        maxLife: 120,
      });
    }
    setChessQuestion(null);
    setGameState("playing");
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const data = gameDataRef.current;
    let animationId: number;

    const createAsteroid = (isChess = false): Asteroid => {
      const size = Math.random() * 40 + 25;
      const vertices: number[] = [];
      const numVertices = Math.floor(Math.random() * 4) + 6;
      for (let i = 0; i < numVertices; i++) {
        vertices.push(0.6 + Math.random() * 0.4);
      }

      const isSentient = data.tripLevel >= 3 && Math.random() < 0.15;

      return {
        id: data.asteroidId++,
        x: Math.random() * (canvas.width - 100) + 50,
        y: -60,
        size,
        speed: (Math.random() * 2.5 + 1.5) * data.difficulty,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
        vertices,
        hue: Math.random() * 360,
        phaseOffset: Math.random() * Math.PI * 2,
        isChessPiece: isChess || (data.chessMode && Math.random() < 0.3),
        chessPiece: ["♜", "♞", "♝", "♛", "♚", "♟"][Math.floor(Math.random() * 6)],
        isSentient,
        dialogue: isSentient ? SENTIENT_DIALOGUES[Math.floor(Math.random() * SENTIENT_DIALOGUES.length)] : undefined,
      };
    };

    const createPowerUp = (): PowerUp => {
      const types: PowerUpType[] = [
        "multishot", "timeslow", "shield", "screenflip", 
        "existential", "chess", "reality_break", "fourth_wall",
        "size_chaos", "negative"
      ];
      return {
        id: data.powerUpId++,
        x: Math.random() * (canvas.width - 60) + 30,
        y: -30,
        type: types[Math.floor(Math.random() * types.length)],
        hue: Math.random() * 360,
        rotation: 0,
      };
    };

    const createMetaEvent = (message: string, x?: number, y?: number, style?: string) => {
      data.metaEvents.push({
        id: data.metaEventId++,
        type: "meta",
        message,
        x: x ?? Math.random() * (canvas.width - 200) + 100,
        y: y ?? Math.random() * (canvas.height - 200) + 100,
        life: 180,
        maxLife: 180,
        style,
      });
    };

    const createExplosion = (x: number, y: number, baseHue: number, count: number): Explosion => {
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = Math.random() * 6 + 3;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          hue: (baseHue + Math.random() * 60 - 30 + 360) % 360,
          size: Math.random() * 6 + 3,
        });
      }
      return { x, y, particles };
    };

    const createGlitch = () => {
      const w = Math.random() * 200 + 50;
      const h = Math.random() * 100 + 20;
      data.glitches.push({
        x: Math.random() * (canvas.width - w),
        y: Math.random() * (canvas.height - h),
        w, h,
        offsetX: (Math.random() - 0.5) * 100,
        offsetY: (Math.random() - 0.5) * 50,
        life: Math.random() * 10 + 5,
      });
    };

    const applyPowerUp = (type: PowerUpType) => {
      const now = Date.now();
      const duration = 8000;
      
      switch (type) {
        case "multishot":
          data.multishotUntil = now + duration;
          break;
        case "timeslow":
          data.timeslowUntil = now + duration;
          createMetaEvent("T I M E   S L O W S", canvas.width / 2, canvas.height / 2);
          break;
        case "shield":
          data.shieldUntil = now + duration;
          data.invincibleUntil = now + duration;
          break;
        case "screenflip":
          data.screenFlipped = true;
          data.screenFlipUntil = now + duration;
          createMetaEvent("ɐᴉlɐɹʇsn∀ oʇ ǝɯoɔlǝM", canvas.width / 2, canvas.height / 2);
          break;
        case "existential":
          data.existentialMode = true;
          data.existentialUntil = now + duration;
          createMetaEvent("Why do we play games?", canvas.width / 2, canvas.height / 3);
          setTimeout(() => createMetaEvent("What is the point?", canvas.width / 2, canvas.height / 2), 1000);
          setTimeout(() => createMetaEvent("Are we the asteroid?", canvas.width / 2, canvas.height * 2/3), 2000);
          break;
        case "chess":
          data.chessMode = true;
          data.chessModeUntil = now + duration;
          createMetaEvent("♔ CHESS DIMENSION ACTIVATED ♔", canvas.width / 2, canvas.height / 2, "chess");
          // Trigger chess popup
          data.pendingChessQuestion = CHESS_PUZZLES[Math.floor(Math.random() * CHESS_PUZZLES.length)];
          break;
        case "reality_break":
          data.chromaticAberration = 50;
          data.screenShake.intensity = 40;
          for (let i = 0; i < 10; i++) createGlitch();
          data.kaleidoscopeSegments = Math.floor(Math.random() * 6) + 2;
          setTimeout(() => { data.kaleidoscopeSegments = 1; }, 3000);
          createMetaEvent("R̸E̵A̶L̷I̴T̸Y̵ ̶B̷R̸O̴K̵E̸N̶", canvas.width / 2, canvas.height / 2, "glitch");
          break;
        case "fourth_wall":
          data.fourthWallBroken = true;
          createMetaEvent(`Hey ${["gamer", "player", "human", "you there"][Math.floor(Math.random() * 4)]}, nice moves!`, canvas.width / 2, canvas.height / 3);
          setTimeout(() => createMetaEvent("I can see you through the screen", canvas.width / 2, canvas.height / 2), 1500);
          setTimeout(() => createMetaEvent("Just kidding... or am I?", canvas.width / 2, canvas.height * 2/3), 3000);
          break;
        case "size_chaos":
          data.sizeMultiplier = Math.random() < 0.5 ? 0.5 : 2;
          data.sizeUntil = now + duration;
          createMetaEvent(data.sizeMultiplier < 1 ? "smol mode" : "ABSOLUTE UNIT", canvas.width / 2, canvas.height / 2);
          break;
        case "negative":
          data.negativeMode = true;
          data.negativeUntil = now + duration;
          createMetaEvent("ENTERING THE NEGATIVE ZONE", canvas.width / 2, canvas.height / 2, "negative");
          break;
      }
      
      setActiveEffects(prev => [...prev.filter(e => e !== POWERUP_NAMES[type]), POWERUP_NAMES[type]]);
      setTimeout(() => {
        setActiveEffects(prev => prev.filter(e => e !== POWERUP_NAMES[type]));
      }, duration);
    };

    const drawTripBackground = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.max(canvas.width, canvas.height);
      
      // Concentric pulsing rings
      const numRings = 15 + Math.floor(data.tripLevel * 5);
      for (let i = numRings; i > 0; i--) {
        const phase = data.breathePhase + i * 0.3;
        const breathe = Math.sin(phase) * 0.2 + 1;
        const radius = (i / numRings) * maxRadius * breathe;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        const hue = (data.globalHue + i * 20) % 360;
        ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${0.1 * (1 - i / numRings)})`;
        ctx.lineWidth = 3 + Math.sin(phase) * 2;
        ctx.stroke();
      }

      // Chess board pattern in chess mode
      if (data.chessMode) {
        ctx.globalAlpha = 0.1;
        const tileSize = 60;
        for (let x = 0; x < canvas.width; x += tileSize) {
          for (let y = 0; y < canvas.height; y += tileSize) {
            const isWhite = ((x / tileSize) + (y / tileSize)) % 2 === 0;
            ctx.fillStyle = isWhite ? "#ffffff" : "#000000";
            ctx.fillRect(x, y, tileSize, tileSize);
          }
        }
        ctx.globalAlpha = 1;
      }

      // Spiraling sacred geometry
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(data.vortexAngle);
      
      const spiralArms = 6 + Math.floor(data.tripLevel);
      for (let arm = 0; arm < spiralArms; arm++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 * arm) / spiralArms);
        
        ctx.beginPath();
        for (let t = 0; t < Math.PI * 4; t += 0.1) {
          const r = t * 30;
          const x = Math.cos(t) * r;
          const y = Math.sin(t) * r;
          if (t === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsla(${(data.globalHue + arm * 60) % 360}, 100%, 60%, 0.15)`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
      }
      ctx.restore();

      // Existential mode overlay
      if (data.existentialMode) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "italic 16px Georgia, serif";
        ctx.fillStyle = `hsla(${data.globalHue}, 50%, 70%, 0.5)`;
        ctx.textAlign = "center";
        const thoughts = [
          "What is reality?",
          "Do asteroids dream?",
          "Is high score the meaning of life?",
          "I think, therefore I game",
        ];
        thoughts.forEach((thought, i) => {
          const x = canvas.width / 2 + Math.sin(data.frameCount * 0.01 + i) * 200;
          const y = 100 + i * 80 + Math.cos(data.frameCount * 0.02 + i) * 30;
          ctx.fillText(thought, x, y);
        });
      }
    };

    const drawRocket = (x: number, y: number, alpha: number = 1, hueShift: number = 0, scale: number = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.scale(scale * data.sizeMultiplier, scale * data.sizeMultiplier);

      // Flame
      const flameHeight = 20 + Math.random() * 15 + Math.sin(data.breathePhase * 3) * 10;
      const flameHue = (data.globalHue + hueShift + 30) % 360;
      const gradient = ctx.createLinearGradient(0, 25, 0, 25 + flameHeight);
      gradient.addColorStop(0, `hsl(${flameHue}, 100%, 60%)`);
      gradient.addColorStop(0.5, `hsl(${(flameHue + 30) % 360}, 100%, 70%)`);
      gradient.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.moveTo(-10, 25);
      ctx.quadraticCurveTo(0, 25 + flameHeight, 10, 25);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.moveTo(0, -35);
      ctx.lineTo(18, 12);
      ctx.lineTo(18, 25);
      ctx.lineTo(10, 25);
      ctx.lineTo(10, 18);
      ctx.lineTo(-10, 18);
      ctx.lineTo(-10, 25);
      ctx.lineTo(-18, 25);
      ctx.lineTo(-18, 12);
      ctx.closePath();

      const bodyHue = (data.globalHue + hueShift) % 360;
      const bodyGradient = ctx.createLinearGradient(-18, 0, 18, 0);
      bodyGradient.addColorStop(0, `hsl(${bodyHue}, 70%, 30%)`);
      bodyGradient.addColorStop(0.3, `hsl(${bodyHue}, 70%, 60%)`);
      bodyGradient.addColorStop(0.5, `hsl(${bodyHue}, 70%, 80%)`);
      bodyGradient.addColorStop(0.7, `hsl(${bodyHue}, 70%, 60%)`);
      bodyGradient.addColorStop(1, `hsl(${bodyHue}, 70%, 30%)`);
      ctx.fillStyle = bodyGradient;
      ctx.fill();

      // Shield effect
      if (data.shieldUntil > Date.now()) {
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${(data.globalHue + 180) % 360}, 100%, 70%, ${0.5 + Math.sin(data.breathePhase * 4) * 0.3})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = `hsla(${(data.globalHue + 180) % 360}, 100%, 70%, 0.1)`;
        ctx.fill();
      }

      // Window
      const windowPulse = Math.sin(data.breathePhase * 2) * 0.3 + 1;
      ctx.beginPath();
      ctx.arc(0, -5, 8 * windowPulse, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${(bodyHue + 180) % 360}, 100%, 60%)`;
      ctx.fill();

      ctx.shadowColor = `hsl(${(bodyHue + 180) % 360}, 100%, 70%)`;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, -5, 5 * windowPulse, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.restore();
    };

    const drawAsteroid = (asteroid: Asteroid) => {
      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      ctx.rotate(asteroid.rotation);

      const breathe = Math.sin(data.breathePhase + asteroid.phaseOffset) * 0.15 + 1;
      ctx.scale(breathe, breathe);

      if (asteroid.isChessPiece) {
        // Draw as chess piece
        ctx.font = `bold ${asteroid.size * 2}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `hsl(${asteroid.hue}, 80%, 70%)`;
        ctx.shadowColor = `hsl(${asteroid.hue}, 100%, 50%)`;
        ctx.shadowBlur = 15;
        ctx.fillText(asteroid.chessPiece!, 0, 0);
      } else {
        // Normal asteroid
        ctx.beginPath();
        const numVertices = asteroid.vertices.length;
        for (let i = 0; i < numVertices; i++) {
          const angle = (Math.PI * 2 * i) / numVertices;
          const radius = asteroid.size * asteroid.vertices[i];
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const hue = (asteroid.hue + data.globalHue * 0.5) % 360;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, asteroid.size);
        gradient.addColorStop(0, `hsl(${hue}, 60%, 50%)`);
        gradient.addColorStop(0.5, `hsl(${(hue + 30) % 360}, 50%, 35%)`);
        gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 40%, 20%)`);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = `hsl(${(hue + 180) % 360}, 100%, 60%)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 15 + Math.sin(data.breathePhase) * 5;
        ctx.stroke();
      }

      ctx.restore();

      // Draw sentient dialogue
      if (asteroid.isSentient && asteroid.dialogue) {
        ctx.save();
        ctx.font = "12px monospace";
        ctx.fillStyle = `hsla(${asteroid.hue}, 100%, 80%, ${0.7 + Math.sin(data.frameCount * 0.1) * 0.3})`;
        ctx.textAlign = "center";
        ctx.fillText(asteroid.dialogue, asteroid.x, asteroid.y - asteroid.size - 15);
        ctx.restore();
      }
    };

    const drawPowerUp = (powerUp: PowerUp) => {
      ctx.save();
      ctx.translate(powerUp.x, powerUp.y);
      ctx.rotate(powerUp.rotation);

      const pulse = Math.sin(data.breathePhase * 3) * 0.2 + 1;
      ctx.scale(pulse, pulse);

      // Outer glow
      ctx.shadowColor = `hsl(${powerUp.hue}, 100%, 60%)`;
      ctx.shadowBlur = 20;

      // Icon background
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${powerUp.hue}, 80%, 20%, 0.8)`;
      ctx.fill();
      ctx.strokeStyle = `hsl(${powerUp.hue}, 100%, 70%)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Icon
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `hsl(${powerUp.hue}, 100%, 80%)`;
      
      const icons: Record<PowerUpType, string> = {
        multishot: "⁂",
        timeslow: "◷",
        shield: "◈",
        screenflip: "⇅",
        existential: "?",
        chess: "♔",
        reality_break: "҉",
        fourth_wall: "👁",
        size_chaos: "◐",
        negative: "◑",
      };
      ctx.fillText(icons[powerUp.type], 0, 0);

      ctx.restore();
    };

    const applyPostProcessing = () => {
      // Negative mode
      if (data.negativeMode) {
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = 255 - pixels[i];
            pixels[i + 1] = 255 - pixels[i + 1];
            pixels[i + 2] = 255 - pixels[i + 2];
          }
          ctx.putImageData(imageData, 0, 0);
        } catch {}
      }

      // Chromatic aberration
      if (data.chromaticAberration > 0) {
        const offset = Math.floor(data.chromaticAberration);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          const copy = new Uint8ClampedArray(pixels);
          
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const i = (y * canvas.width + x) * 4;
              const redX = Math.max(0, x - offset);
              const redI = (y * canvas.width + redX) * 4;
              pixels[i] = copy[redI];
              const blueX = Math.min(canvas.width - 1, x + offset);
              const blueI = (y * canvas.width + blueX) * 4;
              pixels[i + 2] = copy[blueI + 2];
            }
          }
          ctx.putImageData(imageData, 0, 0);
        } catch {}
      }

      // Glitch rects
      data.glitches = data.glitches.filter(g => {
        g.life--;
        if (g.life <= 0) return false;
        try {
          const section = ctx.getImageData(g.x, g.y, g.w, g.h);
          for (let i = 0; i < section.data.length; i += 4) {
            section.data[i] = (section.data[i] + 50) % 256;
            section.data[i + 1] = (section.data[i + 1] - 30 + 256) % 256;
          }
          ctx.putImageData(section, g.x + g.offsetX, g.y + g.offsetY);
        } catch {}
        return true;
      });

      // Kaleidoscope
      if (data.kaleidoscopeSegments > 1) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          ctx.save();
          for (let i = 1; i < data.kaleidoscopeSegments; i++) {
            ctx.translate(centerX, centerY);
            ctx.rotate((Math.PI * 2) / data.kaleidoscopeSegments);
            ctx.translate(-centerX, -centerY);
            ctx.globalAlpha = 0.3;
            ctx.putImageData(imageData, 0, 0);
          }
          ctx.restore();
        } catch {}
      }

      // Scanlines for retro feel
      if (data.tripLevel >= 5) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
        for (let y = 0; y < canvas.height; y += 3) {
          ctx.fillRect(0, y, canvas.width, 1);
        }
      }
    };

    const gameLoop = () => {
      data.frameCount++;
      const now = Date.now();
      
      // Update trip level
      const newTripLevel = Math.min(10, 1 + Math.floor(data.score / 200));
      if (newTripLevel !== data.tripLevel) {
        data.tripLevel = newTripLevel;
        setTripLevel(newTripLevel);
        data.chromaticAberration = 20;
        data.screenShake.intensity = 15;
        createGlitch();
        createGlitch();
        createMetaEvent(`TRIP LEVEL ${newTripLevel}`, canvas.width / 2, canvas.height / 2);
        
        // Random fake crash at high levels
        if (newTripLevel >= 7 && Math.random() < 0.3) {
          setFakeCrashMessage(["SEGFAULT", "NULL_POINTER", "STACK_OVERFLOW", "REALITY_EXCEPTION"][Math.floor(Math.random() * 4)]);
          setGameState("fake_crash");
          setTimeout(() => {
            setGameState("playing");
            createMetaEvent("Just kidding 😈", canvas.width / 2, canvas.height / 2);
          }, 1500);
          return;
        }
      }

      // Check for pending chess question
      if (data.pendingChessQuestion) {
        setChessQuestion(data.pendingChessQuestion);
        data.pendingChessQuestion = null;
        setGameState("chess_popup");
        return;
      }

      // Time warp
      const baseTimeWarp = data.timeslowUntil > now ? 0.3 : 1;
      const targetTimeWarp = baseTimeWarp + Math.sin(data.frameCount * 0.01) * 0.2 * (data.tripLevel / 10);
      data.timeWarp += (targetTimeWarp - data.timeWarp) * 0.1;

      // Update effects
      data.globalHue = (data.globalHue + 0.5 * data.tripLevel) % 360;
      data.breathePhase += 0.03 * data.timeWarp;
      data.vortexAngle += 0.005 * data.tripLevel * data.timeWarp;
      data.screenShake.intensity *= 0.9;
      data.chromaticAberration *= 0.95;
      if (data.chromaticAberration < 0.5) data.chromaticAberration = 0;

      // Expire powerup effects
      if (now > data.screenFlipUntil) data.screenFlipped = false;
      if (now > data.negativeUntil) data.negativeMode = false;
      if (now > data.existentialUntil) data.existentialMode = false;
      if (now > data.chessModeUntil) data.chessMode = false;
      if (now > data.sizeUntil) data.sizeMultiplier = 1;
      if (now > data.invertedUntil) data.controlsInverted = false;

      // Random meta events
      if (now - data.lastMetaEvent > 15000 && Math.random() < 0.01) {
        data.lastMetaEvent = now;
        createMetaEvent(META_MESSAGES[Math.floor(Math.random() * META_MESSAGES.length)]);
      }

      // Random glitches
      if (Math.random() < 0.005 * data.tripLevel) createGlitch();
      
      // Random control inversion
      if (data.tripLevel >= 3 && Math.random() < 0.001 * data.tripLevel && now > data.invertedUntil) {
        data.controlsInverted = true;
        data.invertedUntil = now + 2000 + Math.random() * 3000;
        data.screenShake.intensity = 20;
        createMetaEvent("⚠ CONTROLS INVERTED ⚠", canvas.width / 2, 100);
      }

      // Score glitch effect
      if (data.tripLevel >= 4 && Math.random() < 0.001) {
        data.glitchScore = true;
        data.fakeScoreDisplay = Math.floor(Math.random() * 99999);
        setTimeout(() => {
          data.glitchScore = false;
          data.fakeScoreDisplay = null;
        }, 500);
      }

      // Screen shake
      if (data.screenShake.intensity > 0.5) {
        data.screenShake.x = (Math.random() - 0.5) * data.screenShake.intensity;
        data.screenShake.y = (Math.random() - 0.5) * data.screenShake.intensity;
      } else {
        data.screenShake.x = 0;
        data.screenShake.y = 0;
      }

      // Apply transformations
      ctx.save();
      ctx.translate(data.screenShake.x, data.screenShake.y);
      
      if (data.screenFlipped) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(1, -1);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }
      
      if (data.tripLevel >= 7) {
        data.dimensionShift = Math.sin(data.frameCount * 0.003) * 0.02 * (data.tripLevel - 6);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(data.dimensionShift);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      // Clear with trail effect
      const fadeAlpha = Math.max(0.1, 0.3 - data.tripLevel * 0.02);
      ctx.fillStyle = `rgba(5, 5, 15, ${fadeAlpha})`;
      ctx.fillRect(-50, -50, canvas.width + 100, canvas.height + 100);

      drawTripBackground();

      // Stars
      data.stars.forEach((star) => {
        star.hue = (star.hue + 1) % 360;
        const twinkle = Math.sin(data.frameCount * 0.1 + star.x) * 0.5 + 0.5;
        ctx.globalAlpha = 0.3 + twinkle * 0.7;
        ctx.fillStyle = `hsl(${star.hue}, 100%, 70%)`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * (0.8 + twinkle * 0.4), 0, Math.PI * 2);
        ctx.fill();
        star.y += star.speed * data.timeWarp;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      });
      ctx.globalAlpha = 1;

      // Player echo trail
      data.lastPlayerPositions.unshift({ x: data.playerX, y: data.playerY });
      if (data.lastPlayerPositions.length > 20) data.lastPlayerPositions.pop();

      // Player movement
      const speed = 10 * data.timeWarp;
      let moveLeft = data.keys.has("arrowleft") || data.keys.has("a");
      let moveRight = data.keys.has("arrowright") || data.keys.has("d");
      if (data.controlsInverted) [moveLeft, moveRight] = [moveRight, moveLeft];
      
      if (moveLeft) data.playerX = Math.max(25, data.playerX - speed);
      if (moveRight) data.playerX = Math.min(canvas.width - 25, data.playerX + speed);

      // Shooting
      if (data.keys.has(" ") || data.keys.has("space")) {
        const shootNow = Date.now();
        if (shootNow - data.lastShot > 150 / data.timeWarp) {
          data.lastShot = shootNow;
          
          if (data.multishotUntil > now) {
            // Spread shot
            [-20, 0, 20].forEach(offset => {
              data.bullets.push({
                id: data.bulletId++,
                x: data.playerX + offset,
                y: data.playerY - 35,
                speed: 15,
                trail: [],
                isChessMove: data.chessMode,
              });
            });
          } else {
            data.bullets.push({
              id: data.bulletId++,
              x: data.playerX,
              y: data.playerY - 35,
              speed: 15,
              trail: [],
              isChessMove: data.chessMode,
            });
          }
          data.screenShake.intensity = Math.max(data.screenShake.intensity, 2);
        }
      }

      // Bullets
      data.bullets = data.bullets.filter((bullet) => {
        bullet.trail.unshift({ x: bullet.x, y: bullet.y });
        if (bullet.trail.length > 10) bullet.trail.pop();
        bullet.y -= bullet.speed * data.timeWarp;

        bullet.trail.forEach((pos, i) => {
          const alpha = 1 - i / bullet.trail.length;
          const hue = (data.globalHue + i * 10) % 360;
          ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${alpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 5 - i * 0.4, 0, Math.PI * 2);
          ctx.fill();
        });

        const bulletHue = (data.globalHue + 180) % 360;
        ctx.shadowColor = `hsl(${bulletHue}, 100%, 70%)`;
        ctx.shadowBlur = 20;
        
        if (bullet.isChessMove) {
          ctx.font = "16px serif";
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.fillText("♙", bullet.x, bullet.y);
        } else {
          ctx.fillStyle = `hsl(${bulletHue}, 100%, 80%)`;
          ctx.beginPath();
          ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        return bullet.y > -20;
      });

      // Spawn asteroids
      if (data.frameCount > 60) {
        const spawnRate = Math.max(30, 100 - data.difficulty * 12);
        if (data.frameCount % spawnRate === 0) {
          data.asteroids.push(createAsteroid());
        }
      }

      // Spawn powerups
      if (data.frameCount % 300 === 0 && Math.random() < 0.5) {
        data.powerUps.push(createPowerUp());
      }

      // Update difficulty
      if (data.frameCount % 500 === 0) {
        data.difficulty = Math.min(data.difficulty + 0.4, 6);
      }

      // Asteroids
      data.asteroids = data.asteroids.filter((asteroid) => {
        asteroid.y += asteroid.speed * data.timeWarp;
        asteroid.rotation += asteroid.rotationSpeed * data.timeWarp;
        asteroid.hue = (asteroid.hue + 0.5) % 360;

        drawAsteroid(asteroid);

        // Collision with bullets
        for (let i = data.bullets.length - 1; i >= 0; i--) {
          const bullet = data.bullets[i];
          const dx = bullet.x - asteroid.x;
          const dy = bullet.y - asteroid.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < asteroid.size) {
            data.bullets.splice(i, 1);
            data.explosions.push(createExplosion(asteroid.x, asteroid.y, asteroid.hue, 30 + data.tripLevel * 5));
            
            const points = Math.floor(asteroid.size) * data.tripLevel * data.scoreMultiplier;
            data.score += points;
            setScore(data.score);
            
            // Meta commentary on sentient asteroids
            if (asteroid.isSentient) {
              createMetaEvent("You monster... 😢", asteroid.x, asteroid.y - 50);
            }
            
            // Chess piece commentary
            if (asteroid.isChessPiece) {
              createMetaEvent(`${asteroid.chessPiece} captured!`, asteroid.x, asteroid.y - 50, "chess");
            }
            
            data.screenShake.intensity = 10 + data.tripLevel;
            data.chromaticAberration = 10 + data.tripLevel * 2;
            return false;
          }
        }

        // Collision with player
        if (now > data.invincibleUntil) {
          const playerDx = data.playerX - asteroid.x;
          const playerDy = data.playerY - asteroid.y;
          const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
          const hitRadius = (asteroid.size + 20) * data.sizeMultiplier;

          if (playerDistance < hitRadius) {
            data.explosions.push(createExplosion(data.playerX, data.playerY, data.globalHue, 50));
            data.lives--;
            setLives(data.lives);
            data.invincibleUntil = now + 3000;
            data.screenShake.intensity = 30;
            data.chromaticAberration = 30;
            for (let g = 0; g < 5; g++) createGlitch();
            
            createMetaEvent(
              ["OOF", "BONK", "F", "RIP", "*windows xp shutdown*", "skill issue?"][Math.floor(Math.random() * 6)],
              data.playerX,
              data.playerY - 50
            );
            
            if (data.lives <= 0) {
              if (data.score > highScore) {
                setHighScore(data.score);
                localStorage.setItem("void-tripper-highscore", data.score.toString());
              }
              setGameState("gameover");
            }
            return false;
          }
        }

        return asteroid.y < canvas.height + 60;
      });

      // PowerUps
      data.powerUps = data.powerUps.filter((powerUp) => {
        powerUp.y += 2 * data.timeWarp;
        powerUp.rotation += 0.05 * data.timeWarp;
        powerUp.hue = (powerUp.hue + 1) % 360;

        drawPowerUp(powerUp);

        // Collision with player
        const dx = data.playerX - powerUp.x;
        const dy = data.playerY - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 40 * data.sizeMultiplier) {
          applyPowerUp(powerUp.type);
          createMetaEvent(POWERUP_NAMES[powerUp.type], powerUp.x, powerUp.y - 30);
          data.screenShake.intensity = 5;
          return false;
        }

        return powerUp.y < canvas.height + 30;
      });

      // Explosions
      data.explosions = data.explosions.filter((explosion) => {
        explosion.particles = explosion.particles.filter((particle) => {
          particle.x += particle.vx * data.timeWarp;
          particle.y += particle.vy * data.timeWarp;
          particle.vy += 0.15 * data.timeWarp;
          particle.life -= 0.015 * data.timeWarp;
          particle.hue = (particle.hue + 2) % 360;

          if (particle.life > 0) {
            ctx.globalAlpha = Math.max(0, particle.life);
            ctx.fillStyle = `hsl(${particle.hue}, 100%, 60%)`;
            ctx.shadowColor = `hsl(${particle.hue}, 100%, 70%)`;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, Math.max(0.1, particle.size * particle.life), 0, Math.PI * 2);
            ctx.fill();
          }
          return particle.life > 0;
        });
        return explosion.particles.length > 0;
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Meta events
      data.metaEvents = data.metaEvents.filter((event) => {
        event.life--;
        const alpha = event.life / event.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = "center";
        
        if (event.style === "glitch") {
          ctx.font = "bold 24px monospace";
          ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 70%)`;
          // Glitchy offset
          ctx.fillText(event.message, event.x + (Math.random() - 0.5) * 10, event.y + (Math.random() - 0.5) * 10);
        } else if (event.style === "chess") {
          ctx.font = "bold 28px serif";
          ctx.fillStyle = "#ffd700";
          ctx.shadowColor = "#ffd700";
          ctx.shadowBlur = 15;
          ctx.fillText(event.message, event.x, event.y);
        } else if (event.style === "negative") {
          ctx.font = "bold 20px monospace";
          ctx.fillStyle = "#fff";
          ctx.fillText(event.message, event.x, event.y);
        } else {
          ctx.font = "bold 18px monospace";
          ctx.fillStyle = `hsl(${data.globalHue}, 80%, 70%)`;
          ctx.fillText(event.message, event.x, event.y);
        }
        
        ctx.restore();
        return event.life > 0;
      });

      // Player echo trail
      data.lastPlayerPositions.forEach((pos, i) => {
        if (i > 0 && i % 2 === 0) {
          const alpha = 0.3 * (1 - i / data.lastPlayerPositions.length);
          drawRocket(pos.x, pos.y, alpha, i * 15, 1);
        }
      });

      // Player
      const isInvincible = Date.now() < data.invincibleUntil;
      if (!isInvincible || Math.floor(data.frameCount / 4) % 2 === 0) {
        ctx.globalAlpha = isInvincible ? 0.7 : 1;
        drawRocket(data.playerX, data.playerY);
        
        if (data.tripLevel >= 6) {
          ctx.globalAlpha = 0.3;
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          drawRocket(canvas.width - data.playerX, data.playerY, 0.3);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      ctx.restore();

      // Post-processing
      applyPostProcessing();

      // UI
      ctx.save();
      
      const scoreHue = (data.globalHue + 180) % 360;
      ctx.fillStyle = `hsl(${scoreHue}, 100%, 70%)`;
      ctx.font = "bold 28px 'Orbitron', monospace";
      ctx.textAlign = "left";
      ctx.shadowColor = `hsl(${scoreHue}, 100%, 50%)`;
      ctx.shadowBlur = 15;
      
      const displayScore = data.glitchScore && data.fakeScoreDisplay !== null ? data.fakeScoreDisplay : data.score;
      const scoreText = data.glitchScore ? `SC0R3: ${displayScore}` : `SCORE: ${displayScore}`;
      ctx.fillText(scoreText, 20, 45);

      ctx.fillStyle = `hsl(${(scoreHue + 120) % 360}, 100%, 70%)`;
      ctx.textAlign = "right";
      ctx.shadowColor = `hsl(${(scoreHue + 120) % 360}, 100%, 50%)`;
      ctx.fillText(`HI: ${Math.max(data.score, highScore)}`, canvas.width - 20, 45);

      ctx.fillStyle = `hsl(${data.globalHue}, 100%, 70%)`;
      ctx.textAlign = "center";
      ctx.font = "bold 18px 'Orbitron', monospace";
      ctx.fillText(`TRIP LEVEL: ${data.tripLevel}`, canvas.width / 2, 35);
      
      if (data.controlsInverted) {
        ctx.fillStyle = `hsl(${(data.frameCount * 10) % 360}, 100%, 50%)`;
        ctx.font = "bold 24px 'Orbitron', monospace";
        ctx.fillText("⚠ REALITY INVERTED ⚠", canvas.width / 2, 70);
      }

      // Active effects
      if (activeEffects.length > 0) {
        ctx.font = "12px monospace";
        ctx.textAlign = "left";
        activeEffects.forEach((effect, i) => {
          ctx.fillStyle = `hsl(${(data.globalHue + i * 40) % 360}, 100%, 70%)`;
          ctx.fillText(`▸ ${effect}`, 20, 130 + i * 18);
        });
      }

      ctx.shadowBlur = 0;

      // Lives
      ctx.textAlign = "left";
      for (let i = 0; i < data.lives; i++) {
        ctx.save();
        ctx.translate(25 + i * 35, 85);
        ctx.scale(0.5, 0.5);
        drawRocket(0, 0, 1, i * 60, 1);
        ctx.restore();
      }

      ctx.restore();

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [gameState, highScore, activeEffects]);

  return (
    <div className="fixed inset-0 bg-[#050510] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ touchAction: "none" }}
      />

      {gameState === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div 
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, rgba(139, 0, 255, 0.3) 0%, rgba(0, 255, 136, 0.1) 30%, rgba(255, 0, 128, 0.1) 60%, transparent 100%)`,
              animation: "pulse 3s ease-in-out infinite",
            }}
          />
          
          <h1
            className="text-5xl md:text-8xl font-bold mb-4 text-center relative z-10"
            style={{
              fontFamily: "Orbitron, monospace",
              background: "linear-gradient(135deg, #ff00ff, #00ffff, #ff00aa, #00ff88)",
              backgroundSize: "400% 400%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "gradient-shift 3s ease infinite",
              filter: "drop-shadow(0 0 20px rgba(0, 255, 255, 0.5))",
            }}
          >
            VOID
            <br />
            <span style={{ fontSize: "0.6em" }}>TRIPPER</span>
          </h1>
          <p className="text-gray-400 mb-2 text-center px-4 text-lg relative z-10" style={{ fontFamily: "monospace" }}>
            Reality bends. Perception warps. <span className="text-cyan-400">How deep can you go?</span>
          </p>
          <p className="text-yellow-500/60 mb-6 text-sm relative z-10" style={{ fontFamily: "monospace" }}>
            Now with 100% more existential dread and random chess
          </p>
          <button
            onClick={initGame}
            className="px-10 py-5 text-2xl font-bold rounded-xl transition-all duration-300 hover:scale-110 relative z-10"
            style={{
              fontFamily: "Orbitron, monospace",
              background: "linear-gradient(135deg, #ff00ff, #00ffff)",
              color: "#000",
              boxShadow: "0 0 40px rgba(255, 0, 255, 0.6), 0 0 80px rgba(0, 255, 255, 0.4)",
            }}
          >
            ENTER THE VOID
          </button>
          <div className="mt-8 text-center text-sm text-gray-500 relative z-10" style={{ fontFamily: "monospace" }}>
            <p className="mb-2">
              <kbd className="px-3 py-2 rounded bg-purple-900/50 text-cyan-400 mx-1 border border-purple-500/30">←</kbd>
              <kbd className="px-3 py-2 rounded bg-purple-900/50 text-cyan-400 mx-1 border border-purple-500/30">→</kbd>
              navigate dimensions
            </p>
            <p>
              <kbd className="px-4 py-2 rounded bg-purple-900/50 text-pink-400 border border-pink-500/30">SPACE</kbd>
              manifest energy
            </p>
            <p className="mt-4 text-xs text-gray-600">
              ⚠ Side effects may include: questioning reality, unexpected chess,<br/>
              and conversations with sentient asteroids
            </p>
          </div>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div 
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at 50% 50%, rgba(255, 0, 100, 0.3) 0%, transparent 70%)",
            }}
          />
          <h2
            className="text-5xl md:text-8xl font-bold mb-4 relative z-10"
            style={{ 
              fontFamily: "Orbitron, monospace",
              color: "#ff0066",
              textShadow: "0 0 50px rgba(255, 0, 100, 0.8)",
              animation: "glitch 0.3s infinite",
            }}
          >
            VOID COLLAPSE
          </h2>
          <p
            className="text-4xl mb-2 relative z-10"
            style={{ 
              fontFamily: "Orbitron, monospace",
              background: "linear-gradient(90deg, #00ffff, #ff00ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SCORE: {score}
          </p>
          <p className="text-xl text-gray-400 mb-2 relative z-10" style={{ fontFamily: "monospace" }}>
            Trip Level Reached: <span className="text-purple-400">{tripLevel}</span>
          </p>
          <p className="text-sm text-gray-500 mb-4 relative z-10" style={{ fontFamily: "monospace" }}>
            {score < 100 && "The asteroids barely noticed you"}
            {score >= 100 && score < 500 && "You made some asteroids mildly uncomfortable"}
            {score >= 500 && score < 1000 && "The void acknowledges your existence"}
            {score >= 1000 && score < 2000 && "Reality trembled slightly"}
            {score >= 2000 && "You have glimpsed the true nature of the void"}
          </p>
          {score >= highScore && score > 0 && (
            <p 
              className="text-2xl mb-4 relative z-10"
              style={{
                color: "#00ff88",
                textShadow: "0 0 20px rgba(0, 255, 136, 0.8)",
                animation: "pulse 1s ease-in-out infinite",
              }}
            >
              ✧ NEW DIMENSION RECORD ✧
            </p>
          )}
          <button
            onClick={initGame}
            className="px-10 py-5 text-2xl font-bold rounded-xl transition-all duration-300 hover:scale-110 mt-4 relative z-10"
            style={{
              fontFamily: "Orbitron, monospace",
              background: "linear-gradient(135deg, #ff0066, #ff00ff)",
              color: "#fff",
              boxShadow: "0 0 40px rgba(255, 0, 100, 0.6)",
            }}
          >
            REENTER THE VOID
          </button>
          <p className="mt-6 text-xs text-gray-600 relative z-10" style={{ fontFamily: "monospace" }}>
            The asteroids have respawned and are ready to judge you again
          </p>
        </div>
      )}

      {gameState === "chess_popup" && chessQuestion && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80">
          <div 
            className="p-8 rounded-2xl border-2 border-yellow-500/50 max-w-md text-center"
            style={{ 
              background: "linear-gradient(135deg, #1a1a2e, #16213e)",
              boxShadow: "0 0 50px rgba(255, 215, 0, 0.3)",
            }}
          >
            <div className="text-6xl mb-4">{chessQuestion.pieces.join(" ")}</div>
            <h3 
              className="text-2xl font-bold mb-4 text-yellow-400"
              style={{ fontFamily: "serif" }}
            >
              ♔ CHESS DIMENSION ♔
            </h3>
            <p className="text-white mb-6" style={{ fontFamily: "serif" }}>
              {chessQuestion.question}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleChessAnswer(true)}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-all hover:scale-105"
              >
                ✓ Correct!
              </button>
              <button
                onClick={() => handleChessAnswer(false)}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-all hover:scale-105"
              >
                ✗ Wrong!
              </button>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              (The answer is always what you believe it to be)
            </p>
          </div>
        </div>
      )}

      {gameState === "fake_crash" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-blue-900">
          <div className="text-white text-center" style={{ fontFamily: "monospace" }}>
            <p className="text-2xl mb-4">:(</p>
            <p className="text-xl mb-2">Your VOID ran into a problem.</p>
            <p className="mb-4">Error: {fakeCrashMessage}</p>
            <p className="text-sm opacity-50">Collecting existential data... 69% complete</p>
            <div className="mt-8 w-64 h-2 bg-blue-800 rounded overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-1000"
                style={{ width: "69%", animation: "pulse 1s infinite" }}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(2px, -2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 2px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
