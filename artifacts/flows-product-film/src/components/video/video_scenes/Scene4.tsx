import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { BrandBug, CanvasGrid, CornerMark, NodeCard, PreviewCanvas, PromptField, Tag, Wire } from '../FilmPrimitives';

export function Scene4() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 650, callback: () => setBeat(1) },
    { time: 1250, callback: () => setBeat(2) },
    { time: 2050, callback: () => setBeat(3) },
    { time: 3000, callback: () => setBeat(4) },
    { time: 3900, callback: () => setBeat(5) },
  ]);
  return (
    <motion.section
      className="film-grain absolute inset-0 overflow-hidden bg-[#111319]"
      initial={{ opacity: 0, scale: 1.46, filter: 'blur(12px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ scale: 0.88, opacity: 0, filter: 'blur(10px)', transition: { duration: 0.5 } }}
      transition={{ duration: 0.74, ease: [0.2, 1, 0.35, 1] }}
    >
      <CanvasGrid opacity={0.19} />
      <BrandBug />
      <CornerMark />
      <motion.div
        className="absolute left-[5%] top-[19%] z-10 font-display text-[6.1vmin] font-semibold leading-[.92] tracking-[-.06em]"
        initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
        animate={{ opacity: 1, clipPath: 'inset(0 0 0 0)' }}
        transition={{ delay: 0.12, duration: 0.55 }}
      >
        MAKE IT<br /><span className="text-[#baa6ff]">MOVE.</span>
      </motion.div>
      <NodeCard title="Image Upload" x="5%" y="44%" w="33%" h="41%" accent="#e0dbe9" transition={{ delay: 0.07, type: 'spring', stiffness: 240 }}>
        <div className="absolute inset-[6%] overflow-hidden rounded-[.8vmin] bg-[radial-gradient(circle_at_66%_34%,#b9a8dd_0_13%,transparent_14%),linear-gradient(145deg,#282637,#181820_60%,#171a22)]">
          <div className="absolute inset-x-[10%] bottom-[14%] h-[22%] rotate-[-8deg] bg-[#14151e]" />
          <span className="film-mono absolute bottom-[7%] left-[7%] text-[.75vmin] text-white/42">REFERENCE  /  01</span>
        </div>
      </NodeCard>
      <NodeCard title="ModelArk Video" x="51%" y="17%" w="43%" h="65%" accent="#b79cff" transition={{ delay: 0.15, type: 'spring', stiffness: 250 }}>
        <div className="absolute inset-x-[5%] top-[6%] bottom-[24%]">
          <div className="relative h-full overflow-hidden rounded-[.9vmin] border border-[#bdabff]/18 bg-[#171720]">
            {beat >= 2 ? <PreviewCanvas /> : (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div className="h-[11vmin] w-[11vmin] rounded-full border-[.3vmin] border-[#b7a1ff]/20 border-t-[#b7a1ff]" animate={{ rotate: 360 }} transition={{ duration: 1.4, ease: 'linear', repeat: Infinity }} />
                <motion.div className="absolute h-[1.3vmin] w-[1.3vmin] rounded-full bg-[#f3a77a]" animate={{ scale: [1, 1.7, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
              </div>
            )}
          </div>
        </div>
        <div className="absolute bottom-[6%] left-[5%] right-[5%] flex items-center justify-between">
          <span className="film-mono text-[.76vmin] text-[#8c8795]">SEEDANCE · VIDEO</span>
          <span className="rounded-full border border-[#b9a5ff]/20 bg-[#a18bf0]/10 px-[.9vmin] py-[.35vmin] film-mono text-[.68vmin] tracking-[.1em] text-[#bbaaff]">
            {beat >= 4 ? 'READY' : 'PREPARING'}
          </span>
        </div>
      </NodeCard>
      {beat >= 1 && <Wire d="M380 285 C440 285 463 287 520 287" width={2.5} delay={0.08} />}
      <motion.div
        className="absolute bottom-[8%] left-[5%] z-10 font-body text-[2.9vmin] text-[#c2bdca]"
        initial={{ opacity: 0, y: 12 }}
        animate={beat >= 3 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        Image and prompt in. Motion out.
      </motion.div>
      {beat >= 5 && (
        <motion.div
          className="absolute inset-0 z-30"
          initial={{ opacity: 0, scale: 1, clipPath: 'circle(0% at 75% 48%)' }}
          animate={{ opacity: [0, 1, 0], scale: [1, 0.1, 0.02], clipPath: ['circle(0% at 75% 48%)', 'circle(62% at 75% 48%)', 'circle(75% at 75% 48%)'] }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: 'radial-gradient(circle at 75% 48%,rgba(188,168,255,.8),rgba(188,168,255,.1) 42%,transparent 67%)' }}
        />
      )}
    </motion.section>
  );
}
