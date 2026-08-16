import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { Link } from 'wouter';
import {
  Aperture,
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronRight,
  Clapperboard,
  Film,
  Image as ImageIcon,
  Layers,
  Maximize,
  Play,
  Scissors,
  Settings2,
  Sparkles,
  Type,
  UserCircle2,
  Video,
  Wand2,
  X,
  Zap,
} from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.72, ease: EASE } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

type IconType = React.ComponentType<{ className?: string }>;

function SectionKicker({ children }: { children: React.ReactNode }) {
  return <div className="section-kicker mb-5">{children}</div>;
}

function NodeChip({
  icon: Icon,
  label,
  tint = 'text-primary',
  small = false,
}: {
  icon: IconType;
  label: string;
  tint?: string;
  small?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 border border-border/80 bg-card/90 ${
        small ? 'px-2.5 py-1.5 text-[10px]' : 'px-3 py-2 text-xs'
      } font-medium shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md`}
    >
      <Icon className={`${small ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${tint}`} />
      <span>{label}</span>
    </div>
  );
}

function Navigation() {
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 80],
    ['rgba(14,16,24,0)', 'rgba(14,16,24,0.88)'],
  );
  const borderBottomColor = useTransform(
    scrollY,
    [0, 80],
    ['rgba(31,37,50,0)', 'rgba(55,63,82,0.8)'],
  );

  return (
    <motion.nav
      className="fixed left-0 right-0 top-0 z-50 flex h-[68px] items-center justify-between px-5 backdrop-blur-xl md:px-8"
      style={{ backgroundColor, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor }}
    >
      <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight" data-testid="link-home">
        <span className="flex h-7 w-7 items-center justify-center bg-primary text-primary-foreground">
          <Layers className="h-3.5 w-3.5" />
        </span>
        <span className="text-[17px]">Flows</span>
      </Link>
      <div className="hidden items-center gap-7 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground md:flex">
        <a href="#product" className="transition-colors hover:text-foreground">Product</a>
        <a href="#templates" className="transition-colors hover:text-foreground">Templates</a>
        <a href="#workflow" className="transition-colors hover:text-foreground">How it works</a>
      </div>
      <Link
        href="/canvas"
        className="group inline-flex items-center gap-2 border border-primary/40 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        data-testid="link-open-canvas-nav"
      >
        Open Canvas <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.nav>
  );
}

function WindowChrome({ label = 'flows / untitled canvas' }: { label?: string }) {
  return (
    <div className="flex h-9 items-center gap-2 border-b border-border/80 bg-card/70 px-3">
      <span className="h-2 w-2 rounded-full bg-[#ff6b65]" />
      <span className="h-2 w-2 rounded-full bg-[#f7c95a]" />
      <span className="h-2 w-2 rounded-full bg-[#62c778]" />
      <span className="ml-3 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">{label}</span>
      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
      <span className="font-mono text-[9px] text-muted-foreground">SAVED</span>
    </div>
  );
}

function CanvasNode({
  icon: Icon,
  label,
  meta,
  tint,
  className = '',
}: {
  icon: IconType;
  label: string;
  meta: string;
  tint: string;
  className?: string;
}) {
  return (
    <div className={`w-[134px] border border-border bg-background/95 p-2.5 shadow-[0_14px_30px_rgba(0,0,0,0.28)] ${className}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center bg-card ${tint}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="truncate text-[10px] font-semibold">{label}</span>
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </div>
      <div className="mb-1.5 h-1 w-[72%] rounded-full bg-muted" />
      <div className="h-1 w-[48%] rounded-full bg-muted/70" />
      <div className="mt-2 flex items-center justify-between font-mono text-[8px] text-muted-foreground">
        <span>{meta}</span><span>•••</span>
      </div>
    </div>
  );
}

function HeroCanvasPreview() {
  const reduced = useReducedMotion();
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 22, rotate: 1.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
        className="relative overflow-hidden border border-border/90 bg-card shadow-[0_35px_90px_rgba(0,0,0,0.45)]"
      >
        <WindowChrome label="flows / cinematic_sequence" />
        <div className="relative h-[360px] overflow-hidden bg-[#111521] bg-dot-grid sm:h-[420px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_44%,hsl(var(--primary)/0.14),transparent_42%)]" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 620 420" fill="none" aria-hidden="true">
            <path d="M183 107 C235 107 236 178 285 178" stroke="hsl(var(--primary) / .65)" strokeWidth="1.5" strokeDasharray="4 5" />
            <path d="M183 278 C235 278 235 208 285 208" stroke="hsl(35 95% 63% / .65)" strokeWidth="1.5" strokeDasharray="4 5" />
            <path d="M419 193 C455 193 459 142 486 142" stroke="hsl(270 75% 68% / .72)" strokeWidth="1.5" strokeDasharray="4 5" />
            <path d="M419 215 C457 215 460 275 486 275" stroke="hsl(145 60% 56% / .72)" strokeWidth="1.5" strokeDasharray="4 5" />
            {!reduced && (
              <>
                <circle r="3" fill="hsl(var(--primary))"><animateMotion dur="2.6s" repeatCount="indefinite" path="M183 107 C235 107 236 178 285 178" /></circle>
                <circle r="3" fill="hsl(35 95% 63%)"><animateMotion dur="2.6s" begin=".65s" repeatCount="indefinite" path="M183 278 C235 278 235 208 285 208" /></circle>
                <circle r="3" fill="hsl(270 75% 68%)"><animateMotion dur="2.2s" begin=".3s" repeatCount="indefinite" path="M419 193 C455 193 459 142 486 142" /></circle>
              </>
            )}
          </svg>
          <div className="absolute left-7 top-14 space-y-24">
            <CanvasNode icon={ImageIcon} label="Reference image" meta="IMAGE / 2.4 MB" tint="text-sky-400" />
            <CanvasNode icon={Type} label="Scene prompt" meta="TEXT / 128 TOKENS" tint="text-amber-300" />
          </div>
          <CanvasNode icon={Clapperboard} label="Director" meta="AGENT / READY" tint="text-orange-300" className="absolute left-1/2 top-[39%] -translate-x-1/2 border-primary/50" />
          <div className="absolute right-6 top-20 space-y-24">
            <CanvasNode icon={Film} label="LTX Pro" meta="VIDEO / 16:9" tint="text-violet-300" />
            <CanvasNode icon={Maximize} label="Upscale" meta="4K / 24 FPS" tint="text-emerald-300" />
          </div>
          <motion.div
            animate={reduced ? undefined : { y: [0, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-5 left-1/2 flex w-[208px] -translate-x-1/2 items-end gap-2 border border-border/90 bg-card p-2"
          >
            <div className="relative h-[60px] flex-1 overflow-hidden bg-[#25304b]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#df9c74,transparent_18%),linear-gradient(135deg,#283a62,#6b3c5d_60%,#111521)] animate-frame-drift" />
              <div className="absolute bottom-1 left-1.5 font-mono text-[8px] tracking-wider text-white/70">RESULT / 00:04</div>
            </div>
            <div className="flex h-[60px] w-9 flex-col items-center justify-center gap-1 border border-border text-[8px] text-muted-foreground">
              <Play className="h-3 w-3 text-primary" /><span>OPEN</span>
            </div>
          </motion.div>
        </div>
        <div className="flex h-8 items-center justify-between border-t border-border/80 bg-card px-3 font-mono text-[9px] text-muted-foreground">
          <span>5 nodes / 4 connections</span>
          <span className="text-primary">RUN WORKFLOW ↗</span>
        </div>
      </motion.div>
      <motion.div
        initial={reduced ? false : { opacity: 0, x: 16, y: 14 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 1, ease: EASE }}
        className="absolute -bottom-5 -right-3 flex items-center gap-2 border border-emerald-400/25 bg-[#18251f] px-3 py-2 shadow-xl sm:-right-8"
      >
        <span className="flex h-5 w-5 items-center justify-center bg-emerald-400/15 text-emerald-300"><Check className="h-3 w-3" /></span>
        <span className="text-[10px] font-medium">1 video generated</span>
        <span className="font-mono text-[9px] text-emerald-300">04.8s</span>
      </motion.div>
    </div>
  );
}

function DemoModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 p-5 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Flows workflow demo"
    >
      <motion.div initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative w-full max-w-3xl border border-border bg-card p-2 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center border border-border bg-background/80 text-muted-foreground hover:text-foreground" aria-label="Close demo" data-testid="button-close-demo">
          <X className="h-4 w-4" />
        </button>
        <div className="relative aspect-video overflow-hidden bg-[#151a2b]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_45%,#4255a6,transparent_32%),linear-gradient(120deg,#171b2b,#25233f_50%,#111521)]" />
          <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm"><Play className="ml-1 h-5 w-5 fill-white" /></div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">A workflow, in motion</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20"><motion.div initial={{ width: 0 }} animate={{ width: '38%' }} transition={{ duration: 1.5 }} className="h-full bg-primary" /></div>
        </div>
        <div className="flex items-center justify-between px-3 py-3">
          <span className="text-xs text-muted-foreground">Reference → Director → LTX Pro → Upscale</span>
          <span className="font-mono text-[10px] text-primary">00:04 / 00:11</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HeroSection() {
  const [showDemo, setShowDemo] = useState(false);
  const reduced = useReducedMotion();
  return (
    <>
      <section className="relative flex min-h-[100dvh] items-center overflow-hidden bg-background pb-20 pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_72%_42%,hsl(var(--primary)/0.16),transparent_40%),radial-gradient(ellipse_at_12%_76%,hsl(270_70%_45%/0.08),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.025]" />
        <div className="pointer-events-none absolute left-[7%] top-[22%] hidden md:block"><NodeChip icon={UserCircle2} label="Character" tint="text-emerald-300" /></div>
        <div className="pointer-events-none absolute bottom-[18%] left-[3%] hidden md:block"><NodeChip icon={Film} label="LTX Pro" tint="text-violet-300" small /></div>
        <div className="pointer-events-none absolute right-[10%] top-[18%] hidden md:block"><NodeChip icon={Clapperboard} label="Director" tint="text-orange-300" /></div>
        <div className="pointer-events-none absolute bottom-[22%] right-[7%] hidden md:block"><NodeChip icon={ImageIcon} label="Image Gen" tint="text-sky-300" small /></div>
        <div className="container relative z-10 mx-auto grid items-center gap-16 px-5 lg:grid-cols-[0.88fr_1.12fr] lg:gap-10 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-[650px]">
            <motion.div variants={reveal} className="mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">AI creative infrastructure</span>
            </motion.div>
            <motion.h1 variants={reveal} className="text-display max-w-[680px] text-[clamp(3.7rem,7.4vw,7.5rem)] leading-[0.88] text-foreground">
              Turn an idea
              <br />
              into a <em className="text-primary">sequence.</em>
            </motion.h1>
            <motion.p variants={reveal} className="mt-8 max-w-[500px] text-base leading-7 text-muted-foreground md:text-lg">
              Build AI video pipelines as naturally as you think them. Connect models, direct the scene, and iterate on one living canvas.
            </motion.p>
            <motion.div variants={reveal} className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/canvas" className="group inline-flex h-12 items-center gap-3 bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_14px_35px_hsl(var(--primary)/0.18)] transition-transform hover:-translate-y-0.5" data-testid="link-open-canvas-hero">
                Open Canvas <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button onClick={() => setShowDemo(true)} className="group inline-flex h-12 items-center gap-3 border border-border bg-card/50 px-5 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-card" data-testid="button-watch-demo">
                <span className="flex h-6 w-6 items-center justify-center border border-border group-hover:border-primary/50"><Play className="h-3 w-3 fill-current" /></span>
                Watch the workflow
              </button>
            </motion.div>
            <motion.div variants={reveal} className="mt-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> No credit card <span className="text-border">/</span> Start with a blank canvas
            </motion.div>
          </motion.div>
          <HeroCanvasPreview />
        </div>
      </section>
      <AnimatePresence>{showDemo && <DemoModal onClose={() => setShowDemo(false)} />}</AnimatePresence>
    </>
  );
}

const HOW_STEPS = [
  { num: '01', title: 'Bring the raw material', desc: 'Drop in a reference image, a line of dialogue, or just a half-formed thought.', icon: ImageIcon },
  { num: '02', title: 'Direct the sequence', desc: 'Let Director map the creative logic — then move every node until it feels right.', icon: Wand2 },
  { num: '03', title: 'Make it move', desc: 'Run, inspect, swap models, and keep the good parts. The canvas remembers the rest.', icon: Video },
];

function HowVisual({ activeStep, reduced }: { activeStep: number; reduced: boolean | null }) {
  return (
    <div className="relative h-full min-h-[450px] overflow-hidden bg-[#111521] bg-dot-grid">
      <div className="absolute left-5 top-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">canvas / live preview</div>
      <AnimatePresence mode="wait">
        {activeStep === 0 && (
          <motion.div key="raw" initial={reduced ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55, ease: EASE }} className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-48 w-64 overflow-hidden border border-sky-300/30 bg-[#1b2945] shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,#df9d76,transparent_16%),linear-gradient(145deg,#2c5277,#51416e_55%,#1a2036)]" />
              <div className="absolute inset-x-0 bottom-0 bg-background/75 p-3 backdrop-blur-sm"><div className="font-mono text-[9px] text-sky-300">REF_001 / 2048 × 1365</div><div className="mt-1 text-xs">midnight chase / frame 01</div></div>
              <div className="absolute left-3 top-3 border border-white/20 bg-black/20 px-2 py-1 font-mono text-[8px] text-white/70">DROP ASSET</div>
            </div>
            <div className="absolute bottom-[22%] right-[15%]"><NodeChip icon={Type} label="Prompt" tint="text-amber-300" small /></div>
          </motion.div>
        )}
        {activeStep === 1 && (
          <motion.div key="direct" initial={reduced ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55, ease: EASE }} className="absolute inset-0 flex items-center justify-center">
            <svg className="absolute h-full w-full" viewBox="0 0 650 450" fill="none" aria-hidden="true"><path d="M150 155 C255 155 230 224 308 224 M150 305 C255 305 230 244 308 244 M420 234 C490 234 470 160 520 160 M420 234 C490 234 470 315 520 315" stroke="hsl(var(--primary)/.65)" strokeWidth="1.5" strokeDasharray="5 5" /></svg>
            <div className="absolute left-[12%] top-[25%]"><NodeChip icon={ImageIcon} label="Reference" tint="text-sky-300" small /></div>
            <div className="absolute left-[12%] bottom-[25%]"><NodeChip icon={Type} label="Prompt" tint="text-amber-300" small /></div>
            <NodeChip icon={Clapperboard} label="Director" tint="text-orange-300" />
            <div className="absolute right-[12%] top-[27%]"><NodeChip icon={Film} label="LTX Pro" tint="text-violet-300" small /></div>
            <div className="absolute bottom-[24%] right-[12%]"><NodeChip icon={Maximize} label="Upscale" tint="text-emerald-300" small /></div>
          </motion.div>
        )}
        {activeStep === 2 && (
          <motion.div key="result" initial={reduced ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55, ease: EASE }} className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-[250px] w-[340px] overflow-hidden border border-primary/40 bg-[#27345a] shadow-[0_22px_70px_hsl(var(--primary)/.22)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,#efac82,transparent_17%),linear-gradient(120deg,#26385f,#743e59_66%,#121829)] animate-frame-drift" />
              <div className="absolute inset-0 bg-noise opacity-15 mix-blend-overlay" />
              <div className="absolute left-3 top-3 flex items-center gap-2 border border-white/20 bg-black/20 px-2 py-1 font-mono text-[8px] text-white/80"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> RENDER COMPLETE</div>
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between"><div><div className="text-xs font-medium">night / sequence 04</div><div className="font-mono text-[9px] text-white/55">LTX PRO · 24 FPS · 4.8 SEC</div></div><div className="flex h-7 w-7 items-center justify-center bg-primary"><Play className="h-3 w-3 fill-primary-foreground text-primary-foreground" /></div></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between border-t border-border/70 pt-3 font-mono text-[9px] text-muted-foreground"><span>STEP 0{activeStep + 1}</span><span>{activeStep === 2 ? 'OUTPUT READY' : 'EDITING WORKFLOW'}</span></div>
    </div>
  );
}

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start center', 'end center'] });
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => scrollYProgress.on('change', (v) => setActiveStep(v < 0.33 ? 0 : v < 0.66 ? 1 : 2)), [scrollYProgress]);

  return (
    <section id="workflow" ref={ref} className="relative bg-card/35 py-28 md:py-40">
      <div className="container mx-auto grid gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-8">
        <div className="h-[58vh] min-h-[460px] lg:sticky lg:top-[16vh]"><HowVisual activeStep={activeStep} reduced={useReducedMotion()} /></div>
        <div className="flex flex-col justify-center py-8">
          <SectionKicker>01 / The canvas loop</SectionKicker>
          <h2 className="text-display max-w-xl text-5xl leading-[0.95] md:text-7xl">A better way to find the <em className="text-primary">shot.</em></h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">Flows turns the messy middle of making video into something you can see, touch, and improve.</p>
          <div className="mt-16 space-y-0">
            {HOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className={`relative border-t border-border py-7 transition-opacity duration-500 ${activeStep === i ? 'opacity-100' : 'opacity-35'}`} data-testid={`step-${i + 1}`}>
                  <div className="flex gap-5">
                    <span className="font-mono text-xs text-primary">{step.num}</span>
                    <div className="flex-1"><div className="mb-2 flex items-center gap-3"><h3 className="text-xl font-semibold tracking-tight">{step.title}</h3><Icon className="h-4 w-4 text-muted-foreground" /></div><p className="max-w-md text-sm leading-6 text-muted-foreground">{step.desc}</p></div>
                    {activeStep === i && <ArrowDownRight className="h-5 w-5 shrink-0 text-primary" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function DirectorPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState('');
  const [stage, setStage] = useState(0);
  const prompt = 'a lone rider cuts through rain-soaked Tokyo, 35mm, blue hour';
  useEffect(() => {
    if (!inView || reduced) { if (inView && reduced) setTyped(prompt); return; }
    let index = 0;
    const timer = window.setInterval(() => { index += 1; setTyped(prompt.slice(0, index)); if (index >= prompt.length) window.clearInterval(timer); }, 38);
    return () => window.clearInterval(timer);
  }, [inView, reduced]);
  const runBuild = () => {
    setStage(1);
    window.setTimeout(() => setStage(2), 550);
    window.setTimeout(() => setStage(3), 1050);
    window.setTimeout(() => setStage(4), 1550);
  };
  const nodes = [
    { name: 'Director', icon: Clapperboard, tint: 'text-orange-300' },
    { name: 'Character', icon: UserCircle2, tint: 'text-emerald-300' },
    { name: 'LTX Pro', icon: Film, tint: 'text-violet-300' },
    { name: 'Upscale', icon: Maximize, tint: 'text-sky-300' },
  ];
  return (
    <div ref={ref} className="relative overflow-hidden border border-border bg-[#111521] shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
      <WindowChrome label="flows / director_agent" />
      <div className="relative p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center bg-orange-400/10 text-orange-300"><Sparkles className="h-4 w-4" /></span><div><div className="text-sm font-semibold">Director Agent</div><div className="font-mono text-[9px] text-muted-foreground">CREATIVE ORCHESTRATOR / ONLINE</div></div></div><span className="font-mono text-[9px] text-emerald-300">● READY</span></div>
        <div className="border border-border/80 bg-background/75 p-4"><div className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Describe the sequence</div><div className="min-h-[62px] text-sm leading-6 text-foreground/90">{typed}<span className="ml-0.5 inline-block h-4 w-1 bg-primary align-middle animate-cursor-blink" /></div><div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3"><span className="font-mono text-[9px] text-muted-foreground">{typed.length} / {prompt.length} CHARS</span><motion.button onClick={runBuild} whileTap={{ scale: 0.98 }} className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors ${stage > 0 ? 'bg-emerald-600' : 'bg-primary hover:bg-primary/90'}`} data-testid="button-build-workflow">{stage > 0 ? <Check className="h-3 w-3" /> : <Zap className="h-3 w-3" />}{stage > 0 ? 'Workflow built' : 'Build workflow'}</motion.button></div></div>
        <div className="mt-7"><div className="mb-3 flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Generated structure</span><span className="font-mono text-[9px] text-primary">{stage > 0 ? 'BUILDING…' : 'WAITING FOR PROMPT'}</span></div><div className="flex flex-wrap items-center gap-2">
          {nodes.map((node, i) => { const Icon = node.icon; const visible = stage >= i + 1; return <React.Fragment key={node.name}><AnimatePresence>{visible && <motion.div initial={reduced ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: EASE }} className="flex items-center gap-2 border border-border bg-card px-2.5 py-2 text-[10px]"><Icon className={`h-3.5 w-3.5 ${node.tint}`} />{node.name}</motion.div>}</AnimatePresence>{i < nodes.length - 1 && visible && <ChevronRight className="h-3 w-3 text-muted-foreground" />}</React.Fragment>; })}
        </div></div>
        <div className="mt-8 grid grid-cols-[1fr_auto] items-center border-t border-border/70 pt-4 font-mono text-[9px] text-muted-foreground"><span>MODEL ROUTING / AUTOMATIC</span><span className="text-emerald-300">{stage === 4 ? '4 NODES PLACED' : stage > 0 ? 'PLACING NODES' : '—'}</span></div>
      </div>
    </div>
  );
}

function DirectorSection() {
  return (
    <section id="product" className="bg-background py-28 md:py-36">
      <div className="container mx-auto grid items-center gap-14 px-5 lg:grid-cols-[1.12fr_0.88fr] lg:gap-24 lg:px-8">
        <DirectorPanel />
        <div className="max-w-xl">
          <SectionKicker>02 / Director AI</SectionKicker>
          <h2 className="text-display text-5xl leading-[0.94] md:text-7xl">Give it a feeling.<br /><em className="text-primary">Get a system.</em></h2>
          <p className="mt-7 text-lg leading-8 text-muted-foreground">Director translates creative language into a working production graph — choosing models, wiring the handoffs, and leaving the decisions visible.</p>
          <Link href="/canvas" className="group mt-8 inline-flex items-center gap-2 border-b border-primary/50 pb-2 text-sm font-semibold text-primary" data-testid="link-director-canvas">Try Director AI <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
        </div>
      </div>
    </section>
  );
}

function ImageVideoVisual() {
  const reduced = useReducedMotion();
  return <div className="relative h-full min-h-[280px] overflow-hidden bg-[#121827] bg-dot-grid"><div className="absolute left-[10%] top-1/2 h-[145px] w-[34%] -translate-y-1/2 overflow-hidden border border-sky-300/30 bg-[#2d4560]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_34%_30%,#eaa17b,transparent_18%),linear-gradient(135deg,#263e62,#51405f)]" /><span className="absolute bottom-2 left-2 font-mono text-[8px] text-white/70">INPUT / STILL</span></div><div className="absolute left-[44%] top-1/2 h-px w-[12%] -translate-y-1/2 bg-primary/70" /><ArrowRight className="absolute left-[49%] top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><div className="absolute right-[8%] top-1/2 h-[175px] w-[38%] -translate-y-1/2 overflow-hidden border border-violet-300/35 bg-[#30416a]"><motion.div animate={reduced ? undefined : { scale: [1, 1.06, 1], x: [0, -4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute inset-[-5%] bg-[radial-gradient(circle_at_31%_27%,#f0aa82,transparent_15%),linear-gradient(120deg,#273e68,#713d5c_65%,#172033)]" /><div className="absolute inset-0 bg-noise opacity-15 mix-blend-overlay" /><div className="absolute bottom-2 left-2 right-2 flex items-center justify-between font-mono text-[8px] text-white/75"><span>OUTPUT / MOTION</span><span>00:04</span></div><motion.div animate={reduced ? undefined : { x: ['-20%', '110%'] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }} className="absolute left-0 top-0 h-full w-1/4 bg-white/10 blur-md" /></div></div>;
}

function CharacterVisual() {
  const reduced = useReducedMotion();
  return <div className="relative h-full min-h-[280px] overflow-hidden bg-[#151923]"><div className="absolute left-5 top-5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">identity lock / reference 01</div><div className="absolute left-1/2 top-[54%] grid w-[78%] -translate-x-1/2 -translate-y-1/2 grid-cols-3 gap-2">{[0, 1, 2, 3, 4, 5].map((i) => <motion.div key={i} initial={reduced ? false : { opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.45, ease: EASE }} className={`relative aspect-[1.15] overflow-hidden border ${i === 0 ? 'border-emerald-300/60' : 'border-border'} bg-[#263047]`}><div className={`absolute inset-0 ${i % 2 === 0 ? 'bg-[radial-gradient(circle_at_50%_33%,#d99479,transparent_18%),linear-gradient(145deg,#294267,#5e3d59)]' : 'bg-[radial-gradient(circle_at_54%_34%,#d69174,transparent_18%),linear-gradient(145deg,#43536c,#373b60)]'}`} /><div className="absolute bottom-1 left-1 font-mono text-[7px] text-white/70">SHOT 0{i + 1}</div>{i === 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />}</motion.div>)}</div><div className="absolute bottom-4 left-5 flex items-center gap-2 font-mono text-[9px] text-emerald-300"><Check className="h-3 w-3" /> FEATURES PRESERVED / 06 OF 06</div></div>;
}

function BatchVisual() {
  const reduced = useReducedMotion();
  return <div className="relative h-full min-h-[280px] overflow-hidden bg-[#121822] bg-dot-grid"><div className="absolute left-5 top-5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground"><Layers className="h-3 w-3 text-primary" /> batch queue / 12 frames</div><div className="absolute left-[15%] top-1/2 flex -translate-y-1/2 items-center">{[0, 1, 2, 3].map((i) => <motion.div key={i} animate={reduced ? undefined : { y: [0, i % 2 ? 8 : -8, 0], rotate: [0, i % 2 ? 2 : -2, 0] }} transition={{ duration: 4 + i * .2, repeat: Infinity, ease: 'easeInOut', delay: i * .12 }} className={`relative -ml-5 h-[132px] w-[155px] overflow-hidden border ${i === 1 ? 'z-20 border-primary/60' : 'z-10 border-border'} bg-[#273451] shadow-xl`}><div className={`absolute inset-0 ${['bg-[linear-gradient(135deg,#314f76,#793f59)]', 'bg-[linear-gradient(135deg,#5c426f,#315e62)]', 'bg-[linear-gradient(135deg,#725044,#294c71)]', 'bg-[linear-gradient(135deg,#314f76,#4f4a75)]'][i]}`} /><div className="absolute inset-0 bg-noise opacity-15 mix-blend-overlay" /><span className="absolute bottom-2 left-2 font-mono text-[8px] text-white/75">FRAME_0{i + 1}</span></motion.div>)}</div><div className="absolute bottom-5 right-5 border border-primary/30 bg-card/90 px-3 py-2 font-mono text-[9px] text-primary">RUNNING · 04 / 12</div></div>;
}

function EnhancementVisual() {
  const reduced = useReducedMotion();
  return <div className="relative h-full min-h-[280px] overflow-hidden bg-[#141821]"><div className="absolute left-5 top-5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">enhance / compare output</div><div className="absolute left-[12%] right-[12%] top-1/2 h-[150px] -translate-y-1/2 overflow-hidden border border-border bg-[#273451]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#dd9a79,transparent_16%),linear-gradient(135deg,#2e4a69,#6c405e)]" /><div className="absolute inset-0 bg-noise opacity-35 mix-blend-overlay" /><motion.div initial={{ width: '50%' }} whileInView={{ width: '100%' }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE }} className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-primary bg-[#2d4560]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#dd9a79,transparent_16%),linear-gradient(135deg,#202b40,#4a3c56)]" /><div className="absolute bottom-2 left-2 font-mono text-[8px] text-white/65">BEFORE / 720P</div></motion.div><div className="absolute bottom-2 right-2 font-mono text-[8px] text-white/75">AFTER / 4K</div><div className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background bg-primary"><ArrowRight className="h-3 w-3 text-primary-foreground" /></div></div><div className="absolute bottom-5 left-5 flex gap-2">{['DENOISE', 'UPSCALE', 'EXTEND'].map((tag) => <span key={tag} className="border border-border bg-card/80 px-2 py-1 font-mono text-[8px] text-muted-foreground">{tag}</span>)}</div></div>;
}

const SHOWCASES = [
  { index: '03A', title: 'Still frames that learn to move.', desc: 'Feed a reference into LTX Pro and keep the visual language intact from the first frame to the last.', visual: <ImageVideoVisual /> },
  { index: '03B', title: 'The same character, every scene.', desc: 'Lock the face, costume, and attitude once. Build a whole sequence without losing the thread.', visual: <CharacterVisual /> },
  { index: '03C', title: 'One idea. Twelve directions.', desc: 'Batch a prompt across shots, references, or styles and compare the whole edit in one glance.', visual: <BatchVisual /> },
  { index: '03D', title: 'The last mile is a node too.', desc: 'Upscale, clean up, extend, and export without leaving the canvas or breaking the chain.', visual: <EnhancementVisual /> },
];

function ShowcaseRow({ item, reverse }: { item: typeof SHOWCASES[number]; reverse: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: '-80px' });
  return <motion.div ref={ref} initial="hidden" animate={visible ? 'visible' : 'hidden'} variants={reveal} className={`grid items-stretch gap-0 border border-border bg-card/30 lg:grid-cols-[1.45fr_0.55fr] ${reverse ? 'lg:grid-cols-[0.55fr_1.45fr]' : ''}`}>{reverse ? <div className="order-2 lg:order-1 flex flex-col justify-center p-7 md:p-10"><div className="mb-5 font-mono text-[10px] tracking-[0.16em] text-primary">{item.index} / NODE FAMILY</div><h3 className="text-display max-w-sm text-4xl leading-[0.98] md:text-5xl">{item.title}</h3><p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">{item.desc}</p><Link href="/canvas" className="group mt-7 inline-flex w-fit items-center gap-2 border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-primary hover:text-primary" data-testid={`link-showcase-${item.index}`}>Explore node <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></Link></div> : null}<div className={`${reverse ? 'order-1 lg:order-2' : 'order-1'} min-h-[280px]`}>{item.visual}</div>{!reverse ? <div className="order-2 flex flex-col justify-center p-7 md:p-10"><div className="mb-5 font-mono text-[10px] tracking-[0.16em] text-primary">{item.index} / NODE FAMILY</div><h3 className="text-display max-w-sm text-4xl leading-[0.98] md:text-5xl">{item.title}</h3><p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">{item.desc}</p><Link href="/canvas" className="group mt-7 inline-flex w-fit items-center gap-2 border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-primary hover:text-primary" data-testid={`link-showcase-${item.index}`}>Explore node <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></Link></div> : null}</motion.div>;
}

function FeatureShowcaseSection() {
  return <section className="bg-card/35 py-28 md:py-36"><div className="container mx-auto px-5 lg:px-8"><div className="mb-14 grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-end"><div><SectionKicker>03 / Built for the edit</SectionKicker><h2 className="text-display text-5xl leading-[0.94] md:text-7xl">Make the machine<br /><em className="text-primary">part of the process.</em></h2></div><p className="max-w-md text-base leading-7 text-muted-foreground md:justify-self-end">Not a gallery of AI tricks. A working surface for the decisions between the prompt and the picture.</p></div><div className="space-y-5">{SHOWCASES.map((item, i) => <ShowcaseRow key={item.index} item={item} reverse={i % 2 === 1} />)}</div></div></section>;
}

const TEMPLATES = [
  { name: 'Image to Video', meta: '4 nodes', tint: 'text-sky-300', line: 'bg-sky-300', nodes: [ImageIcon, Film, Maximize] },
  { name: 'Character Study', meta: '6 nodes', tint: 'text-emerald-300', line: 'bg-emerald-300', nodes: [UserCircle2, Clapperboard, Video] },
  { name: 'Upscale & Extend', meta: '3 nodes', tint: 'text-amber-300', line: 'bg-amber-300', nodes: [Video, Scissors, Maximize] },
  { name: 'Batch Storyboard', meta: '8 nodes', tint: 'text-violet-300', line: 'bg-violet-300', nodes: [Type, Layers, Film] },
  { name: 'Lip Sync Dub', meta: '5 nodes', tint: 'text-pink-300', line: 'bg-pink-300', nodes: [Aperture, Type, Video] },
  { name: 'Director Sequence', meta: '7 nodes', tint: 'text-orange-300', line: 'bg-orange-300', nodes: [Wand2, Clapperboard, Film] },
];

function TemplateCard({ template, index }: { template: typeof TEMPLATES[number]; index: number }) {
  return <Link href="/canvas" className="group relative block h-[228px] w-[218px] shrink-0 overflow-hidden border border-border bg-background transition-transform duration-500 hover:-translate-y-2 hover:border-primary/50" data-testid={`link-template-${index}`}><div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_12%,hsl(var(--primary)/.11),transparent_35%)]" /><div className="relative flex h-[178px] flex-col justify-center px-7"><div className="absolute left-7 top-5 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-full ${template.line}`} /> {template.meta}</div><div className="relative flex flex-col items-center gap-2">{template.nodes.map((Icon, i) => <React.Fragment key={i}>{i > 0 && <div className="h-3 w-px bg-border" />}<div className={`flex w-[116px] items-center gap-2 border border-border bg-card px-2.5 py-2 text-[9px] shadow-lg transition-transform duration-500 group-hover:translate-x-1`}><Icon className={`h-3 w-3 ${template.tint}`} /><span>{['Reference', 'Director', 'Output'][i]}</span><span className="ml-auto h-1 w-1 rounded-full bg-emerald-400" /></div></React.Fragment>)}</div></div><div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-border bg-card/80 px-4 py-3 backdrop-blur"><span className="text-xs font-medium">{template.name}</span><ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" /></div></Link>;
}

function TemplateGallerySection() {
  return <section id="templates" className="overflow-hidden bg-background py-28 md:py-36"><div className="container mx-auto mb-12 grid gap-6 px-5 md:grid-cols-[1fr_auto] md:items-end md:px-8"><div><SectionKicker>04 / Start somewhere</SectionKicker><h2 className="text-display text-5xl leading-[0.94] md:text-7xl">Good ideas deserve<br /><em className="text-primary">a head start.</em></h2></div><p className="max-w-xs text-sm leading-6 text-muted-foreground md:text-right">Six production-ready canvases. Every one is editable down to the last connection.</p></div><div className="relative overflow-hidden"><div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-20 bg-gradient-to-r from-background to-transparent" /><div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-20 bg-gradient-to-l from-background to-transparent" /><div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused]">{[...TEMPLATES, ...TEMPLATES].map((template, i) => <TemplateCard key={`${template.name}-${i}`} template={template} index={i} />)}</div></div><div className="container mx-auto mt-10 px-5 text-center md:px-8"><Link href="/canvas" className="group inline-flex items-center gap-2 border-b border-border pb-2 text-sm font-medium hover:border-primary hover:text-primary" data-testid="link-browse-templates">Browse all templates <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div></section>;
}

const PIPELINE = [
  { name: 'Upload', detail: 'SOURCE', icon: ImageIcon, tint: 'text-sky-300', fill: 'bg-sky-300' },
  { name: 'Director', detail: 'ORCHESTRATE', icon: Clapperboard, tint: 'text-orange-300', fill: 'bg-orange-300' },
  { name: 'Character', detail: 'CONSISTENCY', icon: UserCircle2, tint: 'text-emerald-300', fill: 'bg-emerald-300' },
  { name: 'LTX Pro', detail: 'GENERATE', icon: Film, tint: 'text-violet-300', fill: 'bg-violet-300' },
  { name: 'Upscale', detail: 'DELIVER', icon: Maximize, tint: 'text-amber-300', fill: 'bg-amber-300' },
];

function WorkflowVisSection() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: '-100px' });
  const reduced = useReducedMotion();
  return <section ref={ref} className="relative overflow-hidden bg-[#111521] py-28 md:py-36"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_52%,hsl(var(--primary)/.10),transparent_42%)]" /><div className="container relative z-10 mx-auto px-5 lg:px-8"><div className="mx-auto max-w-3xl text-center"><SectionKicker>05 / The handoff</SectionKicker><h2 className="text-display text-5xl leading-[0.94] md:text-7xl">From raw signal<br /><em className="text-primary">to final frame.</em></h2><p className="mx-auto mt-6 max-w-lg text-base leading-7 text-muted-foreground">Every handoff is explicit. Every model is replaceable. The creative direction stays yours.</p></div><div className="mt-20 overflow-x-auto pb-5 hide-scrollbar"><div className="mx-auto flex min-w-[980px] items-center justify-center px-5">{PIPELINE.map((node, i) => { const Icon = node.icon; const last = i === PIPELINE.length - 1; return <React.Fragment key={node.name}><motion.div initial={reduced ? false : { opacity: 0, y: 22 }} animate={visible ? { opacity: 1, y: 0 } : undefined} transition={{ delay: i * .12, duration: .65, ease: EASE }} className={`relative w-[156px] border bg-card p-4 ${i === 1 ? 'border-orange-300/60' : 'border-border'}`}><div className="mb-10 flex items-start justify-between"><span className={`flex h-8 w-8 items-center justify-center bg-background ${node.tint}`}><Icon className="h-4 w-4" /></span><span className="font-mono text-[8px] text-muted-foreground">0{i + 1}</span></div><div className="text-sm font-semibold">{node.name}</div><div className="mt-1 font-mono text-[8px] tracking-[0.13em] text-muted-foreground">{node.detail}</div><div className="mt-4 h-1 bg-muted">{visible && <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: .7 + i * .25, duration: .5, ease: EASE }} className={`h-full ${node.fill}`} />}</div>{visible && !reduced && <motion.span animate={{ opacity: [0, 1, 0], scale: [0.7, 1, 0.7] }} transition={{ delay: 1 + i * .5, duration: 1.5, repeat: Infinity, repeatDelay: 2.4 }} className={`absolute right-3 top-3 h-1.5 w-1.5 rounded-full ${node.fill}`} />}</motion.div>{!last && <div className="relative h-px w-[48px] shrink-0 bg-border"><motion.div initial={{ width: 0 }} animate={visible ? { width: '100%' } : undefined} transition={{ delay: .55 + i * .15, duration: .45, ease: EASE }} className={`h-full ${node.fill}`} />{visible && !reduced && <span className={`animate-particle-flow absolute -top-[2px] left-0 h-1 w-1 rounded-full ${node.fill}`} style={{ animationDelay: `${i * .3}s` }} />}</div>}</React.Fragment>; })}</div></div><div className="mx-auto mt-12 flex max-w-xl items-center justify-between border-y border-border/70 py-4 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground"><span>One canvas / five handoffs</span><span className="flex items-center gap-2 text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Pipeline healthy</span></div></div></section>;
}

function CountUp({ to, active }: { to: number; active: boolean }) {
  const [count, setCount] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!active) return;
    if (reduced) { setCount(to); return; }
    let current = 0;
    const timer = window.setInterval(() => { current += Math.max(1, Math.ceil(to / 28)); setCount(Math.min(current, to)); if (current >= to) window.clearInterval(timer); }, 34);
    return () => window.clearInterval(timer);
  }, [active, reduced, to]);
  return <>{count}</>;
}

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: '-80px' });
  return <section ref={ref} className="bg-background py-20 md:py-28"><div className="container mx-auto px-5 lg:px-8"><div className="hairline mb-12" /><div className="grid gap-10 md:grid-cols-3 md:gap-0">{[{ value: 18, label: 'Node types', note: 'from prompt to polish' }, { value: 16, label: 'Templates', note: 'ready to make yours' }, { value: 1, label: 'Living canvas', note: 'for the whole sequence' }].map((stat, i) => <div key={stat.label} className={`relative text-center ${i > 0 ? 'md:border-l md:border-border' : ''}`}><div className="text-display text-7xl leading-none text-foreground md:text-8xl">{visible ? <CountUp to={stat.value} active={visible} /> : 0}<span className="text-primary">.</span></div><div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em]">{stat.label}</div><div className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{stat.note}</div><div className="mx-auto mt-5 h-px w-8 bg-primary/60" /></div>)}</div><div className="hairline mt-12" /></div></section>;
}

function CtaSection() {
  return <section className="relative overflow-hidden bg-card py-32 md:py-44"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/.16),transparent_48%)]" /><div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.025]" /><div className="container relative z-10 mx-auto px-5 text-center lg:px-8"><SectionKicker>06 / Make the first frame</SectionKicker><h2 className="text-display mx-auto max-w-3xl text-6xl leading-[0.88] md:text-8xl">The next scene<br /><em className="text-primary">starts here.</em></h2><p className="mx-auto mt-7 max-w-md text-base leading-7 text-muted-foreground">A blank canvas, a strange idea, and every model you need to see it through.</p><Link href="/canvas" className="group mt-9 inline-flex h-14 items-center gap-3 bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_18px_45px_hsl(var(--primary)/.2)] transition-transform hover:-translate-y-1" data-testid="link-open-canvas-cta">Open Canvas <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div></section>;
}

function Footer() {
  return <footer className="border-t border-border bg-background py-7"><div className="container mx-auto flex flex-col items-center justify-between gap-4 px-5 text-[10px] text-muted-foreground sm:flex-row lg:px-8"><Link href="/" className="flex items-center gap-2 font-semibold text-foreground" data-testid="link-footer-home"><span className="flex h-5 w-5 items-center justify-center bg-primary text-primary-foreground"><Layers className="h-3 w-3" /></span>Flows</Link><span className="font-mono uppercase tracking-[0.12em]">A canvas for the in-between</span><span>© {new Date().getFullYear()} Flows Studio</span></div></footer>;
}

export default function LandingPage() {
  return <div className="min-h-[100dvh] bg-background font-sans text-foreground selection:bg-primary/30"><Navigation /><main><HeroSection /><HowItWorksSection /><DirectorSection /><FeatureShowcaseSection /><TemplateGallerySection /><WorkflowVisSection /><StatsSection /><CtaSection /></main><Footer /></div>;
}