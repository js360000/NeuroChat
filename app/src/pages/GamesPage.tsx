import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Gamepad2,
  Crosshair,
  Wind,
  Palette,
  Cpu,
  KeyRound,
  RotateCcw,
  Play,
  Pause,
  Trophy,
  Zap,
  Eye,
  Maximize,
  Minimize,
  RectangleHorizontal,
  Square,
  Orbit,
  Route,
  ChevronDown,
  Sparkles,
  Brain,
  Heart
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { applySeo } from '@/lib/seo';
import { AdBanner } from '@/components/AdBanner';
import { cn } from '@/lib/utils';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

/* ═══════════════════════════════════════════════════════════════
   GAME SHELL — Resizable / fullscreen wrapper
   ═══════════════════════════════════════════════════════════════ */

type GameSize = 'default' | 'wide' | 'fullscreen';

function GameShell({ children, defaultColSpan }: { children: React.ReactNode; defaultColSpan?: string }) {
  const [size, setSize] = useState<GameSize>('default');
  const shellRef = useRef<HTMLDivElement>(null);

  const enterFullscreen = useCallback(() => {
    if (!shellRef.current) return;
    if (shellRef.current.requestFullscreen) {
      shellRef.current.requestFullscreen();
    } else if ((shellRef.current as any).webkitRequestFullscreen) {
      (shellRef.current as any).webkitRequestFullscreen();
    }
    setSize('fullscreen');
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    }
    setSize('default');
  }, []);

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        setSize((prev) => (prev === 'fullscreen' ? 'default' : prev));
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const containerCn = cn(
    'relative transition-all duration-300',
    size === 'fullscreen'
      ? 'fixed inset-0 z-[100] bg-background overflow-auto'
      : size === 'wide'
        ? 'lg:col-span-2'
        : (defaultColSpan || '')
  );

  return (
    <div ref={shellRef} className={containerCn}>
      {/* Resize controls */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
        <button
          onClick={() => { if (size === 'wide') setSize('default'); else if (size === 'default') setSize('wide'); else exitFullscreen(); }}
          className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur flex items-center justify-center transition-colors"
          title={size === 'wide' ? 'Default size' : 'Expand wide'}
        >
          {size === 'wide' || size === 'fullscreen'
            ? <Square className="w-3.5 h-3.5 text-white/80" />
            : <RectangleHorizontal className="w-3.5 h-3.5 text-white/80" />}
        </button>
        <button
          onClick={() => { if (size === 'fullscreen') exitFullscreen(); else enterFullscreen(); }}
          className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur flex items-center justify-center transition-colors"
          title={size === 'fullscreen' ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {size === 'fullscreen'
            ? <Minimize className="w-3.5 h-3.5 text-white/80" />
            : <Maximize className="w-3.5 h-3.5 text-white/80" />}
        </button>
      </div>
      <div className={cn(size === 'fullscreen' && 'h-full flex flex-col [&>*]:flex-1 [&>*]:h-full game-fullscreen', size === 'wide' && 'game-wide')}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GAME SECTION — Collapsible category wrapper
   ═══════════════════════════════════════════════════════════════ */

function GameSection({
  icon: Icon,
  title,
  description,
  count,
  children,
  defaultOpen = true,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(defaultOpen ? 'auto' : 0);

  useEffect(() => {
    if (!contentRef.current) return;
    if (open) {
      const h = contentRef.current.scrollHeight;
      setHeight(h);
      const timer = setTimeout(() => setHeight('auto'), 300);
      return () => clearTimeout(timer);
    } else {
      setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [open]);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 group cursor-pointer text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{count}</Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0',
            open && 'rotate-180'
          )}
        />
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: typeof height === 'number' ? `${height}px` : 'auto' }}
      >
        <div className="space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   1. NEBULA DRIFT — Three.js 3D particle dodge game
   ═══════════════════════════════════════════════════════════════ */

function NebulaDrift() {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ x: 0, y: 0, score: 0, alive: true, speed: 0.008, time: 0 });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [alive, setAlive] = useState(true);
  const [started, setStarted] = useState(false);
  const rafRef = useRef(0);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const init = useCallback(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const w = el.clientWidth;
    const h = el.clientHeight;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current.domElement.remove();
    }
    cancelAnimationFrame(rafRef.current);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.035);

    const camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 120);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050510);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient + directional lighting
    scene.add(new THREE.AmbientLight(0x223355, 0.6));
    const dirLight = new THREE.DirectionalLight(0x6688cc, 0.8);
    dirLight.position.set(2, 3, 5);
    scene.add(dirLight);

    // Player orb — glowing core with halo
    const playerGroup = new THREE.Group();
    const playerGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const playerMat = new THREE.MeshStandardMaterial({
      color: 0x44ddff, emissive: 0x2299cc, emissiveIntensity: 1.5, metalness: 0.3, roughness: 0.2,
    });
    const player = new THREE.Mesh(playerGeo, playerMat);
    playerGroup.add(player);

    // Player outer halo
    const haloGeo = new THREE.SphereGeometry(0.22, 24, 24);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x44ddff, transparent: true, opacity: 0.12 });
    playerGroup.add(new THREE.Mesh(haloGeo, haloMat));

    const playerGlow = new THREE.PointLight(0x44ddff, 3, 4);
    playerGroup.add(playerGlow);
    scene.add(playerGroup);

    // Player trail particles
    const trailCount = 60;
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(trailCount * 3);
    const trailOpacities = new Float32Array(trailCount);
    for (let i = 0; i < trailCount; i++) {
      trailPositions[i * 3] = 0;
      trailPositions[i * 3 + 1] = 0;
      trailPositions[i * 3 + 2] = 0;
      trailOpacities[i] = 0;
    }
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.PointsMaterial({
      color: 0x44ddff, size: 0.04, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending,
    });
    const trail = new THREE.Points(trailGeo, trailMat);
    scene.add(trail);
    let trailIdx = 0;

    // Obstacles — crystalline shapes with varied colours
    const obstacles: THREE.Mesh[] = [];
    const obsColors = [0xff4466, 0xff6644, 0xee3388, 0xff5555, 0xcc3366];
    for (let i = 0; i < 25; i++) {
      const size = 0.08 + Math.random() * 0.2;
      const detail = Math.random() > 0.5 ? 1 : 0;
      const geo = new THREE.OctahedronGeometry(size, detail);
      const color = obsColors[Math.floor(Math.random() * obsColors.length)];
      const mat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.4,
        transparent: true, opacity: 0.85, metalness: 0.6, roughness: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        -(Math.random() * 50 + 8)
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(mesh);
      obstacles.push(mesh);
    }

    // Multi-layer starfield
    const addStars = (count: number, spread: number, depth: number, size: number, opacity: number) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * spread;
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
        pos[i * 3 + 2] = -(Math.random() * depth);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xffffff, size, transparent: true, opacity, blending: THREE.AdditiveBlending,
      });
      scene.add(new THREE.Points(geo, mat));
    };
    addStars(400, 30, 80, 0.015, 0.3);
    addStars(200, 25, 60, 0.035, 0.5);
    addStars(50, 20, 50, 0.06, 0.7);

    // Distant nebula clouds (subtle depth)
    const nebulaColors = [0x1a0a30, 0x0c1e3a, 0x0d0828, 0x15102a];
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.PlaneGeometry(12 + Math.random() * 10, 8 + Math.random() * 6);
      const mat = new THREE.MeshBasicMaterial({
        color: nebulaColors[i % nebulaColors.length],
        transparent: true, opacity: 0.15 + Math.random() * 0.1,
        side: THREE.DoubleSide,
      });
      const cloud = new THREE.Mesh(geo, mat);
      cloud.position.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10,
        -(30 + Math.random() * 40)
      );
      cloud.rotation.z = Math.random() * Math.PI;
      scene.add(cloud);
    }

    const state = stateRef.current;
    state.score = 0;
    state.alive = true;
    state.speed = 0.008;
    state.time = 0;

    // Input
    const handlePointer = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      state.x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      state.y = -((e.clientY - rect.top) / rect.height - 0.5) * 6;
    };
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = el.getBoundingClientRect();
      state.x = ((t.clientX - rect.left) / rect.width - 0.5) * 8;
      state.y = -((t.clientY - rect.top) / rect.height - 0.5) * 6;
    };
    el.addEventListener('pointermove', handlePointer);
    el.addEventListener('touchmove', handleTouch, { passive: false });

    const animate = () => {
      if (!state.alive) return;
      state.time += 0.016;

      // Smooth player movement
      playerGroup.position.x += (state.x - playerGroup.position.x) * 0.06;
      playerGroup.position.y += (state.y - playerGroup.position.y) * 0.06;

      // Gentle player tilt based on movement
      const dx = state.x - playerGroup.position.x;
      playerGroup.rotation.z = -dx * 0.15;

      // Pulsing glow
      playerGlow.intensity = 2.5 + Math.sin(state.time * 3) * 0.8;
      haloMat.opacity = 0.1 + Math.sin(state.time * 2.5) * 0.05;

      // Trail
      trailPositions[trailIdx * 3] = playerGroup.position.x + (Math.random() - 0.5) * 0.05;
      trailPositions[trailIdx * 3 + 1] = playerGroup.position.y + (Math.random() - 0.5) * 0.05;
      trailPositions[trailIdx * 3 + 2] = playerGroup.position.z - 0.3;
      trailIdx = (trailIdx + 1) % trailCount;
      trailGeo.attributes.position.needsUpdate = true;

      // Slow, gradual speed increase
      state.speed = 0.008 + state.score * 0.00012;

      for (const obs of obstacles) {
        obs.position.z += state.speed * 60;
        obs.rotation.x += 0.005;
        obs.rotation.y += 0.008;
        if (obs.position.z > 6) {
          obs.position.z = -(30 + Math.random() * 40);
          obs.position.x = (Math.random() - 0.5) * 8;
          obs.position.y = (Math.random() - 0.5) * 6;
          state.score += 1;
          setScore(state.score);
        }
        if (playerGroup.position.distanceTo(obs.position) < 0.35) {
          state.alive = false;
          setAlive(false);
          setBest((prev) => Math.max(prev, state.score));
          return;
        }
      }

      // Subtle camera sway
      camera.position.x = Math.sin(state.time * 0.3) * 0.15;
      camera.position.y = Math.cos(state.time * 0.2) * 0.1;

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener('pointermove', handlePointer);
      el.removeEventListener('touchmove', handleTouch);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    if (started) return init();
  }, [started, init]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  const restart = () => {
    setAlive(true);
    setScore(0);
    setStarted(false);
    setTimeout(() => setStarted(true), 50);
  };

  return (
    <Card className="lg:col-span-2 overflow-hidden h-full">
      <CardContent className="p-0 h-full">
        <div
          ref={mountRef}
          className="relative w-full touch-none h-full"
          style={{ minHeight: 'clamp(320px, 45vw, 480px)' }}
        >
          {/* HUD overlay */}
          <div className="absolute top-0 inset-x-0 z-10 pointer-events-none">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <span className="text-white/90 font-semibold text-sm tracking-wider">NEBULA DRIFT</span>
                <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">3D</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-cyan-300 font-mono">{score}</span>
                <span className="text-white/40">BEST {best}</span>
              </div>
            </div>
          </div>

          {/* Launch screen */}
          {!started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'radial-gradient(ellipse at center, rgba(5,5,16,0.7) 0%, rgba(5,5,16,0.95) 100%)' }}>
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-full border border-cyan-500/30 flex items-center justify-center mx-auto" style={{ boxShadow: '0 0 40px rgba(68,221,255,0.15)' }}>
                  <Crosshair className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold tracking-wide">Nebula Drift</h3>
                  <p className="text-white/40 text-sm mt-1">Navigate through the particle field</p>
                </div>
                <Button onClick={() => setStarted(true)} size="lg" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 gap-2">
                  <Play className="w-4 h-4" /> Launch
                </Button>
                <p className="text-white/30 text-[10px]">Mouse or touch to steer</p>
              </div>
            </div>
          )}

          {/* Death screen */}
          {!alive && started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'radial-gradient(ellipse at center, rgba(20,5,10,0.8) 0%, rgba(5,5,16,0.95) 100%)' }}>
              <div className="space-y-5 text-center">
                <div className="space-y-1">
                  <p className="text-white/40 text-xs uppercase tracking-widest">Drift ended</p>
                  <p className="text-4xl font-bold text-white">{score}</p>
                  {score >= best && score > 0 && (
                    <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs">
                      <Trophy className="w-3.5 h-3.5" /> New best!
                    </div>
                  )}
                </div>
                <Button onClick={restart} size="lg" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-2">
                  <RotateCcw className="w-4 h-4" /> Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. CHROMATIC SHIFT — Advanced HSL color matching
   ═══════════════════════════════════════════════════════════════ */

function randHsl() {
  return { h: Math.floor(Math.random() * 360), s: 30 + Math.floor(Math.random() * 50), l: 30 + Math.floor(Math.random() * 40) };
}
function hslDist(a: { h: number; s: number; l: number }, b: { h: number; s: number; l: number }) {
  const dh = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)) / 180;
  const ds = Math.abs(a.s - b.s) / 100;
  const dl = Math.abs(a.l - b.l) / 100;
  return Math.sqrt(dh * dh + ds * ds + dl * dl);
}
function toHslStr(c: { h: number; s: number; l: number }) { return `hsl(${c.h},${c.s}%,${c.l}%)`; }

function ChromaticShift() {
  const [target, setTarget] = useState(randHsl);
  const [mix, setMix] = useState({ h: 180, s: 50, l: 50 });
  const [totalScore, setTotalScore] = useState(0);
  const [round, setRound] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const accuracy = Math.max(0, Math.round((1 - hslDist(target, mix) / 1.73) * 100));
  const timeBonus = Math.round(timeLeft * 2);

  const startRound = () => {
    setTarget(randHsl());
    setMix({ h: 180, s: 50, l: 50 });
    setSubmitted(false);
    setTimeLeft(15);
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setRunning(false); setSubmitted(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const submit = () => {
    setRunning(false);
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setTotalScore((p) => p + accuracy + timeBonus);
  };

  const next = () => { setRound((r) => r + 1); startRound(); };
  const reset = () => { setTotalScore(0); setRound(1); startRound(); };

  const sliders = [
    { key: 'h' as const, label: 'Hue', min: 0, max: 360, color: `hsl(${mix.h},80%,50%)` },
    { key: 's' as const, label: 'Saturation', min: 0, max: 100, color: '' },
    { key: 'l' as const, label: 'Lightness', min: 0, max: 100, color: '' },
  ];

  return (
    <Card className="h-full">
      <CardContent className="p-6 space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Chromatic Shift
            </h2>
            <p className="text-sm text-muted-foreground">Match the target color against the clock</p>
          </div>
          <Badge variant="secondary">Visual</Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Round {round}</span>
          <span>Score: {totalScore}</span>
          {running && <span className="font-mono text-primary">{timeLeft}s</span>}
        </div>

        {!running && !submitted ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-sm text-muted-foreground">Match HSL colors under time pressure</p>
            <Button onClick={startRound}><Play className="w-4 h-4 mr-2" /> Start</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="h-20 sm:h-24 rounded-xl border border-border" style={{ backgroundColor: toHslStr(target) }} />
                <p className="text-[11px] text-center text-muted-foreground">Target</p>
              </div>
              <div className="space-y-1">
                <div className="h-20 sm:h-24 rounded-xl border border-border" style={{ backgroundColor: toHslStr(mix) }} />
                <p className="text-[11px] text-center text-muted-foreground">Your mix</p>
              </div>
            </div>

            {!submitted ? (
              <div className="space-y-3">
                {sliders.map((s) => (
                  <div key={s.key} className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold w-10 text-muted-foreground">{s.label.slice(0, 3)}</span>
                    <input type="range" min={s.min} max={s.max} value={mix[s.key]}
                      onChange={(e) => setMix((p) => ({ ...p, [s.key]: Number(e.target.value) }))}
                      className="flex-1 accent-primary" />
                    <span className="text-xs text-muted-foreground w-8 text-right font-mono">{mix[s.key]}</span>
                  </div>
                ))}
                <Button size="sm" onClick={submit} className="w-full">Lock in</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={cn(
                  'rounded-xl border p-4 text-center space-y-1',
                  accuracy >= 85 ? 'border-green-500/30 bg-green-500/5' : accuracy >= 60 ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'
                )}>
                  <p className="text-3xl font-bold">{accuracy}%</p>
                  <p className="text-xs text-muted-foreground">+{timeBonus} time bonus</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={next} className="flex-1">Next round</Button>
                  <Button size="sm" variant="ghost" onClick={reset}><RotateCcw className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. NEURAL SEQUENCE — 6-tile Simon Says with combos
   ═══════════════════════════════════════════════════════════════ */

const SEQ_TILES = [
  { idle: 'bg-rose-500/40', lit: 'bg-rose-400 ring-2 ring-rose-300' },
  { idle: 'bg-sky-500/40', lit: 'bg-sky-400 ring-2 ring-sky-300' },
  { idle: 'bg-amber-500/40', lit: 'bg-amber-400 ring-2 ring-amber-300' },
  { idle: 'bg-emerald-500/40', lit: 'bg-emerald-400 ring-2 ring-emerald-300' },
  { idle: 'bg-violet-500/40', lit: 'bg-violet-400 ring-2 ring-violet-300' },
  { idle: 'bg-orange-500/40', lit: 'bg-orange-400 ring-2 ring-orange-300' },
];

function NeuralSequence() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<'idle' | 'showing' | 'input' | 'fail'>('idle');
  const [level, setLevel] = useState(0);
  const [bestLevel, setBestLevel] = useState(0);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const showSeq = useCallback((seq: number[], speed: number) => {
    setPhase('showing');
    setInput([]);
    let i = 0;
    const run = () => {
      if (i < seq.length) {
        setLit(seq[i]);
        timeoutRef.current = window.setTimeout(() => {
          setLit(null);
          i++;
          timeoutRef.current = window.setTimeout(run, speed * 0.4);
        }, speed);
      } else {
        setPhase('input');
      }
    };
    timeoutRef.current = window.setTimeout(run, 400);
  }, []);

  const start = () => {
    const first = [Math.floor(Math.random() * 6)];
    setSequence(first);
    setLevel(1);
    setScore(0);
    setCombo(0);
    showSeq(first, 500);
  };

  const handleTap = (idx: number) => {
    if (phase !== 'input') return;
    setLit(idx);
    setTimeout(() => setLit(null), 150);

    const next = [...input, idx];
    setInput(next);
    const step = next.length - 1;

    if (next[step] !== sequence[step]) {
      setPhase('fail');
      setBestLevel((b) => Math.max(b, level));
      setCombo(0);
      return;
    }

    if (next.length === sequence.length) {
      const newLevel = level + 1;
      const newCombo = combo + 1;
      setLevel(newLevel);
      setCombo(newCombo);
      setScore((s) => s + newLevel * 10 * Math.min(newCombo, 5));
      const newSeq = [...sequence, Math.floor(Math.random() * 6)];
      setSequence(newSeq);
      timeoutRef.current = window.setTimeout(() => showSeq(newSeq, Math.max(200, 500 - newLevel * 25)), 600);
    }
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <Card className="h-full">
      <CardContent className="p-6 space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              Neural Sequence
            </h2>
            <p className="text-sm text-muted-foreground">Memorise and replay the pattern</p>
          </div>
          <Badge variant="secondary">Memory</Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Lvl {level}</span>
          <span>Best {bestLevel}</span>
          <span>Score {score}</span>
          {combo > 1 && <span className="text-primary font-semibold">{combo}x combo</span>}
        </div>

        <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
          {SEQ_TILES.map((tile, idx) => (
            <button
              key={idx}
              onClick={() => handleTap(idx)}
              disabled={phase !== 'input'}
              className={cn(
                'aspect-square rounded-xl transition-all duration-150',
                lit === idx ? tile.lit : tile.idle,
                phase === 'input' ? 'cursor-pointer active:scale-95' : 'cursor-default'
              )}
            />
          ))}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          {phase === 'idle' && 'Press start to begin'}
          {phase === 'showing' && 'Watch carefully...'}
          {phase === 'input' && `Step ${input.length + 1} of ${sequence.length}`}
          {phase === 'fail' && `Game over — reached level ${level}`}
        </div>

        <Button size="sm" onClick={start} disabled={phase === 'showing'} className="w-full">
          {phase === 'idle' ? <><Play className="w-3.5 h-3.5 mr-1.5" /> Start</> : <><RotateCcw className="w-3.5 h-3.5 mr-1.5" /> {phase === 'fail' ? 'Retry' : 'Restart'}</>}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. BREATH SYNC — Premium breathing pacer with rings
   ═══════════════════════════════════════════════════════════════ */

const BREATH_MODES = {
  box: { label: 'Box 4-4-4-4', steps: [4, 4, 4, 4], labels: ['Inhale', 'Hold', 'Exhale', 'Hold'] },
  relax: { label: 'Relax 4-7-8', steps: [4, 7, 8, 0], labels: ['Inhale', 'Hold', 'Exhale', ''] },
  focus: { label: 'Focus 5-5', steps: [5, 0, 5, 0], labels: ['Inhale', '', 'Exhale', ''] },
} as const;

function BreathSync() {
  const [mode, setMode] = useState<keyof typeof BREATH_MODES>('box');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const m = BREATH_MODES[mode];
  const totalCycle = (m.steps as readonly number[]).reduce((a, b) => a + b, 0);
  const cyclePos = elapsed % totalCycle;

  let phase = 0;
  let phaseElapsed = cyclePos;
  for (let i = 0; i < m.steps.length; i++) {
    if (m.steps[i] === 0) { phase++; continue; }
    if (phaseElapsed < m.steps[i]) { phase = i; break; }
    phaseElapsed -= m.steps[i];
    phase = i + 1;
  }
  if (phase >= m.steps.length) phase = 0;

  const phaseDuration = m.steps[phase] || 1;
  const phaseProgress = phaseElapsed / phaseDuration;
  const phaseLabel = running ? m.labels[phase] : 'Ready';

  const ringScale = phase === 0
    ? 0.5 + phaseProgress * 0.5
    : phase === 2
      ? 1 - phaseProgress * 0.5
      : phase === 1 ? 1 : 0.5;

  useEffect(() => {
    if (!running) return;
    const prevElapsed = { value: elapsed };
    intervalRef.current = window.setInterval(() => {
      setElapsed((e) => {
        const next = +(e + 0.05).toFixed(2);
        if (Math.floor(next / totalCycle) > Math.floor(prevElapsed.value / totalCycle)) {
          setCycles((c) => c + 1);
        }
        prevElapsed.value = next;
        return next;
      });
    }, 50);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, totalCycle, elapsed]);

  const toggle = () => setRunning((r) => !r);
  const reset = () => { setRunning(false); setElapsed(0); setCycles(0); };

  return (
    <Card className="h-full">
      <CardContent className="p-6 space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Wind className="w-5 h-5 text-primary" />
              Breath Sync
            </h2>
            <p className="text-sm text-muted-foreground">Follow the rings, sync your breathing</p>
          </div>
          <Badge variant="secondary">Focus</Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(BREATH_MODES).map(([key, val]) => (
            <button key={key}
              onClick={() => { if (!running) setMode(key as keyof typeof BREATH_MODES); }}
              className={cn(
                'text-[11px] px-3 py-1.5 rounded-full border transition font-medium',
                mode === key ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:bg-muted'
              )}>
              {val.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center py-6 flex-1">
          {(() => {
            // Phase-driven colour palette
            const phaseColors = [
              { ring: '168, 85%, 45%', bg: 'rgba(45, 190, 170, 0.12)', text: 'text-teal-600' },    // Inhale — teal
              { ring: '38, 92%, 50%',  bg: 'rgba(240, 170, 30, 0.12)',  text: 'text-amber-600' },   // Hold — amber
              { ring: '350, 75%, 55%', bg: 'rgba(220, 80, 90, 0.12)',   text: 'text-rose-600' },    // Exhale — rose
              { ring: '240, 60%, 55%', bg: 'rgba(90, 80, 200, 0.12)',   text: 'text-indigo-500' },  // Hold 2 — indigo
            ];
            const pc = running ? phaseColors[phase] || phaseColors[0] : { ring: '220, 15%, 60%', bg: 'rgba(140,140,160,0.08)', text: 'text-neutral-500' };
            return (
              <div className="relative w-56 h-56 flex items-center justify-center">
                <div className="absolute w-44 h-44 rounded-full flex items-center justify-center transition-all duration-700 ease-in-out"
                  style={{
                    backgroundColor: pc.bg,
                    transform: `scale(${running ? ringScale : 0.75})`,
                    boxShadow: running ? `0 0 40px hsl(${pc.ring} / 0.25), 0 0 80px hsl(${pc.ring} / 0.1)` : 'none',
                    border: `2px solid hsl(${pc.ring} / 0.3)`,
                  }}>
                  <span className={cn('text-lg font-bold text-center leading-tight transition-colors duration-500', pc.text)}>{phaseLabel}</span>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span>Cycles: {cycles}</span>
          <span>{Math.floor(elapsed)}s elapsed</span>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={toggle} className="flex-1">
            {running ? <><Pause className="w-3.5 h-3.5 mr-1.5" /> Pause</> : <><Play className="w-3.5 h-3.5 mr-1.5" /> Start</>}
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}><RotateCcw className="w-3.5 h-3.5" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. CIPHER — Decode encrypted words (substitution cipher)
   ═══════════════════════════════════════════════════════════════ */

const CIPHER_WORDS = [
  { word: 'RESILIENCE', hint: 'Ability to recover from setbacks' },
  { word: 'EMPATHY', hint: 'Understanding another\'s feelings' },
  { word: 'COURAGE', hint: 'Strength in the face of fear' },
  { word: 'SERENITY', hint: 'State of being calm and peaceful' },
  { word: 'HARMONY', hint: 'A pleasing arrangement of parts' },
  { word: 'COMPASS', hint: 'Tool for finding direction' },
  { word: 'RADIANT', hint: 'Sending out light, shining' },
  { word: 'GENUINE', hint: 'Truly what it is said to be' },
  { word: 'BLOSSOM', hint: 'To flourish or thrive' },
  { word: 'CLARITY', hint: 'Quality of being clear' },
  { word: 'INSIGHT', hint: 'Deep understanding of something' },
  { word: 'TRANQUIL', hint: 'Free from disturbance' },
  { word: 'SENTINEL', hint: 'A guard or watcher' },
  { word: 'CATALYST', hint: 'Something that causes change' },
  { word: 'SPECTRUM', hint: 'A range of different things' },
  { word: 'ELOQUENT', hint: 'Fluent or persuasive in speech' },
];

function buildCipher() {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const shuffled = [...alpha];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // Ensure no letter maps to itself
  for (let i = 0; i < alpha.length; i++) {
    if (shuffled[i] === alpha[i]) {
      const swap = (i + 1) % alpha.length;
      [shuffled[i], shuffled[swap]] = [shuffled[swap], shuffled[i]];
    }
  }
  const map: Record<string, string> = {};
  alpha.forEach((l, i) => { map[l] = shuffled[i]; });
  return map;
}

function Cipher() {
  const [wordIdx, setWordIdx] = useState(() => Math.floor(Math.random() * CIPHER_WORDS.length));
  const [cipherMap, setCipherMap] = useState(buildCipher);
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [solved, setSolved] = useState(false);
  const [reveals, setReveals] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const current = CIPHER_WORDS[wordIdx];
  const encrypted = current.word.split('').map((l) => cipherMap[l] || l);
  const uniqueLetters = [...new Set(current.word.split(''))];

  useEffect(() => {
    const allCorrect = current.word.split('').every((l, i) => guesses[encrypted[i]] === l);
    if (allCorrect && Object.keys(guesses).length >= uniqueLetters.length) {
      setSolved(true);
      setStreak((s) => s + 1);
    }
  }, [guesses, current.word, encrypted, uniqueLetters.length]);

  const handleGuess = (encLetter: string, guess: string) => {
    const upper = guess.toUpperCase();
    if (upper.length > 1) return;
    setGuesses((g) => ({ ...g, [encLetter]: upper }));
  };

  const revealLetter = () => {
    const unrevealed = uniqueLetters.filter((l) => {
      const enc = Object.entries(cipherMap).find(([, v]) => v === cipherMap[l]);
      return enc && guesses[enc[0]] !== l;
    });
    if (unrevealed.length === 0) return;
    const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    const encKey = Object.entries(cipherMap).find(([k]) => cipherMap[k] === cipherMap[pick] && current.word.includes(pick));
    if (encKey) {
      setGuesses((g) => ({ ...g, [cipherMap[pick]]: pick }));
      setReveals((r) => r + 1);
    }
  };

  const nextWord = () => {
    const next = (wordIdx + 1 + Math.floor(Math.random() * (CIPHER_WORDS.length - 1))) % CIPHER_WORDS.length;
    setWordIdx(next);
    setCipherMap(buildCipher());
    setGuesses({});
    setSolved(false);
    setShowHint(false);
    setReveals(0);
  };

  return (
    <Card className="lg:col-span-2 h-full">
      <CardContent className="p-6 space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Cipher
            </h2>
            <p className="text-sm text-muted-foreground">Crack the substitution cipher to reveal the word</p>
          </div>
          <Badge variant="secondary">Logic</Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Streak: {streak}</span>
          <span>Reveals used: {reveals}</span>
          {showHint && <span className="text-primary">{current.hint}</span>}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {encrypted.map((encLetter, i) => {
            const original = current.word[i];
            const guess = guesses[encLetter] || '';
            const correct = guess === original;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-muted-foreground">{encLetter}</span>
                <input
                  type="text"
                  maxLength={1}
                  value={guess}
                  onChange={(e) => handleGuess(encLetter, e.target.value)}
                  disabled={solved}
                  className={cn(
                    'w-9 h-9 sm:w-10 sm:h-10 text-center text-lg font-bold rounded-lg border-2 bg-transparent outline-none transition-colors',
                    solved ? 'border-green-500/50 text-green-600' :
                    correct ? 'border-primary/50 text-primary' :
                    guess ? 'border-red-400/50 text-red-500' :
                    'border-border text-foreground focus:border-primary'
                  )}
                />
              </div>
            );
          })}
        </div>

        {solved && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-sm font-medium text-green-600">
            <Trophy className="w-4 h-4" />
            Decoded: {current.word} — {current.hint}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {solved ? (
            <Button size="sm" onClick={nextWord} className="flex-1"><Zap className="w-3.5 h-3.5 mr-1.5" /> Next cipher</Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={revealLetter}><Eye className="w-3.5 h-3.5 mr-1.5" /> Reveal letter</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowHint(true)} disabled={showHint}>Hint</Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. GRAVITY SLING — Three.js physics slingshot puzzle
   ═══════════════════════════════════════════════════════════════ */

// Simulate a trajectory to check if it can reach the target
function simulateTrajectory(
  startX: number, startY: number,
  velX: number, velY: number,
  wells: { x: number; y: number; mass: number }[],
  targetPos: { x: number; y: number },
  hitRadius: number,
) {
  let x = startX, y = startY, vx = velX, vy = velY;
  for (let step = 0; step < 800; step++) {
    for (const w of wells) {
      const dx = w.x - x, dy = w.y - y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      if (dist < 0.2) return false; // absorbed
      const force = w.mass * 0.002 / Math.max(distSq, 0.1);
      vx += (dx / dist) * force;
      vy += (dy / dist) * force;
    }
    x += vx; y += vy;
    const tdx = targetPos.x - x, tdy = targetPos.y - y;
    if (Math.sqrt(tdx * tdx + tdy * tdy) < hitRadius) return true;
    if (Math.abs(x) > 7 || Math.abs(y) > 5) return false;
  }
  return false;
}

// Brute-force check: can any reasonable shot reach the target?
function isLevelCompletable(
  wells: { x: number; y: number; mass: number }[],
  targetPos: { x: number; y: number },
) {
  const orbX = -3.5, orbY = 0;
  for (let a = -60; a <= 60; a += 5) {
    for (let p = 0.06; p <= 0.18; p += 0.02) {
      const rad = (a * Math.PI) / 180;
      const vx = Math.cos(rad) * p;
      const vy = Math.sin(rad) * p;
      if (simulateTrajectory(orbX, orbY, vx, vy, wells, targetPos, 0.5)) return true;
    }
  }
  return false;
}

function GravitySling() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState(1);
  const [best, setBest] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [levelShots, setLevelShots] = useState(0);
  const [streak, setStreak] = useState(0);
  const [phase, setPhase] = useState<'aim' | 'flight' | 'hit' | 'miss'>('aim');
  const [started, setStarted] = useState(false);
  const [power, setPower] = useState(0);
  const [tip, setTip] = useState('');
  const rafRef = useRef(0);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stateRef = useRef({
    dragging: false,
    dragStart: { x: 0, y: 0 },
    dragEnd: { x: 0, y: 0 },
    orb: null as THREE.Mesh | null,
    orbVel: { x: 0, y: 0 },
    wells: [] as { mesh: THREE.Mesh; ring: THREE.Mesh; x: number; y: number; mass: number }[],
    target: null as THREE.Mesh | null,
    targetRing: null as THREE.Mesh | null,
    targetPos: { x: 0, y: 0 },
    trail: [] as THREE.Mesh[],
    previewDots: [] as THREE.Mesh[],
    explosionParts: [] as { mesh: THREE.Mesh; vx: number; vy: number; life: number }[],
    scene: null as THREE.Scene | null,
    arrowGroup: null as THREE.Group | null,
    arrowShaft: null as THREE.Line | null,
    arrowHead: null as THREE.Mesh | null,
  });

  const TIPS = [
    'Drag backward from the orb to aim — further = more power',
    'Gravity wells bend your path — use them to curve around obstacles',
    'Aim for fewer shots to earn more stars',
    'The dotted line shows your predicted trajectory',
    'Wells pull your orb — aim to slingshot around them',
    'First-shot hits build your streak multiplier!',
  ];

  const generateLevel = useCallback((lvl: number, scene: THREE.Scene) => {
    const s = stateRef.current;
    // Clear old objects
    s.wells.forEach(w => { scene.remove(w.mesh); scene.remove(w.ring); });
    s.wells = [];
    if (s.target) scene.remove(s.target);
    if (s.targetRing) scene.remove(s.targetRing);
    s.trail.forEach(t => { scene.remove(t); t.geometry.dispose(); });
    s.trail = [];
    s.previewDots.forEach(d => { scene.remove(d); d.geometry.dispose(); });
    s.previewDots = [];
    s.explosionParts.forEach(p => { scene.remove(p.mesh); p.mesh.geometry.dispose(); });
    s.explosionParts = [];

    const orbX = -3.5, orbY = 0;
    let attempts = 0;

    // Generate until we get a completable level
    while (attempts < 50) {
      attempts++;
      const tempWells: { x: number; y: number; mass: number }[] = [];

      // Place gravity wells — keep them in the middle band, not on the orb or target path extremes
      const wellCount = Math.min(1 + Math.floor(lvl / 2), 4);
      for (let i = 0; i < wellCount; i++) {
        const angle = (i / wellCount) * Math.PI * 2 + (lvl * 0.7) + (attempts * 0.3);
        const dist = 1.2 + Math.random() * 1.8;
        const wx = Math.cos(angle) * dist * 0.8;
        const wy = Math.sin(angle) * dist * 0.5;
        const mass = 0.25 + Math.random() * 0.3 + Math.min(lvl * 0.03, 0.3);

        // Ensure well isn't too close to orb start
        const dOrb = Math.sqrt((wx - orbX) ** 2 + (wy - orbY) ** 2);
        if (dOrb < 0.8) continue;

        tempWells.push({ x: wx, y: wy, mass });
      }

      // Place target on the right side, not too far
      const tAngle = (Math.random() - 0.5) * Math.PI * 0.6;
      const tDist = 2.5 + Math.min(lvl * 0.3, 2) + Math.random();
      const tx = Math.cos(tAngle) * tDist;
      const ty = Math.sin(tAngle) * tDist * 0.4;
      const targetPos = { x: Math.max(tx, 1.5), y: ty };

      // Ensure target isn't too close to any well
      const tooClose = tempWells.some(w => {
        const d = Math.sqrt((w.x - targetPos.x) ** 2 + (w.y - targetPos.y) ** 2);
        return d < 0.8;
      });
      if (tooClose) continue;

      // Validate completability
      if (isLevelCompletable(tempWells, targetPos)) {
        // Build the scene objects
        for (let i = 0; i < tempWells.length; i++) {
          const tw = tempWells[i];
          const wellGeo = new THREE.SphereGeometry(0.15 + tw.mass * 0.15, 24, 24);
          const wellMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0.75 + i * 0.12, 0.8, 0.5),
            emissive: new THREE.Color().setHSL(0.75 + i * 0.12, 0.9, 0.3),
            emissiveIntensity: 1.2, metalness: 0.4, roughness: 0.3,
          });
          const wellMesh = new THREE.Mesh(wellGeo, wellMat);
          wellMesh.position.set(tw.x, tw.y, 0);
          scene.add(wellMesh);

          const ringGeo = new THREE.RingGeometry(tw.mass * 1.5, tw.mass * 1.5 + 0.03, 48);
          const ringMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.75 + i * 0.12, 0.6, 0.4),
            transparent: true, opacity: 0.25, side: THREE.DoubleSide,
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.position.set(tw.x, tw.y, -0.01);
          scene.add(ring);
          s.wells.push({ mesh: wellMesh, ring, x: tw.x, y: tw.y, mass: tw.mass });
        }

        s.targetPos = targetPos;
        const tGeo = new THREE.SphereGeometry(0.2, 24, 24);
        const tMat = new THREE.MeshStandardMaterial({
          color: 0x44ff88, emissive: 0x22cc66, emissiveIntensity: 1.5, metalness: 0.2, roughness: 0.3,
        });
        s.target = new THREE.Mesh(tGeo, tMat);
        s.target.position.set(targetPos.x, targetPos.y, 0);
        scene.add(s.target);

        // Outer + inner target rings for visibility
        const trGeo = new THREE.RingGeometry(0.35, 0.4, 32);
        const trMat = new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
        s.targetRing = new THREE.Mesh(trGeo, trMat);
        s.targetRing.position.set(targetPos.x, targetPos.y, -0.01);
        scene.add(s.targetRing);

        const tr2Geo = new THREE.RingGeometry(0.55, 0.58, 32);
        const tr2Mat = new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
        const tr2 = new THREE.Mesh(tr2Geo, tr2Mat);
        tr2.position.set(targetPos.x, targetPos.y, -0.02);
        scene.add(tr2);

        // Create preview dots (hidden until dragging)
        for (let i = 0; i < 30; i++) {
          const dotGeo = new THREE.SphereGeometry(0.025, 8, 8);
          const dotMat = new THREE.MeshBasicMaterial({ color: 0x44ddff, transparent: true, opacity: 0 });
          const dot = new THREE.Mesh(dotGeo, dotMat);
          dot.visible = false;
          scene.add(dot);
          s.previewDots.push(dot);
        }

        return;
      }
    }
    // Fallback: easy direct-shot level with no wells
    s.targetPos = { x: 3, y: 0 };
    const tGeo = new THREE.SphereGeometry(0.2, 24, 24);
    const tMat = new THREE.MeshStandardMaterial({ color: 0x44ff88, emissive: 0x22cc66, emissiveIntensity: 1.5 });
    s.target = new THREE.Mesh(tGeo, tMat);
    s.target.position.set(3, 0, 0);
    scene.add(s.target);
    const trGeo = new THREE.RingGeometry(0.35, 0.4, 32);
    const trMat = new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    s.targetRing = new THREE.Mesh(trGeo, trMat);
    s.targetRing.position.set(3, 0, -0.01);
    scene.add(s.targetRing);
    for (let i = 0; i < 30; i++) {
      const dotGeo = new THREE.SphereGeometry(0.025, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x44ddff, transparent: true, opacity: 0 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.visible = false;
      scene.add(dot);
      s.previewDots.push(dot);
    }
  }, []);

  const updatePreview = useCallback((vx: number, vy: number) => {
    const s = stateRef.current;
    if (!s.orb) return;
    let x = s.orb.position.x, y = s.orb.position.y;
    let pvx = vx, pvy = vy;
    for (let i = 0; i < s.previewDots.length; i++) {
      // Simulate several sub-steps per dot for accuracy
      for (let sub = 0; sub < 4; sub++) {
        for (const w of s.wells) {
          const dx = w.x - x, dy = w.y - y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);
          if (dist < 0.2) { // Would be absorbed — hide remaining
            for (let j = i; j < s.previewDots.length; j++) s.previewDots[j].visible = false;
            return;
          }
          const force = w.mass * 0.002 / Math.max(distSq, 0.1);
          pvx += (dx / dist) * force;
          pvy += (dy / dist) * force;
        }
        x += pvx; y += pvy;
      }
      const dot = s.previewDots[i];
      dot.position.set(x, y, 0);
      dot.visible = true;
      const fade = 1 - i / s.previewDots.length;
      (dot.material as THREE.MeshBasicMaterial).opacity = fade * 0.4;
      dot.scale.setScalar(0.6 + fade * 0.4);
    }
  }, []);

  const spawnExplosion = useCallback((x: number, y: number, color: number, scene: THREE.Scene) => {
    const s = stateRef.current;
    for (let i = 0; i < 20; i++) {
      const geo = new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0);
      scene.add(mesh);
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.02 + Math.random() * 0.04;
      s.explosionParts.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
      });
    }
  }, []);

  const init = useCallback(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const w = el.clientWidth;
    const h = el.clientHeight;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current.domElement.remove();
    }
    cancelAnimationFrame(rafRef.current);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060612, 0.06);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x060612);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0x334466, 0.5));
    const dLight = new THREE.DirectionalLight(0x8888cc, 0.7);
    dLight.position.set(3, 4, 5);
    scene.add(dLight);

    // Star background
    const starGeo = new THREE.BufferGeometry();
    const starVerts = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      starVerts[i * 3] = (Math.random() - 0.5) * 30;
      starVerts[i * 3 + 1] = (Math.random() - 0.5) * 20;
      starVerts[i * 3 + 2] = -5 - Math.random() * 10;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.6 })));

    // Orb
    const orbGeo = new THREE.SphereGeometry(0.12, 24, 24);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x44ddff, emissive: 0x2299cc, emissiveIntensity: 1.8, metalness: 0.3, roughness: 0.2,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(-3.5, 0, 0);
    scene.add(orb);
    stateRef.current.orb = orb;

    // Orb glow ring
    const orbRingGeo = new THREE.RingGeometry(0.18, 0.22, 32);
    const orbRingMat = new THREE.MeshBasicMaterial({ color: 0x44ddff, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const orbRing = new THREE.Mesh(orbRingGeo, orbRingMat);
    orbRing.position.set(-3.5, 0, -0.01);
    scene.add(orbRing);

    // Arrow group (shaft + arrowhead)
    const arrowGroup = new THREE.Group();
    arrowGroup.visible = false;
    scene.add(arrowGroup);

    const shaftGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)]);
    const shaftMat = new THREE.LineBasicMaterial({ color: 0x44ddff, transparent: true, opacity: 0.7 });
    const shaft = new THREE.Line(shaftGeo, shaftMat);
    arrowGroup.add(shaft);

    // Arrowhead (cone pointing in +X)
    const headGeo = new THREE.ConeGeometry(0.08, 0.2, 8);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x44ddff, transparent: true, opacity: 0.8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.rotation.z = -Math.PI / 2; // point along +X
    arrowGroup.add(head);

    stateRef.current.arrowGroup = arrowGroup;
    stateRef.current.arrowShaft = shaft;
    stateRef.current.arrowHead = head;

    generateLevel(1, scene);

    // Input handlers
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return { x: (cx - rect.left) / rect.width * 2 - 1, y: -(cy - rect.top) / rect.height * 2 + 1 };
    };

    const updateArrowVisual = () => {
      const s = stateRef.current;
      if (!s.arrowGroup || !s.arrowShaft || !s.arrowHead || !s.orb) return;
      const dx = s.dragStart.x - s.dragEnd.x;
      const dy = s.dragStart.y - s.dragEnd.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.02) { s.arrowGroup.visible = false; return; }

      s.arrowGroup.visible = true;
      s.arrowGroup.position.copy(s.orb.position);

      const angle = Math.atan2(dy, dx);
      const shaftLen = Math.min(len * 4, 3);
      const endX = Math.cos(angle) * shaftLen;
      const endY = Math.sin(angle) * shaftLen;

      // Update shaft
      s.arrowShaft.geometry.dispose();
      s.arrowShaft.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(endX, endY, 0),
      ]);

      // Position arrowhead at tip
      s.arrowHead.position.set(endX, endY, 0);
      s.arrowHead.rotation.z = angle - Math.PI / 2;

      // Update power
      const pwr = Math.min(len * 3, 4);
      setPower(pwr / 4);

      // Update trajectory preview
      const velX = Math.cos(angle) * pwr * 0.04;
      const velY = Math.sin(angle) * pwr * 0.04;
      updatePreview(velX, velY);
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.orb && !s.dragging) {
        s.dragging = true;
        const p = getPos(e);
        s.dragStart = p;
        s.dragEnd = p;
      }
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.dragging) {
        s.dragEnd = getPos(e);
        updateArrowVisual();
      }
    };
    const onUp = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.dragging) {
        s.dragging = false;
        if (s.arrowGroup) s.arrowGroup.visible = false;
        s.previewDots.forEach(d => { d.visible = false; });
        setPower(0);
        const dx = s.dragStart.x - s.dragEnd.x;
        const dy = s.dragStart.y - s.dragEnd.y;
        const pwr = Math.min(Math.sqrt(dx * dx + dy * dy) * 3, 4);
        if (pwr > 0.1) {
          const angle = Math.atan2(dy, dx);
          s.orbVel = { x: Math.cos(angle) * pwr * 0.04, y: Math.sin(angle) * pwr * 0.04 };
          setPhase('flight');
          setLevelShots(prev => prev + 1);
        }
      }
    };

    el.addEventListener('mousedown', onDown);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('touchstart', onDown, { passive: false });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onUp, { passive: false });

    let time = 0;
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      time += 0.016;
      const s = stateRef.current;

      // Pulse orb ring
      orbRing.position.x = orb.position.x;
      orbRing.position.y = orb.position.y;
      orbRingMat.opacity = 0.2 + Math.sin(time * 3) * 0.1;
      orbRing.scale.setScalar(1 + Math.sin(time * 2) * 0.1);

      // Pulse gravity wells
      s.wells.forEach((well, i) => {
        well.mesh.scale.setScalar(1 + Math.sin(time * 2 + i) * 0.08);
        well.ring.scale.setScalar(1 + Math.sin(time * 1.5 + i * 2) * 0.05);
        (well.ring.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(time * 2 + i) * 0.1;
      });

      // Pulse target
      if (s.target) s.target.scale.setScalar(1 + Math.sin(time * 3) * 0.1);
      if (s.targetRing) {
        s.targetRing.rotation.z = time * 0.5;
        (s.targetRing.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(time * 2) * 0.1;
      }

      // Explosion particles
      for (let i = s.explosionParts.length - 1; i >= 0; i--) {
        const p = s.explosionParts[i];
        p.mesh.position.x += p.vx;
        p.mesh.position.y += p.vy;
        p.life -= 0.02;
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life);
        p.mesh.scale.setScalar(p.life);
        if (p.life <= 0) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          s.explosionParts.splice(i, 1);
        }
      }

      // Orb physics in flight
      if (s.orb && (s.orbVel.x !== 0 || s.orbVel.y !== 0)) {
        for (const well of s.wells) {
          const dx = well.x - s.orb.position.x;
          const dy = well.y - s.orb.position.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);
          if (dist < 0.2) {
            s.orbVel = { x: 0, y: 0 };
            spawnExplosion(s.orb.position.x, s.orb.position.y, 0xff4466, scene);
            setPhase('miss');
            return;
          }
          const force = well.mass * 0.002 / Math.max(distSq, 0.1);
          s.orbVel.x += (dx / dist) * force;
          s.orbVel.y += (dy / dist) * force;
        }

        s.orb.position.x += s.orbVel.x;
        s.orb.position.y += s.orbVel.y;

        // Trail
        if (Math.random() < 0.7) {
          const tGeo = new THREE.SphereGeometry(0.03, 8, 8);
          const tMat = new THREE.MeshBasicMaterial({ color: 0x44ddff, transparent: true, opacity: 0.6 });
          const t = new THREE.Mesh(tGeo, tMat);
          t.position.copy(s.orb.position);
          scene.add(t);
          s.trail.push(t);
          if (s.trail.length > 100) {
            const old = s.trail.shift()!;
            scene.remove(old);
            old.geometry.dispose();
          }
        }
        s.trail.forEach((t, i) => {
          (t.material as THREE.MeshBasicMaterial).opacity = (i / s.trail.length) * 0.5;
          t.scale.setScalar(0.4 + (i / s.trail.length) * 0.6);
        });

        // Hit check — generous radius
        const tdx = s.targetPos.x - s.orb.position.x;
        const tdy = s.targetPos.y - s.orb.position.y;
        if (Math.sqrt(tdx * tdx + tdy * tdy) < 0.5) {
          s.orbVel = { x: 0, y: 0 };
          spawnExplosion(s.targetPos.x, s.targetPos.y, 0x44ff88, scene);
          setPhase('hit');
          return;
        }

        // Out of bounds
        if (Math.abs(s.orb.position.x) > 7 || Math.abs(s.orb.position.y) > 5) {
          s.orbVel = { x: 0, y: 0 };
          setPhase('miss');
          return;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseup', onUp);
      el.removeEventListener('touchstart', onDown);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onUp);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [generateLevel, updatePreview, spawnExplosion]);

  useEffect(() => {
    if (started) {
      setTip(TIPS[0]);
      const cleanup = init();
      return cleanup;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, init]);

  const resetOrb = () => {
    const s = stateRef.current;
    if (s.orb) {
      s.orb.position.set(-3.5, 0, 0);
      s.orbVel = { x: 0, y: 0 };
    }
    s.trail.forEach(t => { if (s.scene) s.scene.remove(t); t.geometry.dispose(); });
    s.trail = [];
    setPhase('aim');
  };

  const nextLevel = () => {
    const s = stateRef.current;
    const newLvl = level + 1;
    // Star rating: 1 shot = 3 stars, 2 shots = 2 stars, 3+ = 1 star
    const earned = levelShots <= 1 ? 3 : levelShots === 2 ? 2 : 1;
    const scoreGain = earned * 100 * (1 + streak * 0.25);

    setTotalScore(prev => prev + Math.round(scoreGain));
    if (levelShots <= 1) setStreak(prev => prev + 1);
    else setStreak(0);
    setLevel(newLvl);
    setBest(b => Math.max(b, newLvl - 1));
    setLevelShots(0);
    setTip(TIPS[Math.min(newLvl - 1, TIPS.length - 1)]);
    if (s.scene) generateLevel(newLvl, s.scene);
    resetOrb();
  };

  const restart = () => {
    setLevel(1);
    setLevelShots(0);
    setTotalScore(0);
    setStreak(0);
    const s = stateRef.current;
    if (s.scene) generateLevel(1, s.scene);
    resetOrb();
  };

  return (
    <Card className="lg:col-span-2 overflow-hidden h-full">
      <CardContent className="p-0 h-full">
        <div ref={mountRef} className="relative w-full touch-none h-full" style={{ minHeight: 'clamp(320px, 45vw, 480px)' }}>
          {/* HUD */}
          <div className="absolute top-0 inset-x-0 z-10 pointer-events-none">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Orbit className="w-4 h-4 text-purple-400" />
                <span className="text-white/90 font-semibold text-sm tracking-wider">GRAVITY SLING</span>
                <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">3D</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-purple-300 font-mono">Lvl {level}</span>
                <span className="text-amber-300 font-mono">{totalScore} pts</span>
                {streak > 1 && <span className="text-orange-400 font-mono">x{streak} streak</span>}
                <span className="text-white/40">BEST Lvl {best}</span>
              </div>
            </div>
          </div>

          {/* Power meter (bottom-left, only when aiming) */}
          {phase === 'aim' && started && power > 0 && (
            <div className="absolute bottom-14 left-4 z-10 pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: `${power * 100}%`,
                      background: power < 0.3 ? '#44ddff' : power < 0.7 ? '#ffaa00' : '#ff4466',
                    }}
                  />
                </div>
                <span className="text-[10px] text-white/50 font-mono">{Math.round(power * 100)}%</span>
              </div>
            </div>
          )}

          {/* Tip bar */}
          {phase === 'aim' && started && (
            <div className="absolute bottom-4 inset-x-0 z-10 pointer-events-none text-center">
              <span className="text-white/30 text-xs">{tip}</span>
            </div>
          )}

          {/* Level shots indicator */}
          {phase === 'aim' && started && levelShots > 0 && (
            <div className="absolute bottom-14 right-4 z-10 pointer-events-none">
              <span className="text-white/30 text-[10px]">Shots this level: {levelShots}</span>
            </div>
          )}

          {/* Launch screen */}
          {!started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'radial-gradient(ellipse at center, rgba(6,6,18,0.7) 0%, rgba(6,6,18,0.95) 100%)' }}>
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-full border border-purple-500/30 flex items-center justify-center mx-auto" style={{ boxShadow: '0 0 40px rgba(140,80,255,0.15)' }}>
                  <Orbit className="w-7 h-7 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold tracking-wide">Gravity Sling</h3>
                  <p className="text-white/40 text-sm mt-1">Sling your orb past gravity wells to hit the target</p>
                </div>
                <div className="space-y-2 text-white/25 text-[11px] max-w-xs mx-auto">
                  <p>Drag backward from the blue orb to aim</p>
                  <p>The dotted line previews your trajectory</p>
                  <p>Fewer shots = more stars = higher score</p>
                </div>
                <Button onClick={() => setStarted(true)} size="lg" className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 gap-2">
                  <Play className="w-4 h-4" /> Launch
                </Button>
              </div>
            </div>
          )}

          {/* Hit overlay */}
          {phase === 'hit' && started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'radial-gradient(ellipse at center, rgba(10,40,20,0.8) 0%, rgba(6,6,18,0.95) 100%)' }}>
              <div className="space-y-5 text-center">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <Trophy className="w-6 h-6" />
                  <span className="text-2xl font-bold">Target Hit!</span>
                </div>
                <p className="text-white/50 text-sm">Level {level} complete in {levelShots} shot{levelShots !== 1 ? 's' : ''}</p>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3].map(i => (
                    <span key={i} className={cn('text-xl', (levelShots <= 1 ? 3 : levelShots === 2 ? 2 : 1) >= i ? 'text-amber-400' : 'text-white/15')}>★</span>
                  ))}
                </div>
                {streak > 0 && levelShots <= 1 && (
                  <p className="text-orange-400 text-xs font-semibold">First-shot streak: {streak + 1}!</p>
                )}
                <Button onClick={nextLevel} size="lg" className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 gap-2">
                  <Zap className="w-4 h-4" /> Next Level
                </Button>
              </div>
            </div>
          )}

          {/* Miss overlay */}
          {phase === 'miss' && started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'radial-gradient(ellipse at center, rgba(30,10,10,0.7) 0%, rgba(6,6,18,0.9) 100%)' }}>
              <div className="space-y-5 text-center">
                <p className="text-white/60 text-lg font-semibold">Missed!</p>
                <p className="text-white/30 text-xs">Try a different angle or power</p>
                <div className="flex gap-3">
                  <Button onClick={resetOrb} size="lg" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-2">
                    <RotateCcw className="w-4 h-4" /> Retry Shot
                  </Button>
                  <Button onClick={restart} size="sm" variant="ghost" className="text-white/40 hover:text-white/70">
                    Reset All
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. VOID RUNNER — Three.js endless runner on neon grid
   ═══════════════════════════════════════════════════════════════ */

function VoidRunner() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [alive, setAlive] = useState(true);
  const [started, setStarted] = useState(false);
  const rafRef = useRef(0);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stateRef = useRef({
    lane: 1, // 0=left, 1=center, 2=right
    targetLane: 1,
    playerX: 0,
    speed: 0.08,
    distance: 0,
    obstacles: [] as THREE.Mesh[],
    orbs: [] as THREE.Mesh[],
    alive: true,
    score: 0,
    nextSpawn: 30,
  });

  const init = useCallback(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const w = el.clientWidth;
    const h = el.clientHeight;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current.domElement.remove();
    }
    cancelAnimationFrame(rafRef.current);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a1a, 8, 30);

    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100);
    camera.position.set(0, 2.5, 5);
    camera.lookAt(0, 0.5, -5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a1a);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0x223344, 0.4));
    const headlight = new THREE.PointLight(0x44ddff, 1.5, 15);
    headlight.position.set(0, 2, 3);
    scene.add(headlight);

    // Neon grid floor
    const gridGeo = new THREE.PlaneGeometry(8, 60, 8, 60);
    const gridMat = new THREE.MeshBasicMaterial({ color: 0x0a0a1a, wireframe: true });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.z = -25;
    scene.add(grid);

    // Neon lane lines
    const lanePositions = [-1.5, -0.5, 0.5, 1.5];
    lanePositions.forEach(x => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.01, 5),
        new THREE.Vector3(x, 0.01, -50),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x2244aa, transparent: true, opacity: 0.4 });
      scene.add(new THREE.Line(lineGeo, lineMat));
    });

    // Side rails — neon glow
    [-2, 2].forEach(x => {
      const railGeo = new THREE.BoxGeometry(0.05, 0.3, 60);
      const railMat = new THREE.MeshStandardMaterial({
        color: 0x4400ff, emissive: 0x4400ff, emissiveIntensity: 0.8,
      });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x, 0.15, -25);
      scene.add(rail);
    });

    // Player craft
    const craftGroup = new THREE.Group();
    const bodyGeo = new THREE.ConeGeometry(0.2, 0.6, 6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x44ddff, emissive: 0x2299cc, emissiveIntensity: 1.5, metalness: 0.5, roughness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = -Math.PI / 2;
    craftGroup.add(body);

    // Engine glow
    const glowGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff6622, transparent: true, opacity: 0.8 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = 0.35;
    craftGroup.add(glow);
    craftGroup.position.set(0, 0.3, 2);
    scene.add(craftGroup);

    // Star background
    const starGeo = new THREE.BufferGeometry();
    const starVerts = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      starVerts[i * 3] = (Math.random() - 0.5) * 40;
      starVerts[i * 3 + 1] = 3 + Math.random() * 15;
      starVerts[i * 3 + 2] = -10 - Math.random() * 30;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.5 })));

    const s = stateRef.current;
    s.lane = 1;
    s.targetLane = 1;
    s.playerX = 0;
    s.speed = 0.08;
    s.distance = 0;
    s.alive = true;
    s.score = 0;
    s.nextSpawn = 30;
    s.obstacles = [];
    s.orbs = [];

    const laneX = (l: number) => (l - 1) * 1;

    const spawnObstacle = () => {
      const lane = Math.floor(Math.random() * 3);
      const geo = new THREE.BoxGeometry(0.6, 0.6, 0.3);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff2244, emissive: 0xff1133, emissiveIntensity: 0.8, metalness: 0.3, roughness: 0.4,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(laneX(lane), 0.3, -25);
      mesh.userData.lane = lane;
      scene.add(mesh);
      s.obstacles.push(mesh);
    };

    const spawnOrb = () => {
      const lane = Math.floor(Math.random() * 3);
      const geo = new THREE.SphereGeometry(0.12, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffdd44, emissive: 0xffaa00, emissiveIntensity: 1.5, metalness: 0.2, roughness: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(laneX(lane), 0.4, -25);
      mesh.userData.lane = lane;
      scene.add(mesh);
      s.orbs.push(mesh);
    };

    // Input
    const onKey = (e: KeyboardEvent) => {
      if (!s.alive) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') s.targetLane = Math.max(0, s.targetLane - 1);
      if (e.key === 'ArrowRight' || e.key === 'd') s.targetLane = Math.min(2, s.targetLane + 1);
    };
    let touchStartX = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!s.alive) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (dx > 30) s.targetLane = Math.min(2, s.targetLane + 1);
      else if (dx < -30) s.targetLane = Math.max(0, s.targetLane - 1);
    };
    // Mouse click left/right halves
    const onClick = (e: MouseEvent) => {
      if (!s.alive) return;
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      if (relX < 0.4) s.targetLane = Math.max(0, s.targetLane - 1);
      else if (relX > 0.6) s.targetLane = Math.min(2, s.targetLane + 1);
    };

    window.addEventListener('keydown', onKey);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('click', onClick);

    let frameCount = 0;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      if (!s.alive) return;
      frameCount++;

      s.distance += s.speed;
      s.speed = 0.08 + s.distance * 0.0003;
      s.score = Math.floor(s.distance * 5);
      if (frameCount % 6 === 0) setScore(s.score);

      // Smooth lane switching
      const targetX = laneX(s.targetLane);
      s.playerX += (targetX - s.playerX) * 0.15;
      craftGroup.position.x = s.playerX;
      craftGroup.rotation.z = (targetX - s.playerX) * -0.5;
      headlight.position.x = s.playerX;

      // Move grid
      grid.position.z = -25 + (s.distance % 1);

      // Pulse engine glow
      glow.scale.setScalar(0.8 + Math.sin(frameCount * 0.2) * 0.3);
      (glowMat as THREE.MeshBasicMaterial).opacity = 0.6 + Math.sin(frameCount * 0.3) * 0.3;

      // Spawn obstacles
      if (s.distance > s.nextSpawn) {
        spawnObstacle();
        if (Math.random() < 0.6) spawnOrb();
        const gap = Math.max(3, 8 - s.distance * 0.01);
        s.nextSpawn = s.distance + gap + Math.random() * gap * 0.5;
      }

      // Move obstacles
      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const ob = s.obstacles[i];
        ob.position.z += s.speed;
        ob.rotation.y += 0.03;
        ob.rotation.x += 0.02;

        // Collision with player
        if (ob.position.z > 1.5 && ob.position.z < 2.8) {
          const dx = Math.abs(ob.position.x - s.playerX);
          if (dx < 0.45) {
            s.alive = false;
            setAlive(false);
            setBest(b => Math.max(b, s.score));
            return;
          }
        }

        if (ob.position.z > 6) {
          scene.remove(ob);
          ob.geometry.dispose();
          s.obstacles.splice(i, 1);
        }
      }

      // Move orbs
      for (let i = s.orbs.length - 1; i >= 0; i--) {
        const orb = s.orbs[i];
        orb.position.z += s.speed;
        orb.rotation.y += 0.08;

        // Collect
        if (orb.position.z > 1.5 && orb.position.z < 2.8) {
          const dx = Math.abs(orb.position.x - s.playerX);
          if (dx < 0.5) {
            scene.remove(orb);
            orb.geometry.dispose();
            s.orbs.splice(i, 1);
            s.score += 50;
            setScore(s.score);
            continue;
          }
        }

        if (orb.position.z > 6) {
          scene.remove(orb);
          orb.geometry.dispose();
          s.orbs.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onKey);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('click', onClick);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    if (started) {
      const cleanup = init();
      return cleanup;
    }
  }, [started, init]);

  const restart = () => {
    setAlive(true);
    setScore(0);
    setStarted(false);
    setTimeout(() => setStarted(true), 50);
  };

  return (
    <Card className="lg:col-span-2 overflow-hidden h-full">
      <CardContent className="p-0 h-full">
        <div ref={mountRef} className="relative w-full touch-none h-full" style={{ minHeight: 'clamp(320px, 45vw, 480px)' }}>
          {/* HUD */}
          <div className="absolute top-0 inset-x-0 z-10 pointer-events-none">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-emerald-400" />
                <span className="text-white/90 font-semibold text-sm tracking-wider">VOID RUNNER</span>
                <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">3D</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-emerald-300 font-mono">{score}</span>
                <span className="text-white/40">BEST {best}</span>
              </div>
            </div>
          </div>

          {/* Launch screen */}
          {!started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'radial-gradient(ellipse at center, rgba(10,10,26,0.7) 0%, rgba(10,10,26,0.95) 100%)' }}>
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-full border border-emerald-500/30 flex items-center justify-center mx-auto" style={{ boxShadow: '0 0 40px rgba(50,220,150,0.15)' }}>
                  <Route className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold tracking-wide">Void Runner</h3>
                  <p className="text-white/40 text-sm mt-1">Dodge barriers, collect orbs, survive the void</p>
                </div>
                <Button onClick={() => setStarted(true)} size="lg" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 gap-2">
                  <Play className="w-4 h-4" /> Run
                </Button>
                <p className="text-white/30 text-[10px]">Click left/right, arrow keys, or swipe to steer</p>
              </div>
            </div>
          )}

          {/* Death screen */}
          {!alive && started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'radial-gradient(ellipse at center, rgba(30,5,10,0.8) 0%, rgba(10,10,26,0.95) 100%)' }}>
              <div className="space-y-5 text-center">
                <div className="space-y-1">
                  <p className="text-white/40 text-xs uppercase tracking-widest">Run ended</p>
                  <p className="text-4xl font-bold text-white">{score}</p>
                  {score >= best && score > 0 && (
                    <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs">
                      <Trophy className="w-3.5 h-3.5" /> New best!
                    </div>
                  )}
                </div>
                <Button onClick={restart} size="lg" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-2">
                  <RotateCcw className="w-4 h-4" /> Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE SHELL
   ═══════════════════════════════════════════════════════════════ */

export function GamesPage() {
  useEffect(() => {
    applySeo({
      title: 'NeuroNest Games — Focus, Play, Unwind',
      description:
        'Premium mini-games designed for neurodivergent minds. 3D challenges, pattern memory, colour matching, breathing exercises and cipher puzzles.',
      canonical: `${typeof window !== 'undefined' ? window.location.origin : ''}/games`
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-14 space-y-8">
        <div className="space-y-3">
          <Badge className="bg-primary/10 text-primary">
            <Gamepad2 className="w-4 h-4 mr-1.5" />
            Games
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Focus. Play. Unwind.
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
            Seven premium experiences crafted for concentration, calm, and satisfying challenge. No account needed.
          </p>
        </div>

        {/* ── 3D Adventures ── */}
        <GameSection
          icon={Sparkles}
          title="3D Adventures"
          description="Immersive Three.js experiences with particle physics and neon visuals"
          count={3}
          defaultOpen={false}
        >
          <div className="grid lg:grid-cols-2 gap-5">
            <GameShell defaultColSpan="lg:col-span-2">
              <NebulaDrift />
            </GameShell>
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            <GameShell defaultColSpan="lg:col-span-2">
              <GravitySling />
            </GameShell>
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            <GameShell defaultColSpan="lg:col-span-2">
              <VoidRunner />
            </GameShell>
          </div>
        </GameSection>

        <AdBanner area="games" />

        {/* ── Mind Games ── */}
        <GameSection
          icon={Brain}
          title="Mind Games"
          description="Pattern recognition, colour matching, and cryptographic puzzles"
          count={3}
          defaultOpen={false}
        >
          <div className="grid lg:grid-cols-2 gap-5">
            <GameShell>
              <ChromaticShift />
            </GameShell>
            <GameShell>
              <NeuralSequence />
            </GameShell>
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            <GameShell defaultColSpan="lg:col-span-2">
              <Cipher />
            </GameShell>
          </div>
        </GameSection>

        {/* ── Wellness ── */}
        <GameSection
          icon={Heart}
          title="Wellness"
          description="Breathing exercises and calming tools for focus and relaxation"
          count={1}
          defaultOpen={false}
        >
          <div className="grid lg:grid-cols-2 gap-5">
            <GameShell defaultColSpan="lg:col-span-2">
              <BreathSync />
            </GameShell>
          </div>
        </GameSection>
      </div>
      <PublicFooter />
    </div>
  );
}
