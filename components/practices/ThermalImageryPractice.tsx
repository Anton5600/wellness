import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PracticeTrackProps } from './types';
import { usePracticeTimer } from './usePracticeTimer';
import { hapticVibrate } from '../../services/haptics';

const STAGES = [
  { label: 'Руки', from: 0 },
  { label: 'Плечи', from: 10 },
  { label: 'Грудь', from: 20 },
  { label: 'Живот', from: 30 },
  { label: 'Ноги', from: 40 },
  { label: 'Всё тело', from: 50 },
];

const stageIndexFor = (elapsed: number): number => {
  let idx = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (elapsed >= STAGES[i].from) idx = i;
  }
  return idx;
};

const BodyShapes: React.FC<{ fill: string; className?: string }> = ({ fill, className }) => (
  <g fill={fill} className={className}>
    <circle cx="60" cy="24" r="16" />
    <rect x="42" y="46" width="36" height="118" rx="16" />
    <rect x="26" y="56" width="12" height="78" rx="6" />
    <rect x="82" y="56" width="12" height="78" rx="6" />
    <rect x="44" y="168" width="12" height="70" rx="6" />
    <rect x="64" y="168" width="12" height="70" rx="6" />
  </g>
);

/** Тепловая визуализация: капля масла, тепло разливается сверху вниз. */
export const ThermalImageryPractice: React.FC<PracticeTrackProps> = ({
  durationSeconds,
  onFinish,
  onProgress,
}) => {
  const elapsed = usePracticeTimer(durationSeconds, onFinish, onProgress);
  const progress = Math.min(1, elapsed / durationSeconds);
  const stage = STAGES[stageIndexFor(elapsed)];

  useEffect(() => {
    const iv = setInterval(() => hapticVibrate(50), 300);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-col items-center w-full px-4">
      <svg viewBox="0 0 120 250" className="w-40 h-[320px]" role="img" aria-label="Тепло в теле">
        <defs>
          <linearGradient id="warm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <clipPath id="reveal">
            <rect x="0" y="0" width="120" height={progress * 250} />
          </clipPath>
        </defs>

        <BodyShapes fill="currentColor" className="text-gray-200 dark:text-gray-700" />
        <g clipPath="url(#reveal)">
          <BodyShapes fill="url(#warm)" />
        </g>

        {/* Капля на запястье */}
        <motion.circle
          cx="26"
          cy="70"
          r="6"
          fill="#fb923c"
          animate={{ y: [0, -10, 0], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>

      <motion.h3
        key={stage.label}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-extrabold text-forest dark:text-white mt-2"
      >
        {stage.label}
      </motion.h3>
      <p className="text-sm text-sage dark:text-gray-400 mt-1 text-center">
        Представьте, как тепло масла медленно заливает эту зону
      </p>
    </div>
  );
};
