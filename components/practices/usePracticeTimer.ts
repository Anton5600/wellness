import { useEffect, useRef, useState } from 'react';

/**
 * Общий таймер дорожки: тикает раз в секунду, отдаёт `elapsed`,
 * зовёт `onProgress` каждый тик и `onFinish(true)` ровно один раз на `durationSeconds`.
 * Колбэки держатся в ref — не пересоздают интервал при перерендерах родителя.
 */
export const usePracticeTimer = (
  durationSeconds: number,
  onFinish: (completed: boolean) => void,
  onProgress: (seconds: number) => void
): number => {
  const [elapsed, setElapsed] = useState(0);
  const finishRef = useRef(onFinish);
  const progressRef = useRef(onProgress);
  finishRef.current = onFinish;
  progressRef.current = onProgress;

  useEffect(() => {
    let secs = 0;
    const timer = setInterval(() => {
      secs += 1;
      setElapsed(secs);
      progressRef.current(secs);
      if (secs >= durationSeconds) {
        clearInterval(timer);
        finishRef.current(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [durationSeconds]);

  return elapsed;
};
