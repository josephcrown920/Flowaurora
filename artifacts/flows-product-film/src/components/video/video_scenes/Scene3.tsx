import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { BrandBug, CanvasGrid, CornerMark, NodeCard, Tag } from '../FilmPrimitives';

const SCENES = [
  { no: '01', name: 'Establish', shape: 'wide' },
  { no: '02', name: 'Move', shape: 'close' },
  { no: '03', name: 'Resolve', shape: 'end' },
];

export function Scene3() {
  const [step, setStep] = useState(0);
  useSceneTimer([
    { time: 700, callback: () => setStep(1) },
    { time: 1350, callback: () => setStep(2) },
    { time: 2000, callback: () => setStep(3) },
    { time: 3000, callback: () => setStep(4) },
    { time: 3750, callback: () => setStep(5) },
  ]);
  return (
    <motion.section
      className="film-grain absolute inset-0 overflow-hidden bg-[#15141b]"
      initial={{ opacity: 1, clipPath: 'polygon(50% 0,100% 0,100% 100%,50% 100%)' }}
      animate={{ opacity: 1, clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)' }}
      exit={{ scale: 1.16, opacity: 0, filter: 'blur(12px)', transition: { duration: 0.42 } }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
    >
      <CanvasGrid opacity={0.17} />
      <BrandBug />
      <CornerMark color="#f3a77a" />
      <Tag style={{ left: '5%', top: '14%' }}>DIRECTOR AI</Tag>

      <motion.div
        className="absolute left-[5%] top-[24%] z-10 w-[31%] font-display text-[6.1vmin] font-medium leading-[.98] tracking-[-.06em] text-[#f0edf5]"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.55 }}
      >
        One brief.<br /><span className="text-[#f0a678]">A whole sequence.</span>
      </motion.div>

      <NodeCard title="Director" x="5%" y="56%" w="31%" h="30%" accent="#f0a678" transition={{ delay: 0.15, type: 'spring', stiffness: 260 }}>
        <div className="absolute inset-x-[5%] top-[8%] bottom-[12%] rounded-[.7vmin] border border-white/[.08] bg-[#14131a] px-[1vmin] py-[.8vmin]">
          <span className="film-mono text-[.73vmin] text-[#f1a77a]/75">STORY / SCRIPT</span>
          <p className="mt-[.7vmin] font-body text-[1.25vmin] leading-snug text-[#c7c2ce]">A cinematic pan<br />over the scene.</p>
        </div>
        <span className="film-mono absolute bottom-[2%] left-[5%] text-[.73vmin] text-[#96919c]">3 SCENES QUEUED</span>
      </NodeCard>

      <div className={`absolute z-10 flex items-center gap-[1.6vmin] ${step >= 4 ? 'left-[9%] top-[25%] w-[84%] -translate-y-1/2' : 'left-[41%] top-[17%] h-[68%] flex-col'}`}>
        {SCENES.map((scene, index) => (
          <motion.div
            key={scene.no}
            className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[1.1vmin] border border-[#dbd2eb]/12 bg-[#25232c] shadow-[0_1.6vmin_4vmin_rgba(0,0,0,.32)]"
            initial={{ opacity: 0, rotateY: 28, scale: 0.8, x: 24 }}
            animate={step >= index + 1 ? { opacity: 1, rotateY: 0, scale: 1, x: 0 } : {}}
            transition={{ type: 'spring', stiffness: 210, damping: 22, delay: index * 0.04 }}
            style={{ transformPerspective: 1000, height: step >= 4 ? '100%' : `${31 + index * 2}%`, marginLeft: step < 4 && index === 1 ? '1vmin' : 0 }}
          >
            <div className="film-mono flex items-center justify-between border-b border-white/[.07] px-[1vmin] py-[.8vmin] text-[.8vmin] text-[#b7b1c1]">
              <span>{scene.no} / {scene.name.toUpperCase()}</span><span className="text-[#f0a678]">↗</span>
            </div>
            <div className="relative m-[.8vmin] min-h-0 flex-1 overflow-hidden rounded-[.55vmin] bg-[#171820]">
              {scene.shape === 'wide' && <div className="absolute inset-[18%_8%] border border-[#a58ee1]/60" />}
              {scene.shape === 'close' && <div className="absolute left-[38%] top-[8%] h-[90%] w-[44%] rotate-[18deg] rounded-full bg-[radial-gradient(circle_at_30%_30%,#b7a2e7,#514763_60%,#25212e)]" />}
              {scene.shape === 'end' && <><div className="absolute inset-0 bg-[linear-gradient(140deg,#1d2029,#413852)]" /><div className="absolute bottom-[16%] left-[12%] right-[12%] h-px bg-[#f0a678]/60" /></>}
              <motion.div className="absolute inset-y-[12%] left-[10%] w-px bg-[#f0a678]/70" animate={{ x: ['0%', '650%'] }} transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.3 }} />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="absolute bottom-[8%] left-[41%] z-10 film-mono text-[2.8vmin] text-[#a9a4b2]"
        initial={{ opacity: 0 }}
        animate={step >= 4 ? { opacity: 1 } : {}}
        transition={{ duration: 0.3 }}
      >
        Scene prompts, built from your idea.
      </motion.div>
      {step >= 5 && (
        <motion.div
          className="absolute inset-0 z-30 bg-[#a990ff]/25"
          initial={{ opacity: 0, scale: 0.1, borderRadius: '1.2vmin' }}
          animate={{ opacity: [0, 0.85, 0], scale: [0.1, 1.4, 3.4], borderRadius: ['1.2vmin', '0%', '0%'], filter: ['blur(0px)', 'blur(1px)', 'blur(14px)'] }}
          transition={{ duration: 0.86, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
    </motion.section>
  );
}
