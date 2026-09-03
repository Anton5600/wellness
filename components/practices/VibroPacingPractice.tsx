import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PracticeTrackProps } from './types';
import { usePracticeTimer } from './usePracticeTimer';
import { hapticVibrate } from '../../services/haptics';

/** Вибро-ритм: пульс в ладони, замедляющийся с 60 до 50 bpm. Без действий. */
export const VibroPacingPractice: React.FC<PracticeTrackProps> = ({
  durationSeconds,
  onFinish,
  onProgress,
}) => {
  const elapsed = usePracticeTimer(durationSeconds, onFinish, onProgress);
  const [pulse, setPulse] = useState(0);
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;

  const bpm = Math.round(60 - (elapsed / durationSeconds) * 10);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const beat = () => {
      if (cancelled) return;
      hapticVibrate(80);
      setPulse((p) => p + 1);
      const currentBpm = 60 - (elapsedRef.current / durationSeconds) * 10;
      const interval = (60 / Math.max(currentBpm, 50)) * 1000;
      timer = setTimeout(beat, interval);
    };

    beat();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [durationSeconds]);

  return (
    <div className="w-full rounded-3xl bg-[#0a0a0a] border border-gray-800 py-12 px-6 flex flex-col items-center pointer-events-none select-none">
      <div className="relative flex items-center justify-center">
        <motion.div
          key={pulse}
          className="absolute size-32 rounded-full bg-primary/30"
          initial={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <motion.div
          className="size-24 rounded-full bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/30"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-white text-2xl font-extrabold">{bpm}</span>
        </motion.div>
      </div>

      <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-10">bpm</p>
      <p className="text-white/80 text-sm text-center mt-4 leading-relaxed">
        Просто держите телефон в ладони. Чувствуйте пульс — и ничего больше.
      </p>
    </div>
  );
};
