import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TimeWheelPicker } from '../components/TimeWheelPicker';
import { compassService } from '../services/compassService';
import {
  requestPermissions,
  scheduleMorningMood,
  scheduleEveningRitual,
} from '../services/notificationService';

const RitualSetupScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [morningTime, setMorningTime] = useState('08:00');
  const [eveningTime, setEveningTime] = useState('21:00');
  const [preferredInput, setPreferredInput] = useState<'tap' | 'voice'>('tap');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    setSaving(true);
    const uid = user?.uid || 'guest';

    // Сохраняем предпочтительный способ ввода в ежедневном ритуале.
    compassService.setCurrentUserId(uid);
    compassService.savePreferredInput(preferredInput);

    // Сохраняем время ритуалов и включаем соответствующие напоминания
    // (утренний настрой + вечерний чек-ин) — единый контур с экраном уведомлений.
    try {
      if (uid !== 'guest') {
        const current = JSON.parse(localStorage.getItem(`app_notifications_${uid}`) || '{}');
        localStorage.setItem(
          `app_notifications_${uid}`,
          JSON.stringify({
            ...current,
            morningTime,
            eveningTime,
            morningMood: true,
            eveningRitual: true,
          })
        );
      }
    } catch (e) {
      console.warn('Failed to persist ritual times:', e);
    }

    // Планируем напоминания (в браузере LocalNotifications — no-op, ошибки глотаем).
    await requestPermissions();
    await scheduleMorningMood(morningTime);
    await scheduleEveningRitual(eveningTime);

    setSaving(false);
    navigate('/quiz');
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-background-light dark:bg-background-dark font-display">
      <header className="flex items-center p-4 pb-2">
        <h2 className="text-forest dark:text-white text-lg font-bold flex-1 text-center">
          Настройка ритуалов
        </h2>
      </header>

      <main className="flex-1 overflow-y-auto px-6">
        <div className="pt-4 text-center">
          <h1 className="text-forest dark:text-white text-3xl font-extrabold leading-tight">
            Выберите время для ежедневных ритуалов
          </h1>
          <p className="mt-3 text-sage dark:text-gray-400 text-base">
            Утром — короткий настрой на день, вечером — подведение итогов. Время можно будет
            изменить позже.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          <section className="rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500 text-3xl">wb_sunny</span>
              <div>
                <h3 className="font-bold text-forest dark:text-white text-lg">Утренний ритуал</h3>
                <p className="text-sage dark:text-gray-400 text-sm">Арома-настрой и вдох на день</p>
              </div>
            </div>
            <div className="mt-5 flex justify-center">
              <TimeWheelPicker value={morningTime} onChange={setMorningTime} />
            </div>
          </section>

          <section className="rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-indigo-400 text-3xl">nights_stay</span>
              <div>
                <h3 className="font-bold text-forest dark:text-white text-lg">Вечерний ритуал</h3>
                <p className="text-sage dark:text-gray-400 text-sm">Итоги дня и бережное завершение</p>
              </div>
            </div>
            <div className="mt-5 flex justify-center">
              <TimeWheelPicker value={eveningTime} onChange={setEveningTime} />
            </div>
          </section>

          <section className="rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">edit_note</span>
              <div>
                <h3 className="font-bold text-forest dark:text-white text-lg">Как делиться состоянием?</h3>
                <p className="text-sage dark:text-gray-400 text-sm">Можно изменить в любой момент</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setPreferredInput('tap')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                  preferredInput === 'tap'
                    ? 'border-primary bg-primary/10 text-forest dark:text-white'
                    : 'border-gray-200 dark:border-gray-700 text-sage dark:text-gray-400'
                }`}
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Писать
              </button>
              <button
                onClick={() => setPreferredInput('voice')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                  preferredInput === 'voice'
                    ? 'border-primary bg-primary/10 text-forest dark:text-white'
                    : 'border-gray-200 dark:border-gray-700 text-sage dark:text-gray-400'
                }`}
              >
                <span className="material-symbols-outlined text-base">mic</span>
                Говорить
              </button>
            </div>
          </section>
        </div>
      </main>

      <footer className="p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-transparent">
        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full flex h-14 items-center justify-center rounded-xl bg-primary text-forest text-lg font-extrabold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          <span>{saving ? 'Сохраняем…' : 'Продолжить'}</span>
        </button>
      </footer>
    </div>
  );
};

export default RitualSetupScreen;
