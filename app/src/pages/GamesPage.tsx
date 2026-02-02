import { useEffect, useMemo, useState } from 'react';
import { Gamepad2, Sparkles, Waves, Grid, Mountain, CircleDot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { applySeo } from '@/lib/seo';

const GRID_SIZE = 6;
const ISO_TILES = 12;
const FLOW_TARGET_MIN = 18;
const FLOW_TARGET_MAX = 24;

function createGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => false)
  );
}

function toggleCell(grid: boolean[][], row: number, col: number) {
  const next = grid.map((r) => [...r]);
  next[row][col] = !next[row][col];
  return next;
}

function randomTarget() {
  const grid = createGrid();
  for (let i = 0; i < 10; i += 1) {
    const r = Math.floor(Math.random() * GRID_SIZE);
    const c = Math.floor(Math.random() * GRID_SIZE);
    grid[r][c] = true;
  }
  return grid;
}

function createIsoPath() {
  const tiles = Array.from({ length: ISO_TILES }, (_, index) => index);
  for (let i = tiles.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

export function GamesPage() {
  const [grid, setGrid] = useState(() => createGrid());
  const [target, setTarget] = useState(() => randomTarget());
  const [elapsed, setElapsed] = useState(0);
  const [breathStep, setBreathStep] = useState(0);
  const [orbitalSpeed, setOrbitalSpeed] = useState(6);
  const [isoPath, setIsoPath] = useState(() => createIsoPath());
  const [isoStep, setIsoStep] = useState(0);
  const [isoMistakes, setIsoMistakes] = useState(0);
  const [flowProgress, setFlowProgress] = useState(0);
  const [flowSpeed, setFlowSpeed] = useState(0.6);
  const [flowRunning, setFlowRunning] = useState(false);
  const [flowStartTime, setFlowStartTime] = useState<number | null>(null);
  const [flowResult, setFlowResult] = useState<string | null>(null);

  const matchCount = useMemo(() => {
    let matches = 0;
    for (let r = 0; r < GRID_SIZE; r += 1) {
      for (let c = 0; c < GRID_SIZE; c += 1) {
        if (grid[r][c] === target[r][c]) matches += 1;
      }
    }
    return matches;
  }, [grid, target]);

  useEffect(() => {
    applySeo({
      title: 'NeuroNest Games - Calm 2D & 2.5D Mindfulness',
      description:
        'Play neurodivergent-friendly mini games with calm visuals and clear goals. No account required.',
      canonical: 'https://arcane-waters-46868-5bf57db34e8e.herokuapp.com/games'
    });
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsed((prev) => prev + 1);
      setBreathStep((prev) => (prev + 1) % 12);
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!flowRunning) return undefined;
    const interval = window.setInterval(() => {
      setFlowProgress((prev) => Math.min(100, prev + flowSpeed));
    }, 100);
    return () => window.clearInterval(interval);
  }, [flowRunning, flowSpeed]);

  useEffect(() => {
    if (flowProgress < 100) return;
    if (!flowStartTime) return;
    const elapsedSeconds = Math.round((Date.now() - flowStartTime) / 1000);
    const withinRange = elapsedSeconds >= FLOW_TARGET_MIN && elapsedSeconds <= FLOW_TARGET_MAX;
    setFlowResult(
      withinRange
        ? `Great pace! You finished in ${elapsedSeconds}s.`
        : elapsedSeconds < FLOW_TARGET_MIN
          ? `A bit fast (${elapsedSeconds}s). Try slowing down.`
          : `A bit slow (${elapsedSeconds}s). Try speeding up.`
    );
    setFlowRunning(false);
  }, [flowProgress, flowStartTime]);

  const breatheLabel = ['Inhale', 'Hold', 'Exhale', 'Hold'][Math.floor(breathStep / 3)];

  const isoNextTarget = isoPath[isoStep];
  const isoCompleted = isoStep >= isoPath.length;

  const handleIsoTap = (index: number) => {
    if (isoCompleted) return;
    if (index === isoNextTarget) {
      setIsoStep((prev) => prev + 1);
    } else {
      setIsoMistakes((prev) => prev + 1);
      setIsoStep(0);
    }
  };

  const resetIso = () => {
    setIsoPath(createIsoPath());
    setIsoStep(0);
    setIsoMistakes(0);
  };

  const startFlow = () => {
    setFlowProgress(0);
    setFlowResult(null);
    setFlowRunning(true);
    setFlowStartTime(Date.now());
  };

  const resetFlow = () => {
    setFlowProgress(0);
    setFlowResult(null);
    setFlowRunning(false);
    setFlowStartTime(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <div className="space-y-4">
          <Badge className="bg-primary/10 text-primary">
            <Gamepad2 className="w-4 h-4 mr-2" />
            NeuroNest Games
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-dark">
            Calm, focus-friendly games
          </h1>
          <p className="text-neutral-600 text-lg">
            A mix of 2D and 2.5D experiences built for clarity, low pressure, and gentle challenge.
            No account needed.
          </p>
        </div>

        <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
          <Card className="overflow-hidden border border-neutral-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Grid className="w-5 h-5 text-primary" />
                    Pattern Drift (2D)
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Match the calm target grid. Tap tiles to align.
                  </p>
                </div>
                <Badge variant="secondary">Focus</Badge>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Matches: {matchCount}/{GRID_SIZE * GRID_SIZE}</span>
                  <span>Session: {elapsed}s</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {grid.map((row, r) =>
                    row.map((cell, c) => (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => setGrid(toggleCell(grid, r, c))}
                        className={`h-10 w-10 rounded-lg border ${
                          cell ? 'bg-primary/70 border-primary' : 'bg-white border-neutral-200'
                        }`}
                      />
                    ))
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTarget(randomTarget())}
                  >
                    New Target
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGrid(createGrid())}
                  >
                    Reset Grid
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Waves className="w-5 h-5 text-primary" />
                Breath Orbit (2D)
              </h2>
              <p className="text-sm text-neutral-500">
                Follow the orb. A gentle pace for steady breathing.
              </p>
              <div className="relative h-48 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <div
                  className="absolute h-32 w-32 rounded-full border border-primary/30"
                  style={{ transform: `scale(${1 + breathStep / 24})` }}
                />
                <div className="absolute text-sm font-medium text-neutral-600">{breatheLabel}</div>
                <div
                  className="absolute h-6 w-6 rounded-full bg-primary shadow-lg"
                  style={{
                    transform: `rotate(${elapsed * orbitalSpeed}deg) translate(50px)`
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Speed</span>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={orbitalSpeed}
                  onChange={(e) => setOrbitalSpeed(Number(e.target.value))}
                />
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
                    Tap the tiles in order to climb the light path.
                  </p>
                </div>
                <Badge variant="secondary">2.5D</Badge>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }).map((_, index) => (
                  <button
                    key={`iso-${index}`}
                    onClick={() => handleIsoTap(index)}
                    className={`h-12 w-12 transform skew-y-[-12deg] border shadow-inner transition ${
                      isoPath.slice(0, isoStep).includes(index)
                        ? 'bg-primary border-primary'
                        : index === isoNextTarget
                          ? 'bg-white border-primary/60 ring-2 ring-primary/40'
                          : 'bg-gradient-to-br from-primary/30 to-accent-violet/30 border-white/60'
                    }`}
                  >
                    <span className="sr-only">Tile {index + 1}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>
                  Step {Math.min(isoStep + 1, isoPath.length)} / {isoPath.length}
                </span>
                <span>Mistakes: {isoMistakes}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={resetIso}>
                  New Path
                </Button>
                {isoCompleted && (
                  <Badge className="bg-primary/10 text-primary">Completed</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <CircleDot className="w-5 h-5 text-primary" />
                    Focus Flow (2.5D)
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Guide a glowing bead along the ridge - steady, not rushed.
                  </p>
                </div>
                <Badge variant="secondary">2.5D</Badge>
              </div>
              <div className="relative h-40 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden">
                <div className="absolute bottom-4 left-6 h-16 w-40 rounded-full bg-primary/20 blur-2xl" />
                <div className="absolute bottom-6 left-10 h-8 w-24 rotate-2 rounded-full bg-primary/40" />
                <div className="absolute bottom-8 left-20 h-6 w-16 rounded-full bg-accent-violet/40" />
                <div
                  className="absolute bottom-10 h-6 w-6 rounded-full bg-primary shadow-lg transition-transform"
                  style={{ transform: `translateX(${flowProgress * 1.8}px)` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Target time: {FLOW_TARGET_MIN}-{FLOW_TARGET_MAX}s</span>
                <span>{Math.round(flowProgress)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={startFlow} disabled={flowRunning}>
                  {flowRunning ? 'Gliding' : 'Start Glide'}
                </Button>
                <Button size="sm" variant="outline" onClick={resetFlow}>
                  Reset
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Speed</span>
                <input
                  type="range"
                  min="0.3"
                  max="1.2"
                  step="0.05"
                  value={flowSpeed}
                  onChange={(e) => setFlowSpeed(Number(e.target.value))}
                />
              </div>
              {flowResult && (
                <Badge className="bg-primary/10 text-primary">{flowResult}</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-neutral-200">
          <CardContent className="p-6 space-y-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              More on the way
            </h2>
            <p className="text-sm text-neutral-600">
              Next up: a cooperative puzzle mode inside the community feed and a low-stim visualizer
              you can pair with your music.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
