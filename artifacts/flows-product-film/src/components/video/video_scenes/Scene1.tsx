import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { BrandBug, CanvasGrid, CornerMark, NodeCard, Port, PromptField, Tag, Wire } from '../FilmPrimitives';

export function Scene1() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 700, callback: () => setBeat(1) },
    { time: 1200, callback: () => setBeat(2) },
    { time: 2100, callback: () => setBeat(3) },
    { time: 3500, callback: () => setBeat(4) },
  ]);
  return (
    <motion.section
      className="film-grain absolute inset-0 overflow-hidden bg-[#121217]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ scale: 1.08, opacity: 0, filter: 'blur(7px)', transition: { duration: 0.42, ease: [0.6, 0, 0.2, 1] } }}
    >
      <CanvasGrid opacity={0.31} />
      <BrandBug />
      <CornerMark />
      <div className="absolute left-[4.5%] top-[12%] z-10 flex items-center gap-[1.1vmin]">
        <motion.span className="h-px w-[4.3vmin] bg-[#bdabff]" initial={{ scaleX: 0, transformOrigin: 'left' }} animate={{ scaleX: 1 }} transition={{ duration: 0.5 }} />
        <motion.span className="film-mono text-[1.8vmin] tracking-[.16em] text-[#c2bccf]" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
          A CREATIVE WORKFLOW, IN ONE PLACE
        </motion.span>
      </div>

      <NodeCard title="Prompt" x="5%" y="20%" w="40%" h="47%" accent="#d9d3e7" transition={{ type: 'spring', stiffness: 310, damping: 22, delay: 0.08 }}>
        <Port side="left" color="#a990ff" />
        <PromptField
          className="mt-[.6vmin]"
          text={beat >= 1 ? <>Cinematic pan<br />over the scene</> : <>Cinematic<br /><span className="text-[#9995a4]">pan over the scene</span></>}
        />
      </NodeCard>

      {beat >= 1 && (
        <NodeCard title="Image Upload" x="8%" y="72%" w="29%" h="22%" accent="#e6e2ee" transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
          <Port side="left" color="#e4dff0" />
          <div className="flex h-full items-center gap-[1.1vmin]">
            <div className="h-full aspect-video overflow-hidden rounded-[.8vmin]">
              <div className="h-full w-full bg-[radial-gradient(circle_at_66%_30%,#b19cdb_0_9%,transparent_10%),linear-gradient(145deg,#443952,#21212c_53%,#12141b)]" />
            </div>
            <span className="film-mono text-[.8vmin] text-[#928e9c]">REF · 01</span>
          </div>
        </NodeCard>
      )}
      {beat >= 2 && (
        <NodeCard title="ModelArk Video" x="58%" y="28%" w="36%" h="51%" accent="#b89cff" transition={{ type: 'spring', stiffness: 295, damping: 24 }}>
          <div className="absolute inset-x-[4%] top-[4%] bottom-[28%] overflow-hidden rounded-[.9vmin] border border-[#b89cff]/10 bg-[#111119]">
            <div className="absolute inset-0 flex items-center justify-center text-[#9d7fea]/55">
              <span className="film-mono text-[3vmin]">▶</span>
            </div>
            <span className="film-mono absolute bottom-[4%] right-[4%] text-[.8vmin] text-white/35">00:04</span>
          </div>
          <div className="absolute bottom-[9%] left-[4%] right-[4%] flex h-[13%] items-center justify-between rounded-[.5vmin] border border-[#bdb5ce]/10 bg-[#121219] px-[.8vmin] text-[.82vmin] text-[#9793a1]">
            <span>seedance-1-0-lite-i2v</span><span>⌄</span>
          </div>
        </NodeCard>
      )}
      {beat >= 2 && <Wire d="M445 193 C500 193 510 240 570 240" delay={0.4} />}
      {beat >= 2 && <Wire d="M365 416 C470 415 478 385 580 370" color="#8d82a9" delay={0.7} opacity={0.55} />}

      <motion.div
        className="absolute bottom-[8%] left-[58%] z-10 w-[35%] font-display text-[5.3vmin] font-semibold leading-[.95] tracking-[-.055em] text-[#f0edf5]"
        initial={{ opacity: 0, y: 28, clipPath: 'inset(100% 0 0 0)' }}
        animate={beat >= 3 ? { opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)' } : {}}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      >
        Start with a thought.
      </motion.div>

      {beat >= 4 && (
        <>
          <Tag style={{ left: '47%', top: '37%' }}>OUTPUT</Tag>
          <motion.div
            className="absolute left-[75%] top-[40%] z-20 h-[1.5vmin] w-[1.5vmin] rounded-full bg-[#bea9ff] shadow-[0_0_1.8vmin_#ac93ff]"
            animate={{ scale: [1, 1.6, 1] }}
            transition={{ duration: 0.62, ease: 'easeOut', repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 z-30"
            initial={{ scale: 0.02, opacity: 0, borderRadius: '100%' }}
            animate={{ scale: 2.4, opacity: [0, 1, 0], borderRadius: ['100%', '100%', '0%'] }}
            transition={{ duration: 0.8, ease: [0.3, 0, 0.7, 1] }}
            style={{ transformOrigin: '75% 40%', background: 'radial-gradient(circle at 75% 40%,rgba(174,148,255,.45),rgba(174,148,255,.04) 35%,transparent 62%)' }}
          />
        </>
      )}
    </motion.section>
  );
}
