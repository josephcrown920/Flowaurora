import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { BrandBug, CanvasGrid, CornerMark, NodeCard, Port, PreviewCanvas, PromptField, Tag, Wire } from '../FilmPrimitives';

export function Scene2() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 950, callback: () => setBeat(1) },
    { time: 1550, callback: () => setBeat(2) },
    { time: 2700, callback: () => setBeat(3) },
    { time: 3850, callback: () => setBeat(4) },
  ]);
  return (
    <motion.section
      className="film-grain absolute inset-0 overflow-hidden bg-[#111116]"
      initial={{ opacity: 0, scale: 1.55, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ scale: 1.12, opacity: 0, filter: 'blur(8px)', transition: { duration: 0.44 } }}
      transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
    >
      <CanvasGrid opacity={0.25} />
      <BrandBug />
      <CornerMark />
      <div className="absolute inset-0 z-0">
        <Wire d="M-35 280 C180 65 230 510 430 275 S710 35 1035 282" width={4.5} delay={0.1} />
        <Wire d="M-35 280 C180 65 230 510 430 275 S710 35 1035 282" color="#eadfff" width={0.8} delay={0.35} opacity={0.6} />
      </div>

      <motion.div
        className="absolute left-[5.5%] top-[15%] z-10 font-display text-[8.5vmin] font-semibold leading-[.88] tracking-[-.07em] text-[#f3effa]"
        initial={{ opacity: 0, x: -26 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.43, duration: 0.48 }}
      >
        CONNECT
      </motion.div>
      <NodeCard title="Prompt" x="5%" y="36%" w="29%" h="35%" accent="#d9d3e7" transition={{ delay: 0.14, type: 'spring', stiffness: 260 }}>
        <Port side="left" />
        <PromptField text={<>Cinematic pan<br />over the scene</>} />
      </NodeCard>
      {beat >= 1 && (
        <NodeCard title="Image Upload" x="8%" y="73%" w="26%" h="18%" accent="#e6e2ee" transition={{ type: 'spring', stiffness: 260, delay: 0.05 }}>
          <div className="flex h-full items-center gap-[1vmin]">
            <div className="aspect-video h-full overflow-hidden rounded bg-[radial-gradient(circle_at_70%_32%,#c0aae7_0_9%,transparent_11%),linear-gradient(130deg,#383044,#12131a)]" />
            <span className="film-mono text-[.75vmin] text-[#9793a1]">REF 01</span>
          </div>
        </NodeCard>
      )}
      <NodeCard title="ModelArk Video" x="62%" y="27%" w="33%" h="55%" accent="#b89cff" transition={{ type: 'spring', stiffness: 250, delay: 0.28 }}>
        <Port side="left" color="#b89cff" />
        <div className="absolute inset-x-[5%] top-[5%] bottom-[26%]">
          {beat >= 3 ? <PreviewCanvas compact /> : (
            <div className="flex h-full items-center justify-center rounded-[.8vmin] border border-[#b89cff]/10 bg-[#111119]">
              <motion.div className="h-[3.2vmin] w-[4.5vmin] rounded-[.5vmin] border-[.35vmin] border-[#9673cb]/70" animate={{ scale: [0.9, 1.08, 0.9] }} transition={{ duration: 1.25, repeat: Infinity }} />
            </div>
          )}
        </div>
        <div className="absolute bottom-[8%] left-[5%] right-[5%] flex items-center justify-between border-t border-white/[.07] pt-[1vmin] text-[.85vmin] text-[#928e9c]">
          <span>ModelArk</span><span>{beat >= 3 ? 'TEXT TO VIDEO' : '16:9  ·  x1'}</span>
        </div>
      </NodeCard>
      {beat >= 2 && <Wire d="M340 296 C430 296 490 240 620 240" delay={0.1} />}
      {beat >= 2 && <Wire d="M335 451 C460 451 500 347 620 347" color="#87809e" delay={0.4} opacity={0.65} />}

      <motion.div
        className="absolute bottom-[8%] left-[39%] z-10 max-w-[28%] font-body text-[3vmin] leading-tight text-[#bcb7c8]"
        initial={{ opacity: 0, y: 12 }}
        animate={beat >= 2 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.42 }}
      >
        Prompts + references,<br />together.
      </motion.div>
      {beat >= 3 && <Tag style={{ right: '7%', top: '19%', color: '#c9b6ff' }}>TEXT TO VIDEO</Tag>}
      {beat >= 4 && (
        <motion.div
          className="absolute left-[72%] top-[49%] z-20 h-[3vmin] w-[3vmin] rounded-full border border-[#c0aaff]/80 bg-[#9a79f3]/25"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.5, 28], opacity: [1, 1, 0], rotate: [0, 30, 45] }}
          transition={{ duration: 0.72, ease: [0.2, 0.8, 0.2, 1] }}
        />
      )}
    </motion.section>
  );
}
