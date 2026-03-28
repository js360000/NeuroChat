import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  Gamepad2, Crosshair, Wind, Palette, Cpu, KeyRound,
  RotateCcw, Play, Pause, Trophy, Zap, Eye,
  Maximize, Minimize, RectangleHorizontal, Square,
  Route, ChevronDown, Sparkles, Brain, Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════
   Game Shell — Resizable / fullscreen wrapper
   ═══════════════════════════════════════════ */

type GameSize = 'default' | 'wide' | 'fullscreen'

function GameShell({ children, defaultColSpan }: { children: React.ReactNode; defaultColSpan?: string }) {
  const [size, setSize] = useState<GameSize>('default')
  const shellRef = useRef<HTMLDivElement>(null)

  const enterFullscreen = useCallback(() => {
    if (!shellRef.current) return
    if (shellRef.current.requestFullscreen) shellRef.current.requestFullscreen()
    setSize('fullscreen')
  }, [])

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen()
    setSize('default')
  }, [])

  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) setSize(prev => prev === 'fullscreen' ? 'default' : prev) }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  return (
    <div ref={shellRef} className={cn(
      'relative transition-all duration-300',
      size === 'fullscreen' ? 'fixed inset-0 z-[100] bg-background overflow-auto' : size === 'wide' ? 'lg:col-span-2' : (defaultColSpan || '')
    )}>
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
        <button
          onClick={() => { if (size === 'wide') setSize('default'); else if (size === 'default') setSize('wide'); else exitFullscreen() }}
          className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur flex items-center justify-center transition-colors"
        >
          {size === 'wide' || size === 'fullscreen' ? <Square className="w-3.5 h-3.5 text-white/80" /> : <RectangleHorizontal className="w-3.5 h-3.5 text-white/80" />}
        </button>
        <button
          onClick={() => { if (size === 'fullscreen') exitFullscreen(); else enterFullscreen() }}
          className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur flex items-center justify-center transition-colors"
        >
          {size === 'fullscreen' ? <Minimize className="w-3.5 h-3.5 text-white/80" /> : <Maximize className="w-3.5 h-3.5 text-white/80" />}
        </button>
      </div>
      <div className={cn(size === 'fullscreen' && 'h-full flex flex-col [&>*]:flex-1 [&>*]:h-full', size === 'wide' && '')}>
        {children}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Game Section — Collapsible category
   ═══════════════════════════════════════════ */

function GameSection({ icon: Icon, title, description, count, children, defaultOpen = false }: {
  icon: React.ElementType; title: string; description: string; count: number; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>(defaultOpen ? 'auto' : 0)

  useEffect(() => {
    if (!contentRef.current) return
    if (open) {
      const h = contentRef.current.scrollHeight
      setHeight(h)
      const timer = setTimeout(() => setHeight('auto'), 300)
      return () => clearTimeout(timer)
    } else {
      setHeight(contentRef.current.scrollHeight)
      requestAnimationFrame(() => setHeight(0))
    }
  }, [open])

  return (
    <div className="space-y-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 group cursor-pointer text-left">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">{count}</span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>
        <ChevronDown className={cn('w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0', open && 'rotate-180')} />
      </button>
      <div ref={contentRef} className="overflow-hidden transition-[height] duration-300 ease-in-out" style={{ height: typeof height === 'number' ? `${height}px` : 'auto' }}>
        <div className="space-y-5">{children}</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   1. NEBULA DRIFT — Three.js 3D particle dodge
   ═══════════════════════════════════════════ */

function NebulaDrift() {
  const mountRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef({ x: 0, y: 0, score: 0, alive: true, speed: 0.008, time: 0 })
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [alive, setAlive] = useState(true)
  const [started, setStarted] = useState(false)
  const rafRef = useRef(0)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  const init = useCallback(() => {
    if (!mountRef.current) return
    const el = mountRef.current
    const w = el.clientWidth, h = el.clientHeight
    if (rendererRef.current) { rendererRef.current.dispose(); rendererRef.current.domElement.remove() }
    cancelAnimationFrame(rafRef.current)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x050510, 0.035)
    const camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 120)
    camera.position.z = 6
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(w, h); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setClearColor(0x050510)
    el.appendChild(renderer.domElement); rendererRef.current = renderer

    scene.add(new THREE.AmbientLight(0x223355, 0.6))
    const dirLight = new THREE.DirectionalLight(0x6688cc, 0.8); dirLight.position.set(2, 3, 5); scene.add(dirLight)

    const playerGroup = new THREE.Group()
    const playerMat = new THREE.MeshStandardMaterial({ color: 0x44ddff, emissive: 0x2299cc, emissiveIntensity: 1.5, metalness: 0.3, roughness: 0.2 })
    playerGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), playerMat))
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x44ddff, transparent: true, opacity: 0.12 })
    playerGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), haloMat))
    const playerGlow = new THREE.PointLight(0x44ddff, 3, 4); playerGroup.add(playerGlow)
    scene.add(playerGroup)

    const trailCount = 60
    const trailGeo = new THREE.BufferGeometry()
    const trailPositions = new Float32Array(trailCount * 3)
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
    scene.add(new THREE.Points(trailGeo, new THREE.PointsMaterial({ color: 0x44ddff, size: 0.04, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })))
    let trailIdx = 0

    const obstacles: THREE.Mesh[] = []
    const obsColors = [0xff4466, 0xff6644, 0xee3388, 0xff5555, 0xcc3366]
    for (let i = 0; i < 25; i++) {
      const size = 0.08 + Math.random() * 0.2
      const geo = new THREE.OctahedronGeometry(size, Math.random() > 0.5 ? 1 : 0)
      const color = obsColors[Math.floor(Math.random() * obsColors.length)]
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4, transparent: true, opacity: 0.85, metalness: 0.6, roughness: 0.3 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, -(Math.random() * 50 + 8))
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      scene.add(mesh); obstacles.push(mesh)
    }

    const addStars = (count: number, spread: number, depth: number, size: number, opacity: number) => {
      const geo = new THREE.BufferGeometry(); const pos = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) { pos[i*3]=(Math.random()-0.5)*spread; pos[i*3+1]=(Math.random()-0.5)*spread; pos[i*3+2]=-(Math.random()*depth) }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size, transparent: true, opacity, blending: THREE.AdditiveBlending })))
    }
    addStars(400, 30, 80, 0.015, 0.3); addStars(200, 25, 60, 0.035, 0.5); addStars(50, 20, 50, 0.06, 0.7)

    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: [0x1a0a30, 0x0c1e3a, 0x0d0828, 0x15102a][i%4], transparent: true, opacity: 0.15+Math.random()*0.1, side: THREE.DoubleSide })
      const cloud = new THREE.Mesh(new THREE.PlaneGeometry(12+Math.random()*10, 8+Math.random()*6), mat)
      cloud.position.set((Math.random()-0.5)*15, (Math.random()-0.5)*10, -(30+Math.random()*40)); cloud.rotation.z=Math.random()*Math.PI
      scene.add(cloud)
    }

    const state = stateRef.current; state.score=0; state.alive=true; state.speed=0.008; state.time=0
    const handlePointer = (e: PointerEvent) => { const rect=el.getBoundingClientRect(); state.x=((e.clientX-rect.left)/rect.width-0.5)*8; state.y=-((e.clientY-rect.top)/rect.height-0.5)*6 }
    const handleTouch = (e: TouchEvent) => { e.preventDefault(); const t=e.touches[0]; const rect=el.getBoundingClientRect(); state.x=((t.clientX-rect.left)/rect.width-0.5)*8; state.y=-((t.clientY-rect.top)/rect.height-0.5)*6 }
    el.addEventListener('pointermove', handlePointer); el.addEventListener('touchmove', handleTouch, { passive: false })

    const animate = () => {
      if (!state.alive) return; state.time += 0.016
      playerGroup.position.x += (state.x - playerGroup.position.x) * 0.06
      playerGroup.position.y += (state.y - playerGroup.position.y) * 0.06
      playerGroup.rotation.z = -(state.x - playerGroup.position.x) * 0.15
      playerGlow.intensity = 2.5 + Math.sin(state.time * 3) * 0.8
      haloMat.opacity = 0.1 + Math.sin(state.time * 2.5) * 0.05
      trailPositions[trailIdx*3]=playerGroup.position.x+(Math.random()-0.5)*0.05; trailPositions[trailIdx*3+1]=playerGroup.position.y+(Math.random()-0.5)*0.05; trailPositions[trailIdx*3+2]=playerGroup.position.z-0.3
      trailIdx=(trailIdx+1)%trailCount; trailGeo.attributes.position.needsUpdate=true
      state.speed = 0.008 + state.score * 0.00012
      for (const obs of obstacles) {
        obs.position.z += state.speed * 60; obs.rotation.x += 0.005; obs.rotation.y += 0.008
        if (obs.position.z > 6) { obs.position.z = -(30+Math.random()*40); obs.position.x=(Math.random()-0.5)*8; obs.position.y=(Math.random()-0.5)*6; state.score+=1; setScore(state.score) }
        if (playerGroup.position.distanceTo(obs.position) < 0.35) { state.alive=false; setAlive(false); setBest(prev=>Math.max(prev,state.score)); return }
      }
      camera.position.x = Math.sin(state.time*0.3)*0.15; camera.position.y = Math.cos(state.time*0.2)*0.1
      renderer.render(scene, camera); rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(rafRef.current); el.removeEventListener('pointermove', handlePointer); el.removeEventListener('touchmove', handleTouch); renderer.dispose(); renderer.domElement.remove() }
  }, [])

  useEffect(() => { if (started) return init() }, [started, init])
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); if (rendererRef.current) rendererRef.current.dispose() }, [])
  const restart = () => { setAlive(true); setScore(0); setStarted(false); setTimeout(() => setStarted(true), 50) }

  return (
    <div className="rounded-2xl overflow-hidden glass h-full">
      <div ref={mountRef} className="relative w-full touch-none h-full" style={{ minHeight: 'clamp(320px, 45vw, 480px)' }}>
        <div className="absolute top-0 inset-x-0 z-10 pointer-events-none">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2"><Crosshair className="w-4 h-4 text-cyan-400" /><span className="text-white/90 font-semibold text-sm tracking-wider">NEBULA DRIFT</span><span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">3D</span></div>
            <div className="flex items-center gap-4 text-xs"><span className="text-cyan-300 font-mono">{score}</span><span className="text-white/40">BEST {best}</span></div>
          </div>
        </div>
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'radial-gradient(ellipse at center, rgba(5,5,16,0.7) 0%, rgba(5,5,16,0.95) 100%)' }}>
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full border border-cyan-500/30 flex items-center justify-center mx-auto" style={{ boxShadow: '0 0 40px rgba(68,221,255,0.15)' }}><Crosshair className="w-7 h-7 text-cyan-400" /></div>
              <div><h3 className="text-white text-xl font-bold tracking-wide">Nebula Drift</h3><p className="text-white/40 text-sm mt-1">Navigate through the particle field</p></div>
              <button onClick={() => setStarted(true)} className="px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-sm font-medium flex items-center gap-2 mx-auto"><Play className="w-4 h-4" /> Launch</button>
              <p className="text-white/30 text-[10px]">Mouse or touch to steer</p>
            </div>
          </div>
        )}
        {!alive && started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'radial-gradient(ellipse at center, rgba(20,5,10,0.8) 0%, rgba(5,5,16,0.95) 100%)' }}>
            <div className="space-y-5 text-center">
              <p className="text-white/40 text-xs uppercase tracking-widest">Drift ended</p>
              <p className="text-4xl font-bold text-white">{score}</p>
              {score >= best && score > 0 && <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs"><Trophy className="w-3.5 h-3.5" /> New best!</div>}
              <button onClick={restart} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-medium flex items-center gap-2 mx-auto"><RotateCcw className="w-4 h-4" /> Retry</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   2. CHROMATIC SHIFT — HSL colour matching
   ═══════════════════════════════════════════ */

function randHsl() { return { h: Math.floor(Math.random() * 360), s: 30 + Math.floor(Math.random() * 50), l: 30 + Math.floor(Math.random() * 40) } }
function hslDist(a: { h: number; s: number; l: number }, b: { h: number; s: number; l: number }) {
  const dh = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)) / 180; const ds = Math.abs(a.s - b.s) / 100; const dl = Math.abs(a.l - b.l) / 100
  return Math.sqrt(dh * dh + ds * ds + dl * dl)
}
function toHslStr(c: { h: number; s: number; l: number }) { return `hsl(${c.h},${c.s}%,${c.l}%)` }

function ChromaticShift() {
  const [target, setTarget] = useState(randHsl)
  const [mix, setMix] = useState({ h: 180, s: 50, l: 50 })
  const [totalScore, setTotalScore] = useState(0)
  const [round, setRound] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15)
  const [running, setRunning] = useState(false)
  const timerRef = useRef<number | null>(null)

  const accuracy = Math.max(0, Math.round((1 - hslDist(target, mix) / 1.73) * 100))
  const timeBonus = Math.round(timeLeft * 2)

  const startRound = () => { setTarget(randHsl()); setMix({ h: 180, s: 50, l: 50 }); setSubmitted(false); setTimeLeft(15); setRunning(true) }
  useEffect(() => {
    if (!running) return
    timerRef.current = window.setInterval(() => { setTimeLeft(t => { if (t <= 1) { setRunning(false); setSubmitted(true); return 0 }; return t - 1 }) }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running])
  const submit = () => { setRunning(false); setSubmitted(true); if (timerRef.current) clearInterval(timerRef.current); setTotalScore(p => p + accuracy + timeBonus) }
  const next = () => { setRound(r => r + 1); startRound() }
  const reset = () => { setTotalScore(0); setRound(1); startRound() }

  const sliders = [
    { key: 'h' as const, label: 'Hue', min: 0, max: 360 },
    { key: 's' as const, label: 'Saturation', min: 0, max: 100 },
    { key: 'l' as const, label: 'Lightness', min: 0, max: 100 },
  ]

  return (
    <div className="rounded-2xl glass p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold flex items-center gap-2"><Palette className="w-5 h-5 text-primary" /> Chromatic Shift</h2><p className="text-sm text-muted-foreground">Match the target colour against the clock</p></div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">Visual</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground"><span>Round {round}</span><span>Score: {totalScore}</span>{running && <span className="font-mono text-primary">{timeLeft}s</span>}</div>
      {!running && !submitted ? (
        <div className="flex flex-col items-center gap-4 py-6"><p className="text-sm text-muted-foreground">Match HSL colours under time pressure</p><button onClick={startRound} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2"><Play className="w-4 h-4" /> Start</button></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><div className="h-20 sm:h-24 rounded-xl border border-border" style={{ backgroundColor: toHslStr(target) }} /><p className="text-[11px] text-center text-muted-foreground">Target</p></div>
            <div className="space-y-1"><div className="h-20 sm:h-24 rounded-xl border border-border" style={{ backgroundColor: toHslStr(mix) }} /><p className="text-[11px] text-center text-muted-foreground">Your mix</p></div>
          </div>
          {!submitted ? (
            <div className="space-y-3">
              {sliders.map(s => (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold w-10 text-muted-foreground">{s.label.slice(0, 3)}</span>
                  <input type="range" min={s.min} max={s.max} value={mix[s.key]} onChange={e => setMix(p => ({ ...p, [s.key]: Number(e.target.value) }))} className="flex-1 accent-primary" />
                  <span className="text-xs text-muted-foreground w-8 text-right font-mono">{mix[s.key]}</span>
                </div>
              ))}
              <button onClick={submit} className="w-full px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Lock in</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className={cn('rounded-xl border p-4 text-center space-y-1', accuracy >= 85 ? 'border-green-500/30 bg-green-500/5' : accuracy >= 60 ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5')}>
                <p className="text-3xl font-bold">{accuracy}%</p><p className="text-xs text-muted-foreground">+{timeBonus} time bonus</p>
              </div>
              <div className="flex gap-2">
                <button onClick={next} className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Next round</button>
                <button onClick={reset} className="p-2 rounded-xl glass hover:bg-muted/30"><RotateCcw className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   3. NEURAL SEQUENCE — Simon Says memory
   ═══════════════════════════════════════════ */

const SEQ_TILES = [
  { idle: 'bg-rose-500/40', lit: 'bg-rose-400 ring-2 ring-rose-300' },
  { idle: 'bg-sky-500/40', lit: 'bg-sky-400 ring-2 ring-sky-300' },
  { idle: 'bg-amber-500/40', lit: 'bg-amber-400 ring-2 ring-amber-300' },
  { idle: 'bg-emerald-500/40', lit: 'bg-emerald-400 ring-2 ring-emerald-300' },
  { idle: 'bg-violet-500/40', lit: 'bg-violet-400 ring-2 ring-violet-300' },
  { idle: 'bg-orange-500/40', lit: 'bg-orange-400 ring-2 ring-orange-300' },
]

function NeuralSequence() {
  const [sequence, setSequence] = useState<number[]>([])
  const [input, setInput] = useState<number[]>([])
  const [lit, setLit] = useState<number | null>(null)
  const [phase, setPhase] = useState<'idle' | 'showing' | 'input' | 'fail'>('idle')
  const [level, setLevel] = useState(0)
  const [bestLevel, setBestLevel] = useState(0)
  const [combo, setCombo] = useState(0)
  const [score, setScore] = useState(0)
  const timeoutRef = useRef<number | null>(null)

  const showSeq = useCallback((seq: number[], speed: number) => {
    setPhase('showing'); setInput([])
    let i = 0
    const run = () => {
      if (i < seq.length) { setLit(seq[i]); timeoutRef.current = window.setTimeout(() => { setLit(null); i++; timeoutRef.current = window.setTimeout(run, speed * 0.4) }, speed) }
      else setPhase('input')
    }
    timeoutRef.current = window.setTimeout(run, 400)
  }, [])

  const start = () => { const first = [Math.floor(Math.random() * 6)]; setSequence(first); setLevel(1); setScore(0); setCombo(0); showSeq(first, 500) }

  const handleTap = (idx: number) => {
    if (phase !== 'input') return; setLit(idx); setTimeout(() => setLit(null), 150)
    const next = [...input, idx]; setInput(next); const step = next.length - 1
    if (next[step] !== sequence[step]) { setPhase('fail'); setBestLevel(b => Math.max(b, level)); setCombo(0); return }
    if (next.length === sequence.length) {
      const newLevel = level + 1; const newCombo = combo + 1
      setLevel(newLevel); setCombo(newCombo); setScore(s => s + newLevel * 10 * Math.min(newCombo, 5))
      const newSeq = [...sequence, Math.floor(Math.random() * 6)]; setSequence(newSeq)
      timeoutRef.current = window.setTimeout(() => showSeq(newSeq, Math.max(200, 500 - newLevel * 25)), 600)
    }
  }

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])

  return (
    <div className="rounded-2xl glass p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold flex items-center gap-2"><Cpu className="w-5 h-5 text-primary" /> Neural Sequence</h2><p className="text-sm text-muted-foreground">Memorise and replay the pattern</p></div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">Memory</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground"><span>Lvl {level}</span><span>Best {bestLevel}</span><span>Score {score}</span>{combo > 1 && <span className="text-primary font-semibold">{combo}x combo</span>}</div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mx-auto">
        {SEQ_TILES.map((tile, idx) => (
          <button key={idx} onClick={() => handleTap(idx)} disabled={phase !== 'input'}
            className={cn('w-full aspect-square min-h-[72px] rounded-xl transition-all duration-150', lit === idx ? tile.lit : tile.idle, phase === 'input' ? 'cursor-pointer active:scale-95' : 'cursor-default')} />
        ))}
      </div>
      <div className="text-center text-xs text-muted-foreground">
        {phase === 'idle' && 'Press start to begin'}{phase === 'showing' && 'Watch carefully...'}{phase === 'input' && `Step ${input.length + 1} of ${sequence.length}`}{phase === 'fail' && `Game over — reached level ${level}`}
      </div>
      <button onClick={start} disabled={phase === 'showing'} className="w-full px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">
        {phase === 'idle' ? <><Play className="w-3.5 h-3.5" /> Start</> : <><RotateCcw className="w-3.5 h-3.5" /> {phase === 'fail' ? 'Retry' : 'Restart'}</>}
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════
   4. BREATH SYNC — Breathing pacer with rings
   ═══════════════════════════════════════════ */

const BREATH_MODES = {
  box: { label: 'Box 4-4-4-4', steps: [4, 4, 4, 4], labels: ['Inhale', 'Hold', 'Exhale', 'Hold'] },
  relax: { label: 'Relax 4-7-8', steps: [4, 7, 8, 0], labels: ['Inhale', 'Hold', 'Exhale', ''] },
  focus: { label: 'Focus 5-5', steps: [5, 0, 5, 0], labels: ['Inhale', '', 'Exhale', ''] },
} as const

function BreathSync() {
  const [mode, setMode] = useState<keyof typeof BREATH_MODES>('box')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [cycles, setCycles] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const m = BREATH_MODES[mode]
  const totalCycle = (m.steps as readonly number[]).reduce((a, b) => a + b, 0)
  const cyclePos = elapsed % totalCycle
  let phase = 0, phaseElapsed = cyclePos
  for (let i = 0; i < m.steps.length; i++) { if (m.steps[i] === 0) { phase++; continue }; if (phaseElapsed < m.steps[i]) { phase = i; break }; phaseElapsed -= m.steps[i]; phase = i + 1 }
  if (phase >= m.steps.length) phase = 0
  const phaseDuration = m.steps[phase] || 1
  const phaseProgress = phaseElapsed / phaseDuration
  const phaseLabel = running ? m.labels[phase] : 'Ready'
  const ringScale = phase === 0 ? 0.5 + phaseProgress * 0.5 : phase === 2 ? 1 - phaseProgress * 0.5 : phase === 1 ? 1 : 0.5

  useEffect(() => {
    if (!running) return
    const prevElapsed = { value: elapsed }
    intervalRef.current = window.setInterval(() => {
      setElapsed(e => { const next = +(e + 0.05).toFixed(2); if (Math.floor(next / totalCycle) > Math.floor(prevElapsed.value / totalCycle)) setCycles(c => c + 1); prevElapsed.value = next; return next })
    }, 50)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, totalCycle, elapsed])

  const phaseColors = [
    { ring: '168, 85%, 45%', bg: 'rgba(45, 190, 170, 0.12)', text: 'text-teal-600' },
    { ring: '38, 92%, 50%', bg: 'rgba(240, 170, 30, 0.12)', text: 'text-amber-600' },
    { ring: '350, 75%, 55%', bg: 'rgba(220, 80, 90, 0.12)', text: 'text-rose-600' },
    { ring: '240, 60%, 55%', bg: 'rgba(90, 80, 200, 0.12)', text: 'text-indigo-500' },
  ]
  const pc = running ? phaseColors[phase] || phaseColors[0] : { ring: '220, 15%, 60%', bg: 'rgba(140,140,160,0.08)', text: 'text-neutral-500' }

  return (
    <div className="rounded-2xl glass p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold flex items-center gap-2"><Wind className="w-5 h-5 text-primary" /> Breath Sync</h2><p className="text-sm text-muted-foreground">Follow the rings, sync your breathing</p></div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">Focus</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(BREATH_MODES).map(([key, val]) => (
          <button key={key} onClick={() => { if (!running) setMode(key as keyof typeof BREATH_MODES) }}
            className={cn('text-[11px] px-3 py-1.5 rounded-full border transition font-medium', mode === key ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:bg-muted')}>
            {val.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center py-6 flex-1">
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
          <div className="absolute w-60 h-60 sm:w-64 sm:h-64 rounded-full flex items-center justify-center transition-all duration-700 ease-in-out"
            style={{ backgroundColor: pc.bg, transform: `scale(${running ? ringScale : 0.75})`, boxShadow: running ? `0 0 40px hsl(${pc.ring} / 0.25), 0 0 80px hsl(${pc.ring} / 0.1)` : 'none', border: `2px solid hsl(${pc.ring} / 0.3)` }}>
            <span className={cn('text-lg font-bold text-center leading-tight transition-colors duration-500', pc.text)}>{phaseLabel}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground"><span>Cycles: {cycles}</span><span>{Math.floor(elapsed)}s elapsed</span></div>
      <div className="flex gap-2">
        <button onClick={() => setRunning(r => !r)} className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5">
          {running ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Start</>}
        </button>
        <button onClick={() => { setRunning(false); setElapsed(0); setCycles(0) }} className="p-2 rounded-xl glass hover:bg-muted/30"><RotateCcw className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   5. CIPHER — Substitution cipher puzzle
   ═══════════════════════════════════════════ */

const CIPHER_WORDS = [
  { word: 'RESILIENCE', hint: 'Ability to recover from setbacks' },
  { word: 'EMPATHY', hint: "Understanding another's feelings" },
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
]

function buildCipher() {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const shuffled = [...alpha]
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] }
  for (let i = 0; i < alpha.length; i++) { if (shuffled[i] === alpha[i]) { const swap = (i + 1) % alpha.length; [shuffled[i], shuffled[swap]] = [shuffled[swap], shuffled[i]] } }
  const map: Record<string, string> = {}; alpha.forEach((l, i) => { map[l] = shuffled[i] }); return map
}

function Cipher() {
  const [wordIdx, setWordIdx] = useState(() => Math.floor(Math.random() * CIPHER_WORDS.length))
  const [cipherMap, setCipherMap] = useState(buildCipher)
  const [guesses, setGuesses] = useState<Record<string, string>>({})
  const [solved, setSolved] = useState(false)
  const [reveals, setReveals] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const current = CIPHER_WORDS[wordIdx]
  const encrypted = current.word.split('').map(l => cipherMap[l] || l)
  const uniqueLetters = [...new Set(current.word.split(''))]

  useEffect(() => {
    const allCorrect = current.word.split('').every((l, i) => guesses[encrypted[i]] === l)
    if (allCorrect && Object.keys(guesses).length >= uniqueLetters.length) { setSolved(true); setStreak(s => s + 1) }
  }, [guesses, current.word, encrypted, uniqueLetters.length])

  const handleGuess = (encLetter: string, guess: string) => { const upper = guess.toUpperCase(); if (upper.length > 1) return; setGuesses(g => ({ ...g, [encLetter]: upper })) }

  const revealLetter = () => {
    const unrevealed = uniqueLetters.filter(l => { const enc = Object.entries(cipherMap).find(([, v]) => v === cipherMap[l]); return enc && guesses[enc[0]] !== l })
    if (unrevealed.length === 0) return
    const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)]
    setGuesses(g => ({ ...g, [cipherMap[pick]]: pick })); setReveals(r => r + 1)
  }

  const nextWord = () => {
    const next = (wordIdx + 1 + Math.floor(Math.random() * (CIPHER_WORDS.length - 1))) % CIPHER_WORDS.length
    setWordIdx(next); setCipherMap(buildCipher()); setGuesses({}); setSolved(false); setShowHint(false); setReveals(0)
  }

  return (
    <div className="rounded-2xl glass p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary" /> Cipher</h2><p className="text-sm text-muted-foreground">Crack the substitution cipher</p></div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">Logic</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground"><span>Streak: {streak}</span><span>Reveals: {reveals}</span>{showHint && <span className="text-primary">{current.hint}</span>}</div>
      <div className="flex flex-wrap gap-2 justify-center">
        {encrypted.map((encLetter, i) => {
          const original = current.word[i]; const guess = guesses[encLetter] || ''; const correct = guess === original
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-mono text-muted-foreground">{encLetter}</span>
              <input type="text" maxLength={1} value={guess} onChange={e => handleGuess(encLetter, e.target.value)} disabled={solved}
                className={cn('w-9 h-9 sm:w-10 sm:h-10 text-center text-lg font-bold rounded-lg border-2 bg-transparent outline-none transition-colors',
                  solved ? 'border-green-500/50 text-green-600' : correct ? 'border-primary/50 text-primary' : guess ? 'border-red-400/50 text-red-500' : 'border-border text-foreground focus:border-primary'
                )} />
            </div>
          )
        })}
      </div>
      {solved && <div className="flex items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-sm font-medium text-green-600"><Trophy className="w-4 h-4" /> Decoded: {current.word}</div>}
      <div className="flex gap-2 flex-wrap">
        {solved ? (
          <button onClick={nextWord} className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Next cipher</button>
        ) : (
          <>
            <button onClick={revealLetter} className="px-3 py-2 rounded-xl glass text-sm font-medium flex items-center gap-1.5 hover:bg-muted/30"><Eye className="w-3.5 h-3.5" /> Reveal letter</button>
            <button onClick={() => setShowHint(true)} disabled={showHint} className="px-3 py-2 rounded-xl glass text-sm hover:bg-muted/30 disabled:opacity-50">Hint</button>
          </>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   6. VOID RUNNER — Three.js endless runner
   ═══════════════════════════════════════════ */

function VoidRunner() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [alive, setAlive] = useState(true)
  const [started, setStarted] = useState(false)
  const rafRef = useRef(0)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const stateRef = useRef({ lane: 1, targetLane: 1, playerX: 0, speed: 0.08, distance: 0, obstacles: [] as THREE.Mesh[], orbs: [] as THREE.Mesh[], alive: true, score: 0, nextSpawn: 30 })

  const init = useCallback(() => {
    if (!mountRef.current) return
    const el = mountRef.current; const w = el.clientWidth; const h = el.clientHeight
    if (rendererRef.current) { rendererRef.current.dispose(); rendererRef.current.domElement.remove() }
    cancelAnimationFrame(rafRef.current)

    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0a1a, 8, 30)
    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100); camera.position.set(0, 2.5, 5); camera.lookAt(0, 0.5, -5)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); renderer.setSize(w, h); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setClearColor(0x0a0a1a)
    el.appendChild(renderer.domElement); rendererRef.current = renderer

    scene.add(new THREE.AmbientLight(0x223344, 0.4))
    const headlight = new THREE.PointLight(0x44ddff, 1.5, 15); headlight.position.set(0, 2, 3); scene.add(headlight)

    const grid = new THREE.Mesh(new THREE.PlaneGeometry(8, 60, 8, 60), new THREE.MeshBasicMaterial({ color: 0x0a0a1a, wireframe: true }))
    grid.rotation.x = -Math.PI / 2; grid.position.z = -25; scene.add(grid)

    ;[-1.5, -0.5, 0.5, 1.5].forEach(x => {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 0.01, 5), new THREE.Vector3(x, 0.01, -50)])
      scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x2244aa, transparent: true, opacity: 0.4 })))
    })
    ;[-2, 2].forEach(x => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 60), new THREE.MeshStandardMaterial({ color: 0x4400ff, emissive: 0x4400ff, emissiveIntensity: 0.8 }))
      rail.position.set(x, 0.15, -25); scene.add(rail)
    })

    const craftGroup = new THREE.Group()
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0x44ddff, emissive: 0x2299cc, emissiveIntensity: 1.5, metalness: 0.5, roughness: 0.2 }))
    body.rotation.x = -Math.PI / 2; craftGroup.add(body)
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff6622, transparent: true, opacity: 0.8 })
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), glowMat); glow.position.z = 0.35; craftGroup.add(glow)
    craftGroup.position.set(0, 0.3, 2); scene.add(craftGroup)

    const starGeo = new THREE.BufferGeometry(); const starVerts = new Float32Array(500 * 3)
    for (let i = 0; i < 500; i++) { starVerts[i*3]=(Math.random()-0.5)*40; starVerts[i*3+1]=3+Math.random()*15; starVerts[i*3+2]=-10-Math.random()*30 }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starVerts, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.5 })))

    const s = stateRef.current; s.lane=1; s.targetLane=1; s.playerX=0; s.speed=0.08; s.distance=0; s.alive=true; s.score=0; s.nextSpawn=30; s.obstacles=[]; s.orbs=[]
    const laneX = (l: number) => (l - 1) * 1

    const spawnObstacle = () => {
      const lane = Math.floor(Math.random() * 3)
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.3), new THREE.MeshStandardMaterial({ color: 0xff2244, emissive: 0xff1133, emissiveIntensity: 0.8, metalness: 0.3, roughness: 0.4 }))
      mesh.position.set(laneX(lane), 0.3, -25); scene.add(mesh); s.obstacles.push(mesh)
    }
    const spawnOrb = () => {
      const lane = Math.floor(Math.random() * 3)
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffdd44, emissive: 0xffaa00, emissiveIntensity: 1.5, metalness: 0.2, roughness: 0.3 }))
      mesh.position.set(laneX(lane), 0.4, -25); scene.add(mesh); s.orbs.push(mesh)
    }

    const onKey = (e: KeyboardEvent) => { if (!s.alive) return; if (e.key==='ArrowLeft'||e.key==='a') s.targetLane=Math.max(0,s.targetLane-1); if (e.key==='ArrowRight'||e.key==='d') s.targetLane=Math.min(2,s.targetLane+1) }
    let touchStartX = 0
    const onTouchStart = (e: TouchEvent) => { touchStartX = e.touches[0].clientX }
    const onTouchEnd = (e: TouchEvent) => { if (!s.alive) return; const dx=e.changedTouches[0].clientX-touchStartX; if (dx>30) s.targetLane=Math.min(2,s.targetLane+1); else if (dx<-30) s.targetLane=Math.max(0,s.targetLane-1) }
    const onClick = (e: MouseEvent) => { if (!s.alive) return; const rect=el.getBoundingClientRect(); const relX=(e.clientX-rect.left)/rect.width; if (relX<0.4) s.targetLane=Math.max(0,s.targetLane-1); else if (relX>0.6) s.targetLane=Math.min(2,s.targetLane+1) }
    window.addEventListener('keydown', onKey); el.addEventListener('touchstart', onTouchStart, { passive: true }); el.addEventListener('touchend', onTouchEnd, { passive: true }); el.addEventListener('click', onClick)

    let frameCount = 0
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate); if (!s.alive) return; frameCount++
      s.distance += s.speed; s.speed = 0.08 + s.distance * 0.0003; s.score = Math.floor(s.distance * 5)
      if (frameCount % 6 === 0) setScore(s.score)
      const targetX = laneX(s.targetLane); s.playerX += (targetX - s.playerX) * 0.15
      craftGroup.position.x = s.playerX; craftGroup.rotation.z = (targetX - s.playerX) * -0.5; headlight.position.x = s.playerX
      grid.position.z = -25 + (s.distance % 1)
      glow.scale.setScalar(0.8 + Math.sin(frameCount * 0.2) * 0.3); (glowMat as THREE.MeshBasicMaterial).opacity = 0.6 + Math.sin(frameCount * 0.3) * 0.3

      if (s.distance > s.nextSpawn) { spawnObstacle(); if (Math.random() < 0.6) spawnOrb(); const gap = Math.max(3, 8 - s.distance * 0.01); s.nextSpawn = s.distance + gap + Math.random() * gap * 0.5 }

      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const ob = s.obstacles[i]; ob.position.z += s.speed; ob.rotation.y += 0.03; ob.rotation.x += 0.02
        if (ob.position.z > 1.5 && ob.position.z < 2.8 && Math.abs(ob.position.x - s.playerX) < 0.45) { s.alive=false; setAlive(false); setBest(b=>Math.max(b,s.score)); return }
        if (ob.position.z > 6) { scene.remove(ob); ob.geometry.dispose(); s.obstacles.splice(i, 1) }
      }
      for (let i = s.orbs.length - 1; i >= 0; i--) {
        const orb = s.orbs[i]; orb.position.z += s.speed; orb.rotation.y += 0.08
        if (orb.position.z > 1.5 && orb.position.z < 2.8 && Math.abs(orb.position.x - s.playerX) < 0.5) { scene.remove(orb); orb.geometry.dispose(); s.orbs.splice(i,1); s.score+=50; setScore(s.score); continue }
        if (orb.position.z > 6) { scene.remove(orb); orb.geometry.dispose(); s.orbs.splice(i, 1) }
      }
      renderer.render(scene, camera)
    }; animate()

    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('keydown', onKey); el.removeEventListener('touchstart', onTouchStart); el.removeEventListener('touchend', onTouchEnd); el.removeEventListener('click', onClick); renderer.dispose(); renderer.domElement.remove() }
  }, [])

  useEffect(() => { if (started) return init() }, [started, init])
  const restart = () => { setAlive(true); setScore(0); setStarted(false); setTimeout(() => setStarted(true), 50) }

  return (
    <div className="rounded-2xl overflow-hidden glass h-full">
      <div ref={mountRef} className="relative w-full touch-none h-full" style={{ minHeight: 'clamp(320px, 45vw, 480px)' }}>
        <div className="absolute top-0 inset-x-0 z-10 pointer-events-none">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2"><Route className="w-4 h-4 text-emerald-400" /><span className="text-white/90 font-semibold text-sm tracking-wider">VOID RUNNER</span><span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">3D</span></div>
            <div className="flex items-center gap-4 text-xs"><span className="text-emerald-300 font-mono">{score}</span><span className="text-white/40">BEST {best}</span></div>
          </div>
        </div>
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'radial-gradient(ellipse at center, rgba(10,10,26,0.7) 0%, rgba(10,10,26,0.95) 100%)' }}>
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full border border-emerald-500/30 flex items-center justify-center mx-auto" style={{ boxShadow: '0 0 40px rgba(50,220,150,0.15)' }}><Route className="w-7 h-7 text-emerald-400" /></div>
              <div><h3 className="text-white text-xl font-bold tracking-wide">Void Runner</h3><p className="text-white/40 text-sm mt-1">Dodge barriers, collect orbs, survive the void</p></div>
              <button onClick={() => setStarted(true)} className="px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-sm font-medium flex items-center gap-2 mx-auto"><Play className="w-4 h-4" /> Run</button>
              <p className="text-white/30 text-[10px]">Click left/right, arrow keys, or swipe to steer</p>
            </div>
          </div>
        )}
        {!alive && started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'radial-gradient(ellipse at center, rgba(30,5,10,0.8) 0%, rgba(10,10,26,0.95) 100%)' }}>
            <div className="space-y-5 text-center">
              <p className="text-white/40 text-xs uppercase tracking-widest">Run ended</p>
              <p className="text-4xl font-bold text-white">{score}</p>
              {score >= best && score > 0 && <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs"><Trophy className="w-3.5 h-3.5" /> New best!</div>}
              <button onClick={restart} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-medium flex items-center gap-2 mx-auto"><RotateCcw className="w-4 h-4" /> Retry</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   PAGE SHELL
   ═══════════════════════════════════════════ */

export function GamesPage() {
  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Games</h1>
            <p className="text-xs text-muted-foreground">Focus. Play. Unwind.</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* 3D Adventures */}
        <GameSection icon={Sparkles} title="3D Adventures" description="Immersive Three.js experiences with particle physics and neon visuals" count={2} defaultOpen={false}>
          <div className="grid lg:grid-cols-2 gap-5">
            <GameShell defaultColSpan="lg:col-span-2"><NebulaDrift /></GameShell>
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            <GameShell defaultColSpan="lg:col-span-2"><VoidRunner /></GameShell>
          </div>
        </GameSection>

        {/* Mind Games */}
        <GameSection icon={Brain} title="Mind Games" description="Pattern recognition, colour matching, and cryptographic puzzles" count={3} defaultOpen={false}>
          <div className="grid lg:grid-cols-2 gap-5">
            <GameShell><ChromaticShift /></GameShell>
            <GameShell><NeuralSequence /></GameShell>
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            <GameShell defaultColSpan="lg:col-span-2"><Cipher /></GameShell>
          </div>
        </GameSection>

        {/* Wellness */}
        <GameSection icon={Heart} title="Wellness" description="Breathing exercises and calming tools for focus and relaxation" count={1} defaultOpen={false}>
          <div className="grid lg:grid-cols-2 gap-5">
            <GameShell defaultColSpan="lg:col-span-2"><BreathSync /></GameShell>
          </div>
        </GameSection>
      </div>
    </div>
  )
}
