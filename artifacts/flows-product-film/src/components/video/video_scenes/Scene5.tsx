import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { BrandBug, CanvasGrid } from '../FilmPrimitives';

const WORDS = ['IDEA.', 'WORKFLOW.', 'POSSIBILITY.'];

export function Scene5() {
  const [word, setWord] = useState(0);
  const [lock, setLock] = useState(false);
  useSceneTimer([
    { time: 520, callback: () => setWord(1) },
    { time: 980, callback: () => setWord(2) },
    { time: 1820, callback: () => setLock(true) },
  ]);
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden bg-[#eae5db] text-[#211e28]"
      initial={{ opacity: 0, backgroundColor: '#111116' }}
      animate={{ opacity: 1, backgroundColor: '#eae5db' }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0.58, ease: [0.2, 1, 0.3, 1] }}
    >
      <CanvasGrid opacity={0.075} />
      <BrandBug light />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute left-[7%] top-[18%] h-[61%] w-[86%] rounded-[2vmin] border border-[#6e657a]/15" />
        <div className="absolute left-[13%] top-[25%] h-[47%] w-[74%] rounded-[2vmin] border border-[#8d72ed]/20" />

        {!lock && (
          <AnimatePresence mode="sync">
            <motion.div
              key={word}
              className="absolute z-10 w-full text-center font-display text-[30vmin] font-bold leading-[.8] tracking-[-.09em] text-[#8671cf]"
              initial={{ scale: 0.78, opacity: 1, filter: 'blur(0px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 1.12, opacity: 0, filter: 'blur(8px)' }}
              transition={{ duration: 0.28, ease: [0.2, 1, 0.3, 1] }}
            >
              {WORDS[word]}
            </motion.div>
          </AnimatePresence>
        )}

        <motion.div
          className="absolute z-20 flex h-[12vmin] w-[12vmin] items-center justify-center rounded-[3vmin] bg-[#8f76e4] shadow-[0_2vmin_6vmin_rgba(80,63,134,.22)]"
          initial={{ x: '28vw', y: '-4vh', scale: 0.15, rotate: 14, opacity: 0.2 }}
          animate={lock
            ? { x: 0, y: '-5.2vmin', scale: 1, rotate: 0, opacity: 1 }
            : { x: '28vw', y: '-4vh', scale: 0.15, rotate: 14, opacity: 0.2 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        >
          <span className="h-[3.2vmin] w-[3.2vmin] rounded-[.9vmin] bg-[#f0eaff]" />
        </motion.div>

        <motion.div
          className="absolute z-20 mt-[13vmin] font-display text-[5.5vmin] font-semibold tracking-[-.06em] text-[#26222f]"
          initial={{ opacity: 0, letterSpacing: '.18em' }}
          animate={lock ? { opacity: 1, letterSpacing: '-.06em' } : { opacity: 0 }}
          transition={{ duration: 0.56, staggerChildren: 0.045 }}
        >
          Flows
        </motion.div>
        <motion.p
          className="absolute z-20 mt-[24vmin] font-body text-[3.1vmin] text-[#6e6878]"
          initial={{ opacity: 0, y: 10 }}
          animate={lock ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ delay: 0.5, duration: 0.45 }}
        >
          A canvas for what comes next.
        </motion.p>
      </div>
      <div className="film-mono absolute bottom-[5%] right-[4.5%] text-[.8vmin] tracking-[.14em] text-[#716b77]/60">IDEA → WORKFLOW → POSSIBILITY</div>

      {lock && (
        <>
          <motion.svg
            className="absolute inset-0 z-10 h-full w-full"
            viewBox="0 0 1000 562"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.42 }}
          >
            <motion.path
              d="M70 450 C145 365 180 408 236 354 M764 140 C819 221 860 171 930 250 M115 118 C198 165 172 200 226 225 M790 395 C855 340 876 387 915 331"
              fill="none"
              stroke="#9b8cc5"
              strokeOpacity=".34"
              strokeWidth="1.4"
              strokeDasharray="3 8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, delay: 0.3 }}
            />
          </motion.svg>
          <motion.div
            className="absolute left-1/2 top-1/2 z-30 h-[1.3vmin] w-[1.3vmin] -translate-x-1/2 -translate-y-1/2 rounded-[.28vmin] bg-[#8f76e4]"
            initial={{ x: 0, y: '-5.2vmin', scale: 1 }}
            animate={{ x: '-44vw', y: '-29vh', scale: 0.1 }}
            transition={{ delay: 3.86, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="absolute left-[4.5%] top-[20%] z-20 h-[2.2vmin] w-[2.2vmin] rounded-[.45vmin] border border-[#8f76e4]/70"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 0, 0.65], scale: [0.7, 0.7, 1] }}
            transition={{ delay: 4.35, duration: 0.36 }}
          />
        </>
      )}
    </motion.section>
  );
}
