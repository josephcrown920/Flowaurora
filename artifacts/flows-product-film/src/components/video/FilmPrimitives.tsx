import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Aperture, Clapperboard, Image as ImageIcon, Type, Video, WandSparkles } from 'lucide-react';

const ICONS = {
  Prompt: Type,
  'Image Upload': ImageIcon,
  Director: Clapperboard,
  'ModelArk Video': WandSparkles,
  'Video Output': Video,
} as const;

export function BrandBug({ light = false }: { light?: boolean }) {
  return (
    <div className={`absolute left-[4.5%] top-[4.5%] z-20 flex items-center gap-[.8vmin] ${light ? 'text-[#28252f]' : 'text-[#f3f0f8]'}`}>
      <span className="flex h-[2.2vmin] w-[2.2vmin] items-center justify-center rounded-[.45vmin] bg-[#8d72ed]">
        <span className="h-[.65vmin] w-[.65vmin] rounded-[.18vmin] bg-[#f1edff]" />
      </span>
      <span className="font-display text-[1.45vmin] font-semibold tracking-[-.04em]">FLOWS</span>
    </div>
  );
}

export function CanvasGrid({ opacity = 0.3 }: { opacity?: number }) {
  return <div className="film-grid absolute inset-0" style={{ opacity }} />;
}

export function Port({ side = 'right', color = '#b9a2ff' }: { side?: 'left' | 'right'; color?: string }) {
  return (
    <span
      className="absolute top-1/2 z-10 h-[.85vmin] w-[.85vmin] -translate-y-1/2 rounded-full border border-[#e3dff0]/65"
      style={{ [side]: '-.43vmin', backgroundColor: color } as CSSProperties}
    />
  );
}

export function NodeCard({
  title,
  x,
  y,
  w,
  h,
  accent = '#b79cff',
  icon,
  children,
  className = '',
  style,
  initial = { opacity: 0, scale: 0.82, y: 12 },
  animate = { opacity: 1, scale: 1, y: 0 },
  transition = { type: 'spring', stiffness: 260, damping: 25 },
}: {
  title: keyof typeof ICONS | string;
  x: string;
  y: string;
  w: string;
  h: string;
  accent?: string;
  icon?: 'aperture';
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  initial?: Record<string, number | string>;
  animate?: Record<string, number | string>;
  transition?: Record<string, unknown>;
}) {
  const Icon = title in ICONS ? ICONS[title as keyof typeof ICONS] : icon === 'aperture' ? Aperture : Type;
  return (
    <motion.div
      className={`film-node absolute flex flex-col overflow-visible ${className}`}
      style={{ left: x, top: y, width: w, height: h, ...style }}
      initial={initial}
      animate={animate}
      transition={transition as any}
    >
      <Port side="right" color={accent} />
      <div className="film-node-header flex h-[18%] shrink-0 items-center gap-[1vmin] px-[1.5vmin] text-[1.55vmin]">
        <Icon className="h-[1.8vmin] w-[1.8vmin] shrink-0" style={{ color: accent }} strokeWidth={1.8} />
        <span className="min-w-0 truncate">{title}</span>
        <span className="film-mono ml-auto text-[.72vmin] tracking-[.12em] text-[#7f7d8c]">NODE</span>
      </div>
      <div className="relative min-h-0 flex-1 p-[1.3vmin]">{children}</div>
    </motion.div>
  );
}

export function Wire({
  d,
  color = '#a88cff',
  width = 2,
  delay = 0,
  opacity = 0.9,
}: {
  d: string;
  color?: string;
  width?: number;
  delay?: number;
  opacity?: number;
}) {
  return (
    <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible" viewBox="0 0 1000 562" preserveAspectRatio="none">
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray="5 8"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity }}
        transition={{ duration: 1.05, delay, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.circle
        r="4.2"
        fill={color}
        initial={{ opacity: 0, offsetDistance: '0%' }}
        animate={{ opacity: [0, 1, 1, 0], offsetDistance: '100%' }}
        transition={{ duration: 2.2, delay: delay + 0.42, ease: 'linear', repeat: Infinity, repeatDelay: 0.65 }}
        style={{ offsetPath: `path('${d}')` }}
      />
    </svg>
  );
}

export function Tag({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="film-mono absolute z-10 text-[1.1vmin] uppercase text-[#b5b1c0]" style={style}>
      {children}
    </div>
  );
}

export function PromptField({ text, className = '' }: { text: ReactNode; className?: string }) {
  return (
    <div className={`flex h-full min-h-0 flex-col rounded-[1vmin] border border-[#d9d2ec]/10 bg-[#111116]/72 ${className}`}>
      <span className="p-[1.2vmin] font-display text-[1.7vmin] leading-[1.2] text-[#ece9f2]">{text}</span>
      <span className="film-mono mt-auto px-[1.2vmin] pb-[.8vmin] text-[.78vmin] text-[#777583]">TEXT TO IMAGE</span>
    </div>
  );
}

export function PreviewCanvas({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`relative h-full w-full overflow-hidden rounded-[1vmin] border border-[#d4c7f1]/10 ${compact ? 'bg-[#171923]' : 'bg-[#10131d]'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_28%,rgba(134,112,198,.36),transparent_38%),linear-gradient(145deg,#161924_5%,#272239_52%,#101116_100%)]" />
      <div className="absolute bottom-[18%] left-[-8%] h-[33%] w-[120%] rotate-[-7deg] bg-[#191a25] shadow-[0_-1px_24px_rgba(180,157,255,.13)]" />
      <motion.div
        className="absolute left-[57%] top-[18%] aspect-square w-[22%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#e4d8ff_0%,#a591dc_25%,#655c91_58%,#272332_100%)] shadow-[0_0_4vmin_rgba(184,159,255,.34)]"
        animate={{ y: [0, -4, 0], scale: [1, 1.025, 1] }}
        transition={{ duration: 3.6, ease: 'easeInOut', repeat: Infinity }}
      />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 180" aria-hidden="true">
        <motion.path
          d="M15 132 C70 104 82 145 128 117 S210 101 286 61"
          fill="none"
          stroke="rgba(208,195,255,.36)"
          strokeWidth="1"
          strokeDasharray="4 7"
          animate={{ strokeDashoffset: [0, -44] }}
          transition={{ duration: 3.5, ease: 'linear', repeat: Infinity }}
        />
      </svg>
      <div className="film-mono absolute bottom-[7%] left-[6%] text-[.76vmin] tracking-[.1em] text-white/35">FRAME 01 · 16:9</div>
    </div>
  );
}

export function CornerMark({ color = '#b8a0ff' }: { color?: string }) {
  return (
    <div className="absolute right-[4.4%] top-[4.6%] flex items-center gap-[.7vmin] text-[.8vmin] tracking-[.18em] text-white/35">
      <span className="h-[.7vmin] w-[.7vmin] rounded-[.2vmin]" style={{ background: color }} />
      FLOW STATE / 01
    </div>
  );
}
