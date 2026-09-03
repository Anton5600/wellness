import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PracticeTrackProps } from './types';
import { usePracticeTimer } from './usePracticeTimer';
import { hapticNotification } from '../../services/haptics';
import { saveWritingDraft, readWritingDraft, clearWritingDraft } from '../../services/practiceMemory';

export const LOCAL_STARTERS = [
  'Что я чувствую прямо сейчас?',
  'Что застряло и просится наружу?',
  'Что я хочу отпустить?',
];

/** Микро-письмо: выгрузить застрявшее, затем отпустить (текст исчезает). */
export const ExpressiveWritingPractice: React.FC<PracticeTrackProps> = ({
  durationSeconds,
  uid,
  starters,
  onFinish,
  onProgress,
}) => {
  const [text, setText] = useState(() => readWritingDraft(uid));
  const [released, setReleased] = useState(false);
  const releasedRef = useRef(false);
  const releasedTextRef = useRef('');
  const chips = starters && starters.length > 0 ? starters : LOCAL_STARTERS;

  const release = () => {
    if (releasedRef.current) return;
    releasedRef.current = true;
    releasedTextRef.current = text;
    setReleased(true);
    clearWritingDraft(uid);
    hapticNotification('success');
    setTimeout(() => onFinish(true), 1800);
  };

  // 90с — мягкое окно: если не отпустили вручную, релиз происходит сам.
  usePracticeTimer(durationSeconds, () => release(), onProgress);

  const onChange = (value: string) => {
    setText(value);
    saveWritingDraft(uid, value);
  };

  const applyStarter = (s: string) => {
    onChange(text ? `${text}\n${s}` : s);
  };

  return (
    <div className="w-full flex flex-col px-1">
      <AnimatePresence mode="wait">
        {!released ? (
          <motion.div key="write" exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-wrap gap-2 mb-3">
              {chips.map((s) => (
                <button
                  key={s}
                  onClick={() => applyStarter(s)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-forest dark:text-white active:scale-95 transition-transform"
                >
                  {s}
                </button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Пишите всё, что крутится в голове. Это никто не увидит."
              rows={7}
              className="w-full bg-gray-100 dark:bg-gray-800 text-forest dark:text-white px-4 py-3 rounded-2xl font-medium outline-none resize-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={release}
              disabled={!text.trim()}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined">air</span>
              Отпустить
            </button>
            <p className="text-xs text-sage dark:text-gray-400 mt-2 text-center">
              После «Отпустить» эти слова растворятся и не сохранятся
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="release"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-10"
          >
            <motion.div
              className="max-w-full text-center text-forest dark:text-white font-medium leading-relaxed px-4"
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -120, opacity: 0 }}
              transition={{ duration: 1.6, ease: 'easeIn' }}
            >
              {releasedTextRef.current}
            </motion.div>
            <motion.p
              className="text-lg font-bold text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Отпускаю…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
