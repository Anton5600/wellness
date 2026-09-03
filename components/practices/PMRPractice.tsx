import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PracticeTrackProps } from './types';
import { usePracticeTimer } from './usePracticeTimer';
import { hapticVibratePattern } from '../../services/haptics';

const CYCLE_SEC = 15;
const SQUEEZE_SEC = 5;

const CYCLES = [
  { label: 'Кулаки', icon: 'back_hand' },
  { label: 'Плечи', icon: 'fitness_center' },
  { label: 'Челюсть', icon: 'face' },
  { label: 'Всё тело', icon: 'accessibility_new' },
];

/** Прогрессивная мышечная релаксация: сжатие → отпускание по 4 зонам. */
export const PMRPractice: React.FC<PracticeTrackProps> = ({
  durationSeconds,
  onFinish,
  onProgress,
}) => {
  const elapsed = usePracticeTimer(durationSeconds, onFinish, onProgress);
  const cycleIndex = Math.min(CYCLES.length - 1, Math.floor(elapsed / CYCLE_SEC));
  const inCycle = elapsed % CYCLE_SEC;
  const squeezing = inCycle < SQUEEZE_SEC;
  const cycle = CYCLES[cycleIndex];
  const prevStateRef = useRef<string>('');

  useEffect(() => {
    const state = `${cycleIndex}-${squeezing}`;
    if (state !== prevStateRef.current) {
      prevStateRef.current = state;
      if (squeezing) {
        hapticVibratePattern([30, 40, 50, 60, 70]);
      } else {
        hapticVibratePattern([80, 60, 40, 20]);
      }
    }
  }, [cycleIndex, squeezing]);

  return (
    <div className="w-full flex flex-col items-center px-4">
      <motion.div
        className="w-full rounded-3xl py-10 flex flex-col items-center justify-center border-2"
        animate={{
          backgroundColor: squeezing ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
          borderColor: squeezing ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.5)',
          scale: squeezing ? 1.02 : 1,
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <span
          className={`material-symbols-outlined text-5xl ${
            squeezing ? 'text-red-500' : 'text-emerald-500'
          }`}
        >
          {cycle.icon}
        </span>
        <h3 className="text-2xl font-extrabold text-forest dark:text-white mt-3">{cycle.label}</h3>
        <p className="text-sm font-bold mt-1 uppercase tracking-wider">
          {squeezing ? (
            <span className="text-red-500">Напрягите · 5 сек</span>
          ) : (
            <span className="text-emerald-500">Отпустите · тепло</span>
          )}
        </p>
      </motion.div>

      <div className="flex gap-2 mt-6">
        {CYCLES.map((c, i) => (
          <div
            key={c.label}
            className={`size-2.5 rounded-full transition-all ${
              i < cycleIndex ? 'bg-emerald-500' : i === cycleIndex ? 'bg-primary scale-125' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-sage dark:text-gray-400 mt-3 text-center">
        Напрягайте мышцу на вдохе, отпускайте на выдохе — замечайте разницу
      </p>
    </div>
  );
};
