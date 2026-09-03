import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PracticeTrackProps } from './types';
import { usePracticeTimer } from './usePracticeTimer';
import { hapticVibrate } from '../../services/haptics';

const VIEW_W = 300;
const VIEW_H = 200;
const X0 = 30;
const X1 = 270;
const AMP = 70;
const CENTER = 100;
const DEVIATION_PX = 30;

const waveY = (x: number): number => CENTER - AMP * Math.sin(((x - X0) / (X1 - X0)) * Math.PI * 2 * 1.5);

const buildPath = (): string => {
  const pts: string[] = [];
  for (let x = X0; x <= X1; x += 5) {
    pts.push(`${x === X0 ? 'M' : 'L'} ${x} ${waveY(x).toFixed(1)}`);
  }
  return pts.join(' ');
};

const breathPhase = (elapsed: number): { label: string; color: string } => {
  const t = elapsed % 14;
  if (t < 4) return { label: 'вдох', color: '#3b82f6' };
  if (t < 8) return { label: 'задержка', color: '#8b5cf6' };
  return { label: 'выдох', color: '#10b981' };
};

/** Пальцевая трассировка: вести пальцем по волне в ритме 4-4-6. */
export const FingerTracingPractice: React.FC<PracticeTrackProps> = ({
  durationSeconds,
  onFinish,
  onProgress,
}) => {
  const elapsed = usePracticeTimer(durationSeconds, onFinish, onProgress);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progress = Math.min(1, elapsed / durationSeconds);
  const x = X0 + progress * (X1 - X0);
  const y = waveY(x);
  const path = useMemo(buildPath, []);
  const phase = breathPhase(elapsed);

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const sy = ((e.clientY - rect.top) / rect.height) * VIEW_H;
    if (Math.hypot(sx - x, sy - y) > DEVIATION_PX) {
      hapticVibrate(40);
      setFlash(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(false), 300);
    }
  };

  return (
    <div className="w-full flex flex-col items-center px-2">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full max-w-sm touch-none"
        onPointerMove={handleMove}
        role="img"
        aria-label="Трассировка волны"
      >
        <path d={path} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-gray-200 dark:text-gray-700" />
        <path
          d={path}
          fill="none"
          stroke={flash ? '#ef4444' : '#98c281'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="1000"
          strokeDashoffset={1000 * (1 - progress)}
        />
        <motion.circle
          cx={x}
          cy={y}
          r="12"
          fill={flash ? '#ef4444' : '#ffffff'}
          stroke={flash ? '#ef4444' : '#98c281'}
          strokeWidth="3"
          animate={{ scale: flash ? 1.3 : 1 }}
        />
      </svg>

      <motion.p
        key={phase.label}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-extrabold mt-2"
        style={{ color: phase.color }}
      >
        {phase.label}
      </motion.p>
      <p className="text-xs text-sage dark:text-gray-400 mt-1 text-center">
        Ведите пальцем по линии. Отклонитесь — вибрация напомнит замедлиться.
      </p>
    </div>
  );
};
