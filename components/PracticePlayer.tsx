import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PracticeId, EmotionKey, Arousal, PracticeFeedback } from '../types';
import { PRACTICE_BY_ID } from '../data/practices';
import { PRACTICE_COMPONENTS } from './practices';
import { colorForDominant } from '../services/recommendation/color';
import { hapticImpact } from '../services/haptics';
import { recordPracticeSession, recordPracticeFeedback } from '../services/practiceMemory';

type Phase = 'prep' | 'active' | 'completed' | 'sitting';

interface PracticePlayerProps {
  practiceId: PracticeId;
  dominant: EmotionKey;
  arousal: Arousal;
  dayColor?: string;
  uid: string;
  starters?: string[];
  onExit: () => void;
}

/**
 * Единый плеер практик: prep-шлюз → дорожка → завершение → «посидеть ещё».
 * Сохраняет сессию (завершённую/прерванную) и цикл «не помогло» локально.
 */
export const PracticePlayer: React.FC<PracticePlayerProps> = ({
  practiceId,
  dominant,
  arousal,
  dayColor,
  uid,
  starters,
  onExit,
}) => {
  const def = PRACTICE_BY_ID[practiceId];
  const TrackComponent = PRACTICE_COMPONENTS[def.component];

  const [phase, setPhase] = useState<Phase>('prep');
  const [countdown, setCountdown] = useState(3);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);

  const phaseRef = useRef<Phase>('prep');
  phaseRef.current = phase;
  const progressRef = useRef(0);
  const startedAtRef = useRef(Date.now());
  const interruptedRef = useRef(false);

  const bg = dayColor ?? colorForDominant(dominant);

  // Prep-шлюз: отсчёт 3-2-1 → active.
  useEffect(() => {
    if (phase !== 'prep') return;
    setCountdown(3);
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(iv);
          hapticImpact('medium');
          setPhase('active');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  // «Посидеть ещё минуту»: 60с тишины или тап → выход.
  useEffect(() => {
    if (phase !== 'sitting') return;
    const t = setTimeout(() => onExit(), 60000);
    return () => clearTimeout(t);
  }, [phase, onExit]);

  // Safety-net: аппаратный back (navigate(-1)) идёт мимо кнопки ✕.
  useEffect(() => {
    return () => {
      if (phaseRef.current === 'active' && !interruptedRef.current) {
        interruptedRef.current = true;
        recordPracticeSession(uid, {
          practiceId,
          dominant,
          arousal,
          completed: false,
          progress: progressRef.current,
          startedAt: startedAtRef.current,
        });
      }
    };
  }, [uid, practiceId, dominant, arousal]);

  const handleInterrupt = useCallback(() => {
    if (phaseRef.current !== 'active' || interruptedRef.current) return;
    interruptedRef.current = true;
    recordPracticeSession(uid, {
      practiceId,
      dominant,
      arousal,
      completed: false,
      progress: progressRef.current,
      startedAt: startedAtRef.current,
    });
    onExit();
  }, [uid, practiceId, dominant, arousal, onExit]);

  const handleClose = () => {
    if (phaseRef.current === 'active') handleInterrupt();
    else onExit();
  };

  const handleTrackFinish = useCallback(() => {
    interruptedRef.current = true;
    recordPracticeSession(uid, {
      practiceId,
      dominant,
      arousal,
      completed: true,
      progress: def.durationSeconds,
      startedAt: startedAtRef.current,
    });
    setPhase('completed');
  }, [uid, practiceId, dominant, arousal, def.durationSeconds]);

  const handleProgress = useCallback((seconds: number) => {
    progressRef.current = seconds;
  }, []);

  const handleFeedback = (value: PracticeFeedback) => {
    setFeedback(value);
    recordPracticeFeedback(uid, {
      practiceId,
      dominant,
      arousal,
      feedback: value,
      timestamp: Date.now(),
    });
    onExit();
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{ background: `linear-gradient(180deg, ${bg}1f, transparent 40%)` }}
    >
      {/* Шапка */}
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-xs font-bold uppercase tracking-widest text-sage dark:text-gray-400">
          {def.wave}
        </span>
        <button
          onClick={handleClose}
          aria-label="Закрыть практику"
          className="flex size-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 text-forest dark:text-white shadow-sm active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Контент */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-10">
        <AnimatePresence mode="wait">
          {phase === 'prep' && (
            <motion.div
              key="prep"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex flex-col items-center text-center"
            >
              <div className="size-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: `${bg}33` }}>
                <span className="material-symbols-outlined">{def.icon}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-forest dark:text-white mt-4">{def.title}</h2>
              <p className="text-sm text-sage dark:text-gray-400 mt-2 max-w-xs">{def.subtitle}</p>
              <p className="text-xs text-sage/80 dark:text-gray-500 mt-3">{def.description}</p>
              <motion.div
                key={countdown}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-7xl font-extrabold mt-8"
                style={{ color: bg }}
              >
                {countdown}
              </motion.div>
            </motion.div>
          )}

          {phase === 'active' && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              <TrackComponent
                durationSeconds={def.durationSeconds}
                dominant={dominant}
                uid={uid}
                dayColor={bg}
                starters={starters}
                onFinish={handleTrackFinish}
                onProgress={handleProgress}
              />
            </motion.div>
          )}

          {phase === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center w-full"
            >
              <div className="size-20 rounded-full flex items-center justify-center bg-emerald-500/15">
                <span className="material-symbols-outlined text-emerald-500 text-5xl">task_alt</span>
              </div>
              <h2 className="text-2xl font-extrabold text-forest dark:text-white mt-4">Практика завершена</h2>
              <p className="text-sm text-sage dark:text-gray-400 mt-2">Вы позаботились о себе. Заметьте, как изменилось состояние.</p>

              <div className="w-full mt-8 space-y-3">
                <button
                  onClick={() => setPhase('sitting')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-forest dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined">self_improvement</span>
                  Посидеть ещё минуту
                </button>
                <button
                  onClick={() => onExit()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white active:scale-[0.98] transition-all"
                  style={{ background: bg }}
                >
                  <span className="material-symbols-outlined">check</span>
                  Завершить
                </button>
              </div>

              <div className="w-full mt-8">
                <p className="text-xs font-bold uppercase tracking-wider text-sage dark:text-gray-400 mb-2">
                  Помогла ли практика?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleFeedback('helped')}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border font-bold text-sm transition-all ${
                      feedback === 'helped'
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'border-gray-200 dark:border-gray-700 text-forest dark:text-gray-300 hover:bg-emerald-500/10 active:scale-95'
                    }`}
                  >
                    <span className="material-symbols-outlined">thumb_up</span>
                    Помогло
                  </button>
                  <button
                    onClick={() => handleFeedback('not_helped')}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border font-bold text-sm transition-all ${
                      feedback === 'not_helped'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-gray-200 dark:border-gray-700 text-forest dark:text-gray-300 hover:bg-amber-500/10 active:scale-95'
                    }`}
                  >
                    <span className="material-symbols-outlined">thumb_down</span>
                    Мне не помогло
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'sitting' && (
            <motion.div
              key="sitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onExit()}
              className="min-h-[60vh] w-full flex flex-col items-center justify-center cursor-pointer"
            >
              <motion.div
                className="size-20 rounded-full"
                style={{ background: bg }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <p className="text-sage dark:text-gray-400 text-sm mt-6">Просто побудьте с собой. Коснитесь, чтобы выйти.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
