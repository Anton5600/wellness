import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PracticeTrackProps } from './types';
import { usePracticeTimer } from './usePracticeTimer';
import { hapticImpact, hapticNotification } from '../../services/haptics';

const PHASES = [
  { key: 'see', label: '5 вещей, которые вы видите', icon: 'visibility', count: 5, from: 0, to: 30 },
  { key: 'hear', label: '4 звука вокруг', icon: 'hearing', count: 4, from: 30, to: 54 },
  { key: 'feel', label: '3 ощущения в теле', icon: 'touch_app', count: 3, from: 54, to: 72 },
  { key: 'smell', label: '2 запаха', icon: 'air', count: 2, from: 72, to: 84 },
  { key: 'taste', label: '1 вкус', icon: 'restaurant', count: 1, from: 84, to: 90 },
];

const phaseIndexFor = (elapsed: number): number => {
  const idx = PHASES.findIndex((p) => elapsed >= p.from && elapsed < p.to);
  return idx === -1 ? PHASES.length - 1 : idx;
};

const lerpHex = (a: string, b: string, t: number): string => {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

/** Заземление 5-4-3-2-1: вернуться в момент через пять органов чувств. */
export const Grounding54321Practice: React.FC<PracticeTrackProps> = ({
  durationSeconds,
  onFinish,
  onProgress,
}) => {
  const elapsed = usePracticeTimer(durationSeconds, onFinish, onProgress);
  const phaseIndex = phaseIndexFor(elapsed);
  const phase = PHASES[phaseIndex];
  const [found, setFound] = useState(0);
  const prevPhaseRef = useRef(-1);

  useEffect(() => {
    if (phaseIndex !== prevPhaseRef.current) {
      prevPhaseRef.current = phaseIndex;
      setFound(0);
      hapticNotification('warning');
    }
  }, [phaseIndex]);

  const tap = () => {
    if (found < phase.count) {
      setFound((f) => f + 1);
      hapticImpact('light');
    }
  };

  const progress = Math.min(1, elapsed / durationSeconds);

  return (
    <motion.div
      className="w-full rounded-3xl px-6 py-8 flex flex-col items-center"
      initial={{ backgroundColor: 'rgb(239,68,68)' }}
      animate={{ backgroundColor: lerpHex('#ef4444', '#059669', progress) }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <span className="material-symbols-outlined text-white text-5xl drop-shadow">{phase.icon}</span>
      <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-3">
        Этап {phaseIndex + 1} из {PHASES.length}
      </p>
      <h3 className="text-white text-xl font-extrabold text-center mt-1 leading-snug">{phase.label}</h3>

      <button
        onClick={tap}
        className="mt-6 size-28 rounded-full bg-white/20 backdrop-blur border-2 border-white/40 flex flex-col items-center justify-center active:scale-95 transition-transform"
      >
        <span className="text-white text-4xl font-extrabold">
          {found}<span className="text-xl opacity-70">/{phase.count}</span>
        </span>
        <span className="text-white/80 text-xs font-bold uppercase tracking-wider mt-1">нашёл</span>
      </button>
      <p className="text-white/70 text-xs mt-4 text-center">Коснитесь круга за каждую найденную деталь</p>
    </motion.div>
  );
};
