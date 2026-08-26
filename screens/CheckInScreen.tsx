import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from '../components/BottomNavBar';
import { PlutchikWheel } from '../components/PlutchikWheel';
import { compassService } from '../services/compassService';
import { findOilById } from '../data/oilDatabase';
import { EMOTION_LABELS } from '../services/recommendation/inference';
import { EveningFeedback, EmotionalGraphEntry } from '../types';

const FEEDBACK_OPTIONS: Array<{ value: EveningFeedback; label: string; icon: string }> = [
  { value: 'better', label: 'Стало лучше', icon: 'thumb_up' },
  { value: 'same', label: 'Без изменений', icon: 'remove' },
  { value: 'worse', label: 'Не помогло', icon: 'thumb_down' },
];

export const CheckInScreen: React.FC = () => {
  const navigate = useNavigate();
  const [todayEntry, setTodayEntry] = useState<EmotionalGraphEntry | null>(() =>
    compassService.getTodayEntry()
  );
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<EveningFeedback | undefined>(todayEntry?.eveningFeedback);

  const profile = compassService.getProfile();

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text) return;
    setSubmitting(true);
    setError(null);
    try {
      const entry = await compassService.generateAISynthesis(text, 'tap');
      setTodayEntry(entry);
      setFeedback(entry.eveningFeedback);
      setInput('');
    } catch (e) {
      setError('Не удалось получить рекомендацию. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedback = (value: EveningFeedback) => {
    if (!todayEntry) return;
    const updated = compassService.saveEveningFeedback(todayEntry.date, value);
    setFeedback(value);
    if (updated) setTodayEntry(updated);
  };

  const oil = todayEntry?.aromaId ? findOilById(todayEntry.aromaId) : undefined;
  const dominantLabel = todayEntry ? EMOTION_LABELS[todayEntry.dominant] : '';

  return (
    <div className="pb-28 bg-background-light dark:bg-background-dark min-h-[100dvh]">
      <header className="flex items-center p-4 pb-2 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40">
        <button onClick={() => navigate(-1)} className="text-forest dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-extrabold text-forest dark:text-white ml-2">Проверка состояния</h1>
      </header>

      <main className="px-6 mt-2 space-y-4">
        {!todayEntry ? (
          <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-forest dark:text-white">Как вы себя чувствуете сейчас?</h2>
            <p className="text-sm text-sage dark:text-gray-400 mt-1 mb-4">
              Опишите состояние своими словами — мы подберём одно масло и напишем персональное напутствие.
            </p>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Например: мне тревожно перед встречей"
              rows={3}
              className="w-full bg-gray-100 dark:bg-gray-800 text-forest dark:text-white px-4 py-3 rounded-xl font-medium outline-none resize-none focus:ring-2 focus:ring-primary/50"
            />
            {error && (
              <p className="text-xs text-red-500 font-medium mt-2">{error}</p>
            )}
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

              <div className="mb-4">
                <PlutchikWheel vector={todayEntry.plutchikInferred} baseline={profile.baseline} size={280} />
                <p className="text-center text-sm font-bold text-forest dark:text-white mt-3">
                  Доминанта: <span className="text-primary">{dominantLabel}</span>
                </p>
              </div>

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
            </div>

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
            </div>
          </>
        )}

        {/* Weekly deep check */}
        <button
          onClick={() => navigate('/weekly-check')}
          className="w-full flex items-center justify-between bg-primary/10 dark:bg-primary/5 rounded-2xl p-4 border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">insights</span>
            <div className="text-left">
              <p className="font-bold text-forest dark:text-white">Еженедельный глубокий замер</p>
              <p className="text-xs text-sage dark:text-gray-400">8 шкал эмоций для уточнения профиля</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-sage">chevron_right</span>
        </button>
      </main>

      <BottomNavBar />
    </div>
  );
};

export default CheckInScreen;
