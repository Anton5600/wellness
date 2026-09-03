import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PracticeTrackProps } from './types';
import { usePracticeTimer } from './usePracticeTimer';
import { MANTRAS } from '../../data/practices';
import { hapticImpact } from '../../services/haptics';

const CYCLE_SEC = 14;

const jitter = (i: number): number => ((i % 3) - 1) * 8;

/** Мантра: фраза появляется, держится, растворяется как дым — цикл 14с. */
export const MantraLoopPractice: React.FC<PracticeTrackProps> = ({
  durationSeconds,
  dominant,
  onFinish,
  onProgress,
}) => {
  const elapsed = usePracticeTimer(durationSeconds, onFinish, onProgress);
  const cycle = Math.floor(elapsed / CYCLE_SEC);
  const t = elapsed % CYCLE_SEC;
  const fading = t >= 8;
  const words = MANTRAS[dominant].split(' ');

  useEffect(() => {
    hapticImpact('light');
  }, [cycle]);

  return (
    <div className="w-full flex flex-col items-center justify-center px-4">
      <motion.div key={cycle} className="flex flex-wrap justify-center gap-x-3 gap-y-2 max-w-sm">
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="practice-letter text-3xl font-extrabold text-forest dark:text-white"
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={
              fading
                ? { opacity: 0, y: -14, x: jitter(i), filter: 'blur(10px)' }
                : { opacity: 1, y: 0, x: 0, filter: 'blur(0px)' }
            }
            transition={
              fading
                ? { duration: 1.6, delay: i * 0.03, ease: 'easeIn' }
                : { duration: 0.6, delay: i * 0.08, ease: 'easeOut' }
            }
          >
            {word}
          </motion.span>
        ))}
      </motion.div>

      <p className="text-sm text-sage dark:text-gray-400 mt-8 text-center">
        Повторяйте фразу про себя или шёпотом. Вдох — слово входит, выдох — становится вами.
      </p>
    </div>
  );
};
