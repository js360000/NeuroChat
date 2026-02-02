import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CircleDot,
  Gamepad2,
  Grid,
  Mountain,
  Sparkles,
  Timer,
  Waves
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { applySeo } from '@/lib/seo';

const GRID_SIZE = 5;
const ISO_TILES = 12;
const MEMORY_REVEAL_MS = 1600;
const ISO_REVEAL_MS = 1400;

function createEmptyGrid(size: number) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => false));
}

function createPattern(size: number, count: number) {
  const grid = createEmptyGrid(size);
  let placed = 0;
  while (placed < count) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    if (!grid[r][c]) {
      grid[r][c] = true;
      placed += 1;
    }
  }
  return grid;
}

function gridsMatch(a: boolean[][], b: boolean[][]) {
  for (let r = 0; r < a.length; r += 1) {
    for (let c = 0; c < a[r].length; c += 1) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function createIsoPath(length: number) {
  const tiles = Array.from({ length: ISO_TILES }, (_, index) => index);
  for (let i = tiles.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles.slice(0, length);
}

function isAngleInWindow(angle: number, start: number, size: number) {
  const end = (start + size) % 360;
  if (start <= end) return angle >= start && angle <= end;
  return angle >= start || angle <= end;
}

export function GamesPage() {
  const [grid, setGrid] = useState(() => createEmptyGrid(GRID_SIZE));
  const [targetGrid, setTargetGrid] = useState(() => createPattern(GRID_SIZE, 6));
  const [memoryLevel, setMemoryLevel] = useState(1);
  const [memoryScore, setMemoryScore] = useState(0);
  const [memoryMistakes, setMemoryMistakes] = useState(0);
  const [memoryPreview, setMemoryPreview] = useState(true);
  const [memoryHintCount, setMemoryHintCount] = useState(3);
  const memoryTimerRef = useRef<number | null>(null);

  const [orbitRunning, setOrbitRunning] = useState(false);
  const [orbitMs, setOrbitMs] = useState(0);
  const [orbitSpeed, setOrbitSpeed] = useState(5);
  const [orbitTargetStart, setOrbitTargetStart] = useState(40);
  const [orbitScore, setOrbitScore] = useState(0);
  const [orbitStreak, setOrbitStreak] = useState(0);

  const [isoPath, setIsoPath] = useState(() => createIsoPath(4));
  const [isoLevel, setIsoLevel] = useState(1);
  const [isoStep, setIsoStep] = useState(0);
  const [isoPreview, setIsoPreview] = useState(true);
  const [isoMistakes, setIsoMistakes] = useState(0);
  const isoTimerRef = useRef<number | null>(null);

  const [balanceControl, setBalanceControl] = useState(0);
  const [balanceDrift, setBalanceDrift] = useState(0);
  const [balanceSteady, setBalanceSteady] = useState(0);
  const [balanceRunning, setBalanceRunning] = useState(false);

  useEffect(() => {
    applySeo({
      title: 'NeuroNest Games - Calm 2D and 2.5D Play',
      description:
        'Lightweight, neurodivergent-friendly games with clear goals and gentle pacing. No account required.',
      canonical: 'https://arcane-waters-46868-5bf57db34e8e.herokuapp.com/games'
    });
  }, []);

  useEffect(() => {
    if (memoryTimerRef.current) window.clearTimeout(memoryTimerRef.current);
    setMemoryPreview(true);
    memoryTimerRef.current = window.setTimeout(() => {
      setMemoryPreview(false);
    }, MEMORY_REVEAL_MS);
    return () => {
      if (memoryTimerRef.current) window.clearTimeout(memoryTimerRef.current);
    };
  }, [targetGrid]);

  useEffect(() => {
    if (!orbitRunning) return undefined;
    const interval = window.setInterval(() => {
      setOrbitMs((prev) => prev + 50);
    }, 50);
    return () => window.clearInterval(interval);
  }, [orbitRunning]);

  useEffect(() => {
    if (isoTimerRef.current) window.clearTimeout(isoTimerRef.current);
    setIsoPreview(true);
    isoTimerRef.current = window.setTimeout(() => {
      setIsoPreview(false);
    }, ISO_REVEAL_MS);
    return () => {
      if (isoTimerRef.current) window.clearTimeout(isoTimerRef.current);
    };
  }, [isoPath]);

  useEffect(() => {
    if (!balanceRunning) return undefined;
    const interval = window.setInterval(() => {
      setBalanceDrift((prev) => {
        const next = Math.max(-20, Math.min(20, prev + (Math.random() * 6 - 3)));
        return next;
      });
    }, 240);
    return () => window.clearInterval(interval);
  }, [balanceRunning]);

  const memoryMatches = useMemo(() => gridsMatch(grid, targetGrid), [grid, targetGrid]);

  const orbitAngle = useMemo(() => (orbitMs * orbitSpeed * 0.03) % 360, [orbitMs, orbitSpeed]);
  const orbitWindow = useMemo(() => ({ start: orbitTargetStart, size: 55 }), [orbitTargetStart]);

  const balancePosition = useMemo(() => {
    const raw = 50 + balanceControl + balanceDrift;
    return Math.max(10, Math.min(90, raw));
  }, [balanceControl, balanceDrift]);
  const balanceInZone = balancePosition >= 40 && balancePosition <= 60;

  useEffect(() => {
    if (!balanceRunning) return;
    const interval = window.setInterval(() => {
      setBalanceSteady((prev) => (balanceInZone ? prev + 1 : Math.max(0, prev - 1)));
    }, 500);
    return () => window.clearInterval(interval);
  }, [balanceRunning, balanceInZone]);

  const resetMemoryRound = (level: number) => {
    const count = Math.min(8, 4 + level);
    setTargetGrid(createPattern(GRID_SIZE, count));
    setGrid(createEmptyGrid(GRID_SIZE));
  };

  const checkMemory = () => {
    if (memoryMatches) {
      setMemoryScore((prev) => prev + 12 + memoryLevel * 2);
      setMemoryLevel((prev) => prev + 1);
      resetMemoryRound(memoryLevel + 1);
    } else {
      setMemoryMistakes((prev) => prev + 1);
      setGrid(createEmptyGrid(GRID_SIZE));
    }
  };

  const useMemoryHint = () => {
    if (memoryHintCount <= 0) return;
    setMemoryHintCount((prev) => prev - 1);
    setMemoryPreview(true);
    window.setTimeout(() => setMemoryPreview(false), 900);
  };

  const toggleCell = (row: number, col: number) => {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = !next[row][col];
      return next;
    });
  };

  const handleOrbitTap = () => {
    if (!orbitRunning) return;
    const hit = isAngleInWindow(orbitAngle, orbitWindow.start, orbitWindow.size);
    if (hit) {
      setOrbitScore((prev) => prev + 5 + orbitStreak);
      setOrbitStreak((prev) => prev + 1);
      setOrbitTargetStart(Math.floor(Math.random() * 360));
    } else {
      setOrbitStreak(0);
    }
  };

  const resetOrbit = () => {
    setOrbitMs(0);
    setOrbitScore(0);
    setOrbitStreak(0);
    setOrbitTargetStart(Math.floor(Math.random() * 360));
  };

  const handleIsoTap = (index: number) => {
    if (isoPreview) return;
    const expected = isoPath[isoStep];
    if (index === expected) {
      const nextStep = isoStep + 1;
      if (nextStep >= isoPath.length) {
        const nextLevel = Math.min(7, isoLevel + 1);
        setIsoLevel(nextLevel);
        setIsoStep(0);
        setIsoPath(createIsoPath(3 + nextLevel));
      } else {
        setIsoStep(nextStep);
      }
    } else {
      setIsoMistakes((prev) => prev + 1);
      setIsoStep(0);
    }
  };

  const resetIso = () => {
    setIsoLevel(1);
    setIsoStep(0);
    setIsoMistakes(0);
    setIsoPath(createIsoPath(4));
  };

  const toggleBalance = () => {
    setBalanceRunning((prev) => !prev);
  };

  const resetBalance = () => {
    setBalanceControl(0);
    setBalanceDrift(0);
    setBalanceSteady(0);
    setBalanceRunning(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,_#f6f2ff,_#fefcf7)]">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <div className="space-y-4">
          <Badge className="bg-primary/10 text-primary">
            <Gamepad2 className="w-4 h-4 mr-2" />
            NeuroNest Games
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-dark">
            Play that feels calm, clear, and actually fun.
          </h1>
          <p className="text-neutral-600 text-lg max-w-3xl">
            Four mini games tuned for low pressure focus and light dopamine hits. No account needed.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden border border-neutral-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Grid className="w-5 h-5 text-primary" />
                    Signal Circuit (2D)
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Memorize the pattern, then recreate it.
                  </p>
                </div>
                <Badge variant="secondary">Memory</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span>Level {memoryLevel}</span>
                <span>Score {memoryScore}</span>
                <span>Mistakes {memoryMistakes}</span>
                <span>Hints {memoryHintCount}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {grid.map((row, r) =>
                  row.map((cell, c) => {
                    const isTarget = targetGrid[r][c];
                    const showTarget = memoryPreview ? isTarget : cell;
                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => toggleCell(r, c)}
                        className={`h-12 w-12 rounded-lg border transition ${
                          showTarget
                            ? 'bg-primary/70 border-primary'
                            : 'bg-white border-neutral-200 hover:bg-neutral-50'
                        }`}
                      />
                    );
                  })
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={checkMemory}>
                  Check pattern
                </Button>
                <Button size="sm" variant="outline" onClick={() => resetMemoryRound(memoryLevel)}>
                  New pattern
                </Button>
                <Button size="sm" variant="ghost" onClick={useMemoryHint}>
                  Quick hint
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Timer className="w-5 h-5 text-primary" />
                    Orbit Beats (2D)
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Tap when the orb hits the bright window.
                  </p>
                </div>
                <Badge variant="secondary">Rhythm</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span>Score {orbitScore}</span>
                <span>Streak {orbitStreak}</span>
              </div>
              <div className="relative h-48 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <div className="absolute h-36 w-36 rounded-full border border-primary/30" />
                <div
                  className="absolute h-40 w-40 rounded-full border-4 border-transparent"
                  style={{
                    borderTopColor: 'rgba(124, 58, 237, 0.35)',
                    transform: `rotate(${orbitWindow.start}deg)`
                  }}
                />
                <div
                  className="absolute h-6 w-6 rounded-full bg-primary shadow-lg"
                  style={{ transform: `rotate(${orbitAngle}deg) translate(70px)` }}
                />
                <div className="absolute bottom-4 right-4 text-xs text-neutral-500">{orbitRunning ? 'Live' : 'Paused'}</div>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Speed</span>
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={orbitSpeed}
                  onChange={(e) => setOrbitSpeed(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => setOrbitRunning((prev) => !prev)}>
                  {orbitRunning ? 'Pause' : 'Start'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleOrbitTap}>
                  Tap!
                </Button>
                <Button size="sm" variant="ghost" onClick={resetOrbit}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border border-neutral-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Mountain className="w-5 h-5 text-primary" />
                    Isometric Steps (2.5D)
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Follow the glowing path in order.
                  </p>
                </div>
                <Badge variant="secondary">Sequence</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span>Level {isoLevel}</span>
                <span>Mistakes {isoMistakes}</span>
                <span>{isoPreview ? 'Preview' : `Step ${isoStep + 1}/${isoPath.length}`}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: ISO_TILES }).map((_, index) => {
                  const isActive = isoPath.includes(index);
                  const isNext = isoPath[isoStep] === index;
                  const preview = isoPreview && isActive;
                  return (
                    <button
                      key={`iso-${index}`}
                      onClick={() => handleIsoTap(index)}
                      className={`h-12 w-12 transform skew-y-[-12deg] border shadow-inner transition ${
                        preview
                          ? 'bg-primary/80 border-primary'
                          : isNext
                            ? 'bg-white border-primary ring-2 ring-primary/40'
                            : 'bg-gradient-to-br from-primary/20 to-accent-violet/30 border-white/60'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={resetIso}>
                  New climb
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <CircleDot className="w-5 h-5 text-primary" />
                    Balance Flow (2.5D)
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Keep the glow inside the calm zone.
                  </p>
                </div>
                <Badge variant="secondary">Focus</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span>Steady {Math.floor(balanceSteady / 2)}s</span>
                <span>{balanceRunning ? 'Running' : 'Paused'}</span>
              </div>
              <div className="relative h-44 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden">
                <div className="absolute inset-x-6 top-1/2 h-10 -translate-y-1/2 rounded-full bg-primary/20" />
                <div
                  className="absolute top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-primary shadow-lg"
                  style={{ transform: `translate(${balancePosition * 2.2}px, -50%)` }}
                />
                <div className="absolute bottom-4 left-6 text-xs text-neutral-500">Calm zone</div>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Control</span>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={balanceControl}
                  onChange={(e) => setBalanceControl(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={toggleBalance}>
                  {balanceRunning ? 'Pause' : 'Start'}
                </Button>
                <Button size="sm" variant="outline" onClick={resetBalance}>
                  Reset
                </Button>
              </div>
              {balanceSteady >= 16 && (
                <Badge className="bg-primary/10 text-primary">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Flow achieved
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-neutral-200">
          <CardContent className="p-6 space-y-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Waves className="w-5 h-5 text-primary" />
              More on the way
            </h2>
            <p className="text-sm text-neutral-600">
              Next up: a cooperative puzzle inside the community feed, plus a soft focus visualizer
              you can sync with your music.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
