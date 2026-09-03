import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlutchikWheel } from './PlutchikWheel';
import { useAuth } from '../context/AuthContext';
import { compassService } from '../services/compassService';
import { getUserOils } from '../services/firestoreService';
import { findOilById } from '../data/oilDatabase';
import { PRACTICE_BY_ID } from '../data/practices';
import { selectPractice, bannedPracticeIds } from '../services/recommendation/practice';
import { UNLOCK_DAYS } from '../services/recommendation/unlock';
import { readDevUnlockOverride, readDevPatternOverride, buildDevPattern } from '../services/devBridgeOverride';
import { getPracticeFeedbackEntries, getTodayPartialSession } from '../services/practiceMemory';
import { PulseCheckIn } from './PulseCheckIn';
import { PatternCard } from './PatternCard';
import { EMOTION_LABELS } from '../services/recommendation/inference';
import { detectCrisis, CrisisDetectedError } from '../services/recommendation/safety';
import { CRISIS_RESOURCES, GROUNDING_EXERCISES } from '../data/crisis';
import { EveningFeedback, EmotionalGraphEntry, PlutchikProfile } from '../types';
import { TimeOfDayPattern } from '../services/recommendation/pattern';
import { requestPermissions, schedulePatternReminder } from '../services/notificationService';

const FEEDBACK_OPTIONS: Array<{ value: EveningFeedback; label: string; icon: string }> = [
  { value: 'better', label: 'Стало лучше', icon: 'thumb_up' },
  { value: 'same', label: 'Без изменений', icon: 'remove' },
  { value: 'worse', label: 'Не помогло', icon: 'thumb_down' },
];

/**
 * Порог стрика → фича(и), открывающаяся на этом дне (для баннера «открылась фича»).
 * Только то, что пользователь может «потрогать» прямо сейчас: вечерний чекин, карта
 * эмоций и паттерны в UI не анонсируются баннером — паттерны показываются отдельной
 * карточкой наблюдения, а чекин/карта ещё не гейтятся.
 */
const UNLOCK_FEATURE_LABELS: Array<{ day: number; label: string }> = [
  { day: UNLOCK_DAYS.cards, label: 'Карта дня' },
  { day: 30, label: 'Каталог масел и PDF-экспорт' },
];

/** Первый порог, пересечённый ростом стрика с `before` на `after`, или null. */
const findCrossedUnlock = (before: number, after: number): string | null => {
  if (after <= before) return null;
  const match = UNLOCK_FEATURE_LABELS.find((f) => f.day > before && f.day <= after);
  return match ? match.label : null;
};

/** Быстрый ввод для низкого ресурса: фразы подобраны под KEYWORD_RULES движка. */
const QUICK_OPTIONS: Array<{ text: string; label: string; emoji: string }> = [
  { text: 'радостно, отлично', label: 'Норм', emoji: '🟢' },
  { text: 'устал, тяжело', label: 'Так себе', emoji: '🟡' },
  { text: 'тревожно, страшно', label: 'Тяжело', emoji: '🔴' },
];

/**
 * Ежедневный ритуал — точка входа в приложение:
 * микро-ввод (писать/говорить/кнопки) → AI-ответ (масло + напутствие) → дыхание → награда.
 * Без навигации и BottomNavBar: те подключает экран, в который встроен ритуал.
 */
export const DailyRitual: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [todayEntry, setTodayEntry] = useState<EmotionalGraphEntry | null>(null);
  const [profile, setProfile] = useState<PlutchikProfile | null>(null);
  const [mode, setMode] = useState<'tap' | 'voice' | 'quick'>('tap');
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);
  const [patternCard, setPatternCard] = useState<
    | { kind: 'pattern'; pattern: TimeOfDayPattern; applied: boolean }
    | { kind: 'insufficient'; days: number }
    | null
  >(null);
  const [feedback, setFeedback] = useState<EveningFeedback | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [sttBusy, setSttBusy] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const [crisis, setCrisis] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [ownedOilIds, setOwnedOilIds] = useState<Set<string>>(new Set());
  const [substitution, setSubstitution] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    compassService.setCurrentUserId(user?.uid);
    let cancelled = false;
    (async () => {
      const [entry, prof] = await Promise.all([
        compassService.getTodayEntry(),
        compassService.getProfile(),
      ]);
      if (cancelled) return;
      setTodayEntry(entry);
      setFeedback(entry?.eveningFeedback);
      setProfile(prof);
      setMode(compassService.getPreferredInput());
      // Dev-only: если запись за сегодня уже есть и задан принудительный день баннера —
      // показываем его сразу (для теста без повторного ритуала).
      const devUnlockDay = readDevUnlockOverride();
      if (devUnlockDay !== null && entry) {
        setUnlockNotice(UNLOCK_FEATURE_LABELS.find((f) => f.day === devUnlockDay)?.label ?? null);
      }
      // Dev-only: принудительная карточка паттерна — показываем сразу при наличии записи.
      const devPattern = readDevPatternOverride();
      if (devPattern !== null && entry) {
        setPatternCard(
          devPattern === 'pattern'
            ? { kind: 'pattern', pattern: buildDevPattern(), applied: false }
            : { kind: 'insufficient', days: 21 }
        );
      }
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  // Аптечка пользователя — для сценария «Нет под рукой» (подмена на клиенте).
  useEffect(() => {
    if (!user?.uid) return;
    getUserOils(user.uid)
      .then((oils) => setOwnedOilIds(new Set(oils.map((o) => o.oilId))))
      .catch(() => {});
  }, [user?.uid]);

  // Офлайн-статус — для бейджа «Синхронизируемся…».
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const submitText = async (raw: string, inputType: 'tap' | 'voice' | 'quick') => {
    const text = raw.trim();
    if (!text) return;

    // «Красная зона»: перехват ДО вызова LLM, запись не создаём.
    if (detectCrisis(text)) {
      setCrisis(true);
      setInput('');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Сценарий 5: фиксируем best-стрик до и после ритуала, чтобы показать открывшуюся фичу.
      const before = await compassService.getStreak();
      const entry = await compassService.generateAISynthesis(text, inputType);
      const after = await compassService.getStreak();
      setTodayEntry(entry);
      setFeedback(entry.eveningFeedback);
      setSubstitution(null);
      setInput('');
      // Dev-only: принудительный день баннера (иначе — реальное пересечение порога).
      const devUnlockDay = readDevUnlockOverride();
      const crossed = devUnlockDay !== null
        ? (UNLOCK_FEATURE_LABELS.find((f) => f.day === devUnlockDay)?.label ?? null)
        : findCrossedUnlock(before.longest, after.longest);
      if (crossed) setUnlockNotice(crossed);
      await maybeSurfacePattern(before.longest, after.longest);
    } catch (e) {
      if (e instanceof CrisisDetectedError) {
        setCrisis(true);
        setInput('');
      } else {
        setError('Не удалось получить рекомендацию. Попробуйте ещё раз.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => submitText(input, mode);
  const quickSubmit = (text: string) => submitText(text, 'quick');

  /**
   * Сёрфейс карточки паттерна после ритуала. Приоритет: dev-подмена → реальная детекция.
   * «Данных мало» показываем только в день разблокировки (порог 21), чтобы не дёргать
   * пользователя пустой карточкой в последующие дни.
   */
  const maybeSurfacePattern = async (beforeLongest: number, afterLongest: number) => {
    const devPattern = readDevPatternOverride();
    if (devPattern !== null) {
      setPatternCard(
        devPattern === 'pattern'
          ? { kind: 'pattern', pattern: buildDevPattern(), applied: false }
          : { kind: 'insufficient', days: afterLongest }
      );
      return;
    }

    const ps = await compassService.getPatternState();
    const justUnlocked = beforeLongest < UNLOCK_DAYS.patterns && afterLongest >= UNLOCK_DAYS.patterns;
    if (ps.unlocked && ps.pattern && ps.isNew) {
      compassService.markPatternSeen(ps.pattern);
      setPatternCard({ kind: 'pattern', pattern: ps.pattern, applied: false });
    } else if (ps.unlocked && !ps.pattern && justUnlocked) {
      setPatternCard({ kind: 'insufficient', days: afterLongest });
    }
  };

  const handleApplyPattern = (pattern: TimeOfDayPattern) => {
    compassService.applyPattern(pattern);
    setPatternCard({ kind: 'pattern', pattern, applied: true });
  };

  const handleDismissPattern = (pattern: TimeOfDayPattern) => {
    compassService.dismissPattern(pattern);
    setPatternCard(null);
  };

  /** «Попробовать сейчас» — открыть плеер практики напрямую, минуя ритуал. */
  const handleTryPatternNow = (pattern: TimeOfDayPattern) => {
    navigate(`/practice/${pattern.practiceId}`);
  };

  /** «Напомнить» — разовое уведомление на время паттерна (тап → плеер практики). */
  const handleRemindPattern = async (pattern: TimeOfDayPattern) => {
    await requestPermissions();
    await schedulePatternReminder(pattern.reminder.hour, pattern.reminder.minute, pattern.practiceId);
  };

  const handleFeedback = async (value: EveningFeedback) => {
    if (!todayEntry) return;
    setFeedback(value);
    const updated = await compassService.saveEveningFeedback(todayEntry.date, value);
    if (updated) setTodayEntry(updated);
  };

  const handleNoOil = () => {
    const alt = Array.from(ownedOilIds)
      .map((id) => findOilById(id))
      .find((oil) => oil !== undefined);
    if (alt) {
      setSubstitution(`«${alt.name}» тоже подойдёт: ${alt.instruction}`);
    } else {
      setSubstitution(
        'Телесный якорь: потри ладони друг о друга, чтобы согреть их, поднеси к лицу и дыши 4-4-6.'
      );
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    setSttError(null);
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setSttError('Голосовой ввод недоступен в этом браузере.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/ogg' });
        chunksRef.current = [];
        setIsRecording(false);
        if (blob.size === 0) return;
        setSttBusy(true);
        try {
          const audioBase64 = await blobToBase64(blob);
          const res = await fetch('/api/stt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64, mimeType: blob.type || 'audio/ogg' }),
          });
          const data = await res.json();
          if (res.ok && data.text) {
            setInput((prev) => (prev ? `${prev} ${data.text}`.trim() : data.text));
          } else {
            setSttError(!data.text ? 'Голосовой ввод пока недоступен.' : (data.error || 'Не удалось распознать речь.'));
          }
        } catch {
          setSttError('Ошибка сети при распознавании.');
        } finally {
          setSttBusy(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setSttError('Нет доступа к микрофону. Разрешите доступ и попробуйте ещё раз.');
    }
  };

  const oil = todayEntry?.aromaId ? findOilById(todayEntry.aromaId) : undefined;
  const dominantLabel = todayEntry ? EMOTION_LABELS[todayEntry.dominant] : '';
  const hasRecommendedOil = todayEntry?.aromaId ? ownedOilIds.has(todayEntry.aromaId) : true;

  // Практика дня: детерминированный выбор по доминирующей эмоции + бан «не помогло».
  const practiceId = useMemo(() => {
    if (!todayEntry) return null;
    return selectPractice(
      todayEntry.dominant,
      undefined,
      bannedPracticeIds(getPracticeFeedbackEntries(user?.uid ?? 'guest'), new Date())
    );
  }, [todayEntry, user?.uid]);
  const practice = practiceId ? PRACTICE_BY_ID[practiceId] : null;
  const partialSession = useMemo(
    () => getTodayPartialSession(user?.uid ?? 'guest'),
    [user?.uid, todayEntry]
  );

  // «Красная зона» — экран экстренной помощи вместо стандартного инсайта.
  if (crisis) {
    return (
      <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 shadow-sm border border-red-200 dark:border-red-500/30">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-3xl text-red-500">favorite</span>
          <h2 className="text-lg font-bold text-forest dark:text-white">
            Мне жаль, что тебе сейчас так тяжело
          </h2>
        </div>
        <p className="text-sm text-sage dark:text-gray-300 leading-relaxed">
          Я всего лишь приложение и не могу заменить специалиста. Если тебе сейчас очень плохо —
          пожалуйста, обратись за помощью. Ты не один.
        </p>

        <div className="mt-4 space-y-2">
          {CRISIS_RESOURCES.map((r) => (
            <a
              key={r.name}
              href={`tel:${r.phone.replace(/[^+\d]/g, '')}`}
              className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 active:scale-[0.98] transition-transform"
            >
              <div className="pr-3">
                <p className="text-sm font-bold text-forest dark:text-white">{r.name}</p>
                <p className="text-sm text-primary font-semibold mt-0.5">{r.phone}</p>
              </div>
              <span className="material-symbols-outlined text-red-500">call</span>
            </a>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-primary/5 border border-primary/20 p-4">
          <p className="text-xs font-bold text-forest dark:text-white uppercase tracking-wider mb-2">
            Техника заземления {GROUNDING_EXERCISES[0].title}
          </p>
          <p className="text-sm text-sage dark:text-gray-300 leading-relaxed">
            {GROUNDING_EXERCISES[0].text}
          </p>
        </div>

        <button
          onClick={() => setCrisis(false)}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-forest dark:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Вернуться к ритуалу
        </button>
      </div>
    );
  }

  return (
    <>
      {!todayEntry ? (
        <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-forest dark:text-white">Как вы себя чувствуете сейчас?</h2>
          <p className="text-sm text-sage dark:text-gray-400 mt-1 mb-4">
            Опишите состояние своими словами — мы подберём одно масло и напишем персональное напутствие.
          </p>

          {/* Выбор способа ввода: писать / говорить / кнопки */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => setMode('tap')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${
                mode === 'tap'
                  ? 'bg-white dark:bg-[#2a2a2a] text-forest dark:text-white shadow'
                  : 'text-sage dark:text-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-base">edit</span>
              Писать
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${
                mode === 'voice'
                  ? 'bg-white dark:bg-[#2a2a2a] text-forest dark:text-white shadow'
                  : 'text-sage dark:text-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-base">mic</span>
              Говорить
            </button>
            <button
              onClick={() => setMode('quick')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${
                mode === 'quick'
                  ? 'bg-white dark:bg-[#2a2a2a] text-forest dark:text-white shadow'
                  : 'text-sage dark:text-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-base">apps</span>
              Кнопки
            </button>
          </div>

          {mode === 'tap' ? (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Например: мне тревожно перед встречей"
              rows={3}
              className="w-full mt-3 bg-gray-100 dark:bg-gray-800 text-forest dark:text-white px-4 py-3 rounded-xl font-medium outline-none resize-none focus:ring-2 focus:ring-primary/50"
            />
          ) : mode === 'voice' ? (
            <>
              <button
                onClick={toggleRecording}
                disabled={sttBusy}
                className={`mt-3 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 dark:bg-gray-800 text-forest dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                } disabled:opacity-60`}
              >
                <span className={`material-symbols-outlined text-lg ${sttBusy ? 'animate-spin' : ''}`}>
                  {sttBusy ? 'progress_activity' : isRecording ? 'mic' : 'mic_none'}
                </span>
                {isRecording ? 'Остановить запись' : 'Сказать голосом'}
              </button>
              {input.trim() && (
                <div className="mt-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-forest dark:text-gray-200">
                  {input}
                </div>
              )}
            </>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {QUICK_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => quickSubmit(opt.text)}
                  disabled={submitting}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="font-bold text-sm text-forest dark:text-white">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {(sttError || error) && (
            <p className="text-xs text-red-500 font-medium mt-2">{sttError || error}</p>
          )}

          {mode !== 'quick' && (
            <button
              onClick={handleSubmit}
              disabled={submitting || !input.trim()}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-md shadow-primary/20"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  <span>Подбираем масло...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">spa</span>
                  <span>Получить рекомендацию</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Результат */}
          <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 text-white flex items-center justify-center shrink-0 shadow-md">
                <span className="material-symbols-outlined text-2xl">{oil?.icon ?? 'spa'}</span>
              </div>
              <div>
                <p className="text-xs text-sage dark:text-gray-400 font-medium uppercase tracking-wider">Рекомендуемое масло</p>
                <h2 className="text-xl font-extrabold text-forest dark:text-white">{todayEntry.aroma}</h2>
              </div>
            </div>

            {profile && (
              <div className="mb-4">
                <PlutchikWheel vector={todayEntry.plutchikInferred} baseline={profile.baseline} size={280} />
                <p className="text-center text-sm font-bold text-forest dark:text-white mt-3">
                  Доминанта: <span className="text-primary">{dominantLabel}</span>
                </p>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-sm text-forest/90 dark:text-gray-200 leading-relaxed">
                <span className="font-bold">Почему это масло:</span> {todayEntry.aromaReason}
              </p>
              <p className="text-sm text-forest/80 dark:text-gray-300 leading-relaxed">
                <span className="font-bold">Напутствие:</span> {todayEntry.insight}
              </p>
              {oil?.instruction && (
                <p className="text-xs text-sage dark:text-gray-400 italic flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">touch_app</span>
                  {oil.instruction}
                </p>
              )}
            </div>

            {/* «Нет под рукой» — подмена альтернативой из аптечки или телесным якорем */}
            {!hasRecommendedOil && !substitution && (
              <button
                onClick={handleNoOil}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-sage dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-base">remove_circle_outline</span>
                Нет под рукой
              </button>
            )}
            {substitution && (
              <div className="mt-3 rounded-xl bg-primary/5 border border-primary/20 p-3">
                <p className="text-sm text-forest/80 dark:text-gray-300 leading-relaxed">{substitution}</p>
              </div>
            )}

            {!isOnline && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3 py-2">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base">cloud_off</span>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Синхронизируемся, когда появится сеть</p>
              </div>
            )}

            {todayEntry?.tomorrowTeaser && (
              <div className="mt-3 rounded-xl bg-primary/5 border border-primary/20 p-3">
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">Завтра</p>
                <p className="text-sm text-forest/80 dark:text-gray-300 leading-relaxed">{todayEntry.tomorrowTeaser}</p>
              </div>
            )}

            {/* Практика дня — детерминированный выбор по эмоции (бан «не помогло» учитывается) */}
            {practice && (
              <button
                onClick={() => navigate(`/practice/${practice.id}`)}
                className="w-full mt-4 flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all shadow-md shadow-primary/20"
              >
                <span className="material-symbols-outlined">{practice.icon}</span>
                <span className="flex-1 text-left">
                  <span className="block text-sm font-extrabold">Практика дня: {practice.title}</span>
                  <span className="block text-xs font-medium opacity-80">
                    {practice.wave} · {practice.durationSeconds} сек
                  </span>
                </span>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            )}

            {/* Пульс дня — повторный микро-чекин состояния в течение дня */}
            <div className="mt-4">
              <PulseCheckIn
                uid={user?.uid ?? 'guest'}
                entry={todayEntry}
                morningPracticeId={practice?.id ?? null}
                onPulseRecorded={(entry) => setTodayEntry(entry)}
              />
            </div>
          </div>

          {/* Анонс разблокировки (сценарий 5) — показывается после ритуала, не до. */}
          {unlockNotice && (
            <div className="bg-gradient-to-br from-primary/20 to-sage/20 dark:from-primary/10 dark:to-sage/10 rounded-2xl p-4 border border-primary/30 flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-2xl shrink-0">auto_awesome</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-0.5">И кое-что новое</p>
                <p className="text-sm font-bold text-forest dark:text-white">Открылось: {unlockNotice}</p>
              </div>
            </div>
          )}

          {/* Карточка наблюдения «Паттерны» — вместо пустого баннера «Открылось». */}
          {patternCard && (
            <div className="mt-3">
              <PatternCard
                pattern={patternCard.kind === 'pattern' ? patternCard.pattern : undefined}
                days={patternCard.kind === 'insufficient' ? patternCard.days : 0}
                applied={patternCard.kind === 'pattern' ? patternCard.applied : false}
                onTryNow={patternCard.kind === 'pattern' ? handleTryPatternNow : undefined}
                onRemind={patternCard.kind === 'pattern' ? handleRemindPattern : undefined}
                onApply={patternCard.kind === 'pattern' ? handleApplyPattern : undefined}
                onDismiss={patternCard.kind === 'pattern' ? handleDismissPattern : undefined}
              />
            </div>
          )}

          {/* Вечерний фидбек */}
          <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-forest dark:text-white">Как масло сработало?</h3>
            <p className="text-sm text-sage dark:text-gray-400 mt-1 mb-4">
              {feedback
                ? 'Спасибо! Ваш отзыв учтён при следующих рекомендациях.'
                : 'Отметьте к вечеру — это поможет исключить неподходящие масла.'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {FEEDBACK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFeedback(opt.value)}
                  disabled={!!feedback}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border font-bold text-xs transition-all ${
                    feedback === opt.value
                      ? 'bg-primary text-white border-primary shadow-md'
                      : feedback
                      ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700 text-sage'
                      : 'border-gray-200 dark:border-gray-700 text-forest dark:text-gray-300 hover:bg-primary/10 active:scale-95'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {partialSession && (
              <div className="mt-3 rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-base">favorite</span>
                <p className="text-xs text-forest/80 dark:text-gray-300 leading-relaxed">
                  Сегодняшняя практика была прервана на {partialSession.progress} из{' '}
                  {PRACTICE_BY_ID[partialSession.practiceId]?.durationSeconds ?? 0} сек — это тоже забота о себе.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default DailyRitual;
