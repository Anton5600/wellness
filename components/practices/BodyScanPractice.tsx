import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PracticeTrackProps } from './types';
import { usePracticeTimer } from './usePracticeTimer';
import { hapticImpact, hapticNotification } from '../../services/haptics';

const ZONES = [
  { label: 'Лоб', from: 0, to: 8, x: 60, y: 26 },
  { label: 'Челюсти', from: 8, to: 16, x: 60, y: 52 },
  { label: 'Плечи', from: 16, to: 24, x: 60, y: 80 },
  { label: 'Грудь', from: 24, to: 32, x: 60, y: 110 },
  { label: 'Живот', from: 32, to: 40, x: 60, y: 140 },
  { label: 'Руки', from: 40, to: 48, x: 60, y: 168 },
  { label: 'Ноги', from: 48, to: 60, x: 60, y: 202 },
];

const zoneIndexFor = (elapsed: number): number => {
  const idx = ZONES.findIndex((z) => elapsed >= z.from && elapsed < z.to);
  return idx === -1 ? ZONES.length - 1 : idx;
};

/** Телесное сканирование: внимание движется сверху вниз по 7 зонам. */
export const BodyScanPractice: React.FC<PracticeTrackProps> = ({
  durationSeconds,
  onFinish,
  onProgress,
}) => {
  const elapsed = usePracticeTimer(durationSeconds, onFinish, onProgress);
  const zoneIndex = zoneIndexFor(elapsed);
  const prevZoneRef = useRef(-1);
  const aromaCuedRef = useRef(false);

  useEffect(() => {
    if (zoneIndex !== prevZoneRef.current) {
      prevZoneRef.current = zoneIndex;
      hapticImpact('light');
    }
    if (elapsed >= 16 && !aromaCuedRef.current) {
      aromaCuedRef.current = true;
      hapticNotification('warning');
    }
  }, [zoneIndex, elapsed]);

  const zone = ZONES[zoneIndex];

  return (
    <div className="flex flex-col items-center justify-center w-full px-4">
      <svg viewBox="0 0 120 250" className="w-40 h-[320px]" role="img" aria-label="Силуэт тела">
        {/* Фоновый силуэт (блеклый) */}
        <g fill="currentColor" className="text-gray-200 dark:text-gray-700">
          <circle cx="60" cy="24" r="16" />
          <rect x="42" y="46" width="36" height="118" rx="16" />
          <rect x="26" y="56" width="12" height="78" rx="6" />
          <rect x="82" y="56" width="12" height="78" rx="6" />
          <rect x="44" y="168" width="12" height="70" rx="6" />
          <rect x="64" y="168" width="12" height="70" rx="6" />
        </g>
        {/* Активная зона — пульсирующая точка */}
        <motion.circle
          key={zoneIndex}
          cx={zone.x}
          cy={zone.y}
          r="14"
          fill="currentColor"
          className="text-primary"
          initial={{ scale: 0.6, opacity: 0.5 }}
          animate={{ scale: [0.8, 1.25, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          key={`glow-${zoneIndex}`}
          cx={zone.x}
          cy={zone.y}
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
          initial={{ scale: 0.7, opacity: 0.6 }}
          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      </svg>

      <motion.h3
        key={`label-${zoneIndex}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-extrabold text-forest dark:text-white mt-2"
      >
        {zone.label}
      </motion.h3>
      <p className="text-sm text-sage dark:text-gray-400 mt-1">
        Переместите внимание сюда. Наблюдайте ощущения, не меняя их.
      </p>
    </div>
  );
};
