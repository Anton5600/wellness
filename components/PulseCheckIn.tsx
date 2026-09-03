import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmotionalGraphEntry, PracticeId, PulseEntry, PulseScenario, PracticeFeedback } from '../types';
import { compassService } from '../services/compassService';
import { selectPractice, bannedPracticeIds, inferArousal } from '../services/recommendation/practice';
import { pulseGate, PULSE_CONFIG } from '../services/recommendation/pulse';
import { EMOTION_LABELS } from '../services/recommendation/inference';
import { PRACTICE_BY_ID } from '../data/practices';
import {
  getPracticeFeedbackEntries,
  recordPracticeFeedback,
  getPracticeUpdateCount,
  incrementPracticeUpdate,
} from '../services/practiceMemory';

const QUICK_OPTIONS: Array<{ text: string; label: string; emoji: string }> = [
  { text: 'радостно, отлично', label: 'Норм', emoji: '🟢' },
  { text: 'устал, тяжело', label: 'Так себе', emoji: '🟡' },
  { text: 'тревожно, страшно', label: 'Тяжело', emoji: '🔴' },
];

const CARE_OPTIONS: Array<{ action: 'break' | 'water' | 'move' | 'silence'; label: string; icon: string }> = [
  { action: 'break', label: 'Перерыв', icon: 'coffee' },
  { action: 'water', label: 'Вода', icon: 'water_drop' },
  { action: 'move', label: 'Движение', icon: 'directions_walk' },
  { action: 'silence', label: 'Тишина', icon: 'volume_off' },
];

interface PulseResult {
  pulse: PulseEntry;
  scenario: PulseScenario;
  /** Практика под текущий (пульсовый) доминант — для сценария B и «Обновить практику дня». */
  practiceId: PracticeId;
}

interface PulseCheckInProps {
  uid: string;
  entry: EmotionalGraphEntry;
  /** Практика, выбранная утренним якорным ритуалом. */
  morningPracticeId: PracticeId | null;
  onPulseRecorded: (entry: EmotionalGraphEntry) => void;
}

/**
 * «Пульс дня» — повторный микро-чекин состояния в течение дня.
 * Сравнивает текущее состояние с утренним (Δ) и разворачивается в сценарий
 * A (стабильно) / B (резкий сдвиг), с защитой от тревожного трекинга (кулдаун/лимит).
 */
export const PulseCheckIn: React.FC<PulseCheckInProps> = ({
  uid,
  entry,
  morningPracticeId,
  onPulseRecorded,
}) => {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<'idle' | 'input' | 'result'>('idle');
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateMsg, setGateMsg] = useState<string | null>(null);
  const [result, setResult] = useState<PulseResult | null>(null);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [updateUsed, setUpdateUsed] = useState(false);

  const pulseCount = entry.pulses?.length ?? 0;
  const focusCare = pulseCount + 1 >= PULSE_CONFIG.focusSwitchAfter;
  const todayDate = entry.date;

  const dominantLabel = result ? EMOTION_LABELS[result.pulse.dominant] : '';
  const emergencyPractice = result ? PRACTICE_BY_ID[result.practiceId] : null;

  const handleOpen = () => {
    setGateMsg(null);
    const gate = pulseGate(entry.pulses ?? [], Date.now());
    if (!gate.allowed) {
      setGateMsg(
        gate.reason === 'cooldown'
          ? `Ты уже проверял пульс недавно. Дай практике подействовать — ещё около ${gate.cooldownRemaining} мин.`
          : 'Сегодня было много эмоций. Давай завершим день одним вечерним дыханием.'
      );
      return;
    }
    setInput('');
    setError(null);
    setPhase('input');
  };

  const submit = async (
    text: string,
    inputType: 'tap' | 'quick' = 'tap',
    careAction?: 'break' | 'water' | 'move' | 'silence'
  ) => {
    const trimmed = text.trim();
    if (!trimmed && !careAction) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await compassService.recordPulse(trimmed || '', inputType, careAction);
      if ('gate' in res) {
        setPhase('idle');
        setGateMsg(
          res.gate === 'cooldown'
            ? 'Ты уже проверял пульс недавно. Дай практике подействовать.'
            : 'Сегодня было много эмоций. Давай завершим день одним вечерним дыханием.'
        );
        return;
      }
      const practiceId = selectPractice(
        res.pulse.dominant,
        undefined,
        bannedPracticeIds(getPracticeFeedbackEntries(uid), new Date())
      );
      setResult({ pulse: res.pulse, scenario: res.scenario, practiceId });
      setFeedback(null);
      setPhase('result');
      onPulseRecorded(res.entry);
    } catch {
      setError('Не удалось записать пульс. Попробуйте ещё раз.');
      setPhase('input');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedback = (value: PracticeFeedback) => {
    if (!result) return;
    setFeedback(value);
    recordPracticeFeedback(uid, {
      practiceId: result.practiceId,
      dominant: result.pulse.dominant,
      arousal: inferArousal(result.pulse.dominant),
      feedback: value,
      timestamp: Date.now(),
    });
  };

  const handleUpdatePractice = () => {
    if (!result || updateUsed) return;
    const count = getPracticeUpdateCount(uid, todayDate);
    if (count >= 1) {
      setUpdateUsed(true);
      return;
    }
    incrementPracticeUpdate(uid, todayDate);
    setUpdateUsed(true);
    navigate(`/practice/${result.practiceId}`);
  };

  const resetToIdle = () => {
    setPhase('idle');
    setResult(null);
    setFeedback(null);
    setGateMsg(null);
  };

  if (phase === 'idle') {
    return (
      <div className="space-y-2">
        <button
          onClick={handleOpen}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-forest dark:text-white border border-dashed border-sage/40 dark:border-gray-700 hover:bg-primary/5 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-base">monitor_heart</span>
          Пульс дня
        </button>
        {gateMsg && (
          <p className="text-xs text-sage dark:text-gray-400 font-medium text-center">{gateMsg}</p>
        )}
      </div>
    );
  }

  if (phase === 'input') {
    return (
      <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-xl">monitor_heart</span>
          <h3 className="text-base font-bold text-forest dark:text-white">Пульс дня</h3>
        </div>

        {focusCare ? (
          <>
            <p className="text-sm text-sage dark:text-gray-400 mb-3">Что тебе сейчас нужно?</p>
            <div className="grid grid-cols-2 gap-2">
              {CARE_OPTIONS.map((opt) => (
                <button
                  key={opt.action}
                  onClick={() => submit(opt.label, 'quick', opt.action)}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">{opt.icon}</span>
                  <span className="font-bold text-sm text-forest dark:text-white">{opt.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-sage dark:text-gray-400 mb-3">Что изменилось с утра?</p>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Одно слово или короткая фраза"
              rows={2}
              className="w-full bg-gray-100 dark:bg-gray-800 text-forest dark:text-white px-4 py-3 rounded-xl font-medium outline-none resize-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {QUICK_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => submit(opt.text, 'quick')}
                  disabled={submitting}
                  className="flex flex-col items-center gap-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="font-bold text-xs text-forest dark:text-white">{opt.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => submit(input)}
              disabled={submitting || !input.trim()}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              {submitting ? (
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-base">monitor_heart</span>
              )}
              Записать пульс
            </button>
          </>
        )}

        {error && <p className="text-xs text-red-500 font-medium mt-2">{error}</p>}
      </div>
    );
  }

  // phase === 'result'
  return (
    <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary text-xl">
          {result?.scenario === 'shift' ? 'bolt' : 'check_circle'}
        </span>
        <h3 className="text-base font-bold text-forest dark:text-white">
          {result?.scenario === 'shift' ? 'Состояние изменилось' : 'Состояние стабильно'}
        </h3>
      </div>

      {result?.scenario === 'stable' ? (
        <>
          <p className="text-sm text-forest/80 dark:text-gray-300 leading-relaxed">
            {dominantLabel} немного фонит, но ты справляешься. Утренняя практика всё ещё твой якорь.
          </p>
          <div className="mt-4 space-y-2">
            {morningPracticeId && (
              <button
                onClick={() => navigate(`/practice/${morningPracticeId}`)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-forest dark:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-base">self_improvement</span>
                Повторить практику
              </button>
            )}
            <button
              onClick={resetToIdle}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-sage dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 active:scale-[0.98] transition-all"
            >
              Просто продолжить день
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-forest/80 dark:text-gray-300 leading-relaxed">
            Похоже, что-то выбило тебя из колеи. Дай себе минуту вернуться в тело.
          </p>

          {emergencyPractice && (
            <button
              onClick={() => navigate(`/practice/${emergencyPractice.id}`)}
              className="w-full mt-4 flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all shadow-md shadow-primary/20"
            >
              <span className="material-symbols-outlined">{emergencyPractice.icon}</span>
              <span className="flex-1 text-left">
                <span className="block text-sm font-extrabold">{emergencyPractice.title}</span>
                <span className="block text-xs font-medium opacity-80">
                  {emergencyPractice.wave} · {emergencyPractice.durationSeconds} сек
                </span>
              </span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          )}

          <p className="mt-3 text-xs text-sage dark:text-gray-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">spa</span>
            Масло дня остаётся: {entry.aroma}
          </p>

          {/* Сценарий В: переиграть практику дня (максимум 1 раз) */}
          <button
            onClick={handleUpdatePractice}
            disabled={updateUsed}
            className={`w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
              updateUsed
                ? 'text-sage dark:text-gray-500 cursor-not-allowed opacity-60'
                : 'text-forest dark:text-white border border-dashed border-gray-300 dark:border-gray-700 hover:bg-primary/5 active:scale-[0.98]'
            }`}
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            {updateUsed ? 'Практика дня обновлена' : 'Обновить практику дня'}
          </button>

          {/* Пульс-фидбек: влияет на рейтинг практики, но не банит масло дня */}
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-sage dark:text-gray-400 mb-2">
              Помогла ли практика?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleFeedback('helped')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                  feedback === 'helped'
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'border-gray-200 dark:border-gray-700 text-forest dark:text-gray-300 hover:bg-emerald-500/10 active:scale-95'
                }`}
              >
                <span className="material-symbols-outlined text-base">thumb_up</span>
                Помогло
              </button>
              <button
                onClick={() => handleFeedback('not_helped')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                  feedback === 'not_helped'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'border-gray-200 dark:border-gray-700 text-forest dark:text-gray-300 hover:bg-amber-500/10 active:scale-95'
                }`}
              >
                <span className="material-symbols-outlined text-base">thumb_down</span>
                Не помогло
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PulseCheckIn;
