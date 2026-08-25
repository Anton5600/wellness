import React, { useState, useEffect } from 'react';

interface BreathingCircleProps {
  aromaName: string;
  focusText: string;
  durationSeconds?: number;
  pattern?: string; // "4-4-6" or "4-4-4"
  onComplete: () => void;
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({
  aromaName,
  focusText,
  durationSeconds = 60,
  pattern = '4-4-6',
  onComplete,
}) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [phaseProgress, setPhaseProgress] = useState(0);

  // Timings in seconds
  const isStuckPattern = pattern === '4-4-4';
  const inhaleSec = 4;
  const holdSec = 4;
  const exhaleSec = isStuckPattern ? 4 : 6;
  const cycleTotal = inhaleSec + holdSec + exhaleSec;

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  // Phase tick timer (100ms for smooth expansion)
  useEffect(() => {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 0.1;
      const cycleTime = elapsed % cycleTotal;

      if (cycleTime < inhaleSec) {
        setPhase('inhale');
        setPhaseProgress(cycleTime / inhaleSec);
      } else if (cycleTime < inhaleSec + holdSec) {
        setPhase('hold');
        setPhaseProgress((cycleTime - inhaleSec) / holdSec);
      } else {
        setPhase('exhale');
        setPhaseProgress((cycleTime - inhaleSec - holdSec) / exhaleSec);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [cycleTotal, inhaleSec, holdSec, exhaleSec]);

  const getPhaseTitle = () => {
    switch (phase) {
      case 'inhale':
        return 'Вдох...';
      case 'hold':
        return 'Задержка...';
      case 'exhale':
        return 'Выдох...';
    }
  };

  // Calculate circle scale
  let scale = 1.0;
  if (phase === 'inhale') {
    scale = 1.0 + phaseProgress * 0.45;
  } else if (phase === 'hold') {
    scale = 1.45;
  } else {
    scale = 1.45 - phaseProgress * 0.45;
  }

  const progressPercent = Math.round(((durationSeconds - timeLeft) / durationSeconds) * 100);

  return (
    <div className="flex flex-col items-center justify-between min-h-[420px] p-6 text-center select-none bg-stone-950 text-white rounded-3xl relative overflow-hidden shadow-2xl">
      {/* Background glow */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-emerald-900/30 via-stone-950 to-stone-950 pointer-events-none transition-opacity duration-1000"
        style={{ opacity: phase === 'hold' ? 0.8 : 0.4 }}
      />

      {/* Header */}
      <div className="relative z-10 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-wider uppercase border border-emerald-500/20">
          <span className="material-symbols-outlined text-sm">spa</span>
          <span>{aromaName}</span>
        </div>
        <p className="text-stone-400 text-xs max-w-xs mx-auto mt-2 leading-relaxed">
          {focusText}
        </p>
      </div>

      {/* Animated Circle Stage */}
      <div className="relative z-10 my-8 flex items-center justify-center h-64 w-64">
        {/* Outer pulse rings */}
        <div
          className="absolute inset-0 rounded-full bg-emerald-500/10 transition-transform duration-300 ease-out"
          style={{ transform: `scale(${scale * 1.15})` }}
        />
        <div
          className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md transition-transform duration-300 ease-out"
          style={{ transform: `scale(${scale * 1.05})` }}
        />

        {/* Main Breathing Orb */}
        <div
          className="w-40 h-40 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex flex-col items-center justify-center shadow-lg transition-transform duration-300 ease-out"
          style={{ transform: `scale(${scale})` }}
        >
          <span className="text-white text-lg font-bold tracking-wide drop-shadow">
            {getPhaseTitle()}
          </span>
        </div>
      </div>

      {/* Bottom Progress Bar & Timer */}
      <div className="relative z-10 w-full space-y-3">
        <div className="flex justify-between items-center text-xs text-stone-400 font-medium">
          <span>{timeLeft} сек осталось</span>
          <span>{progressPercent}%</span>
        </div>

        <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-stone-500 text-[11px]">
          Ритм {pattern}: {inhaleSec}с вдох • {holdSec}с задержка • {exhaleSec}с выдох
        </p>
      </div>
    </div>
  );
};
