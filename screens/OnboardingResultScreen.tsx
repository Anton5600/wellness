import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlutchikVector, PlutchikProfile, OilEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { compassService } from '../services/compassService';
import { dominantEmotionOf } from '../services/quizService';
import { candidateShortlist } from '../services/recommendation/shortlist';
import { PlutchikWheel } from '../components/PlutchikWheel';
import BottomNavBar from '../components/BottomNavBar';

const OnboardingResultScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vector, setVector] = useState<PlutchikVector | null>(null);
  const [oil, setOil] = useState<OilEntry | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      compassService.setCurrentUserId(user?.uid);
      const profile: PlutchikProfile = await compassService.getProfile();
      if (!active) return;
      const baseline = profile.baseline;
      setVector(baseline);

      // Детерминированный (офлайн) подбор одного масла из правил движка.
      const shortlist = candidateShortlist({
        vector: baseline,
        hour: new Date().getHours(),
        feedback: [],
        dominant: dominantEmotionOf(baseline),
      });
      if (active) setOil(shortlist[0] ?? null);
    })();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background-light dark:bg-background-dark font-display">
      <main className="flex-1 overflow-y-auto px-6 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <div className="pt-10 text-center">
          <h1 className="text-forest dark:text-white text-3xl font-extrabold leading-tight">
            Ваша стартовая точка
          </h1>
          <p className="mt-3 text-sage dark:text-gray-400 text-base">
            Это ваше эмоциональное состояние прямо сейчас
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          {vector ? (
            <PlutchikWheel vector={vector} size={300} />
          ) : (
            <div className="size-[300px] animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
          )}
        </div>

        <p className="mt-8 text-center text-sage dark:text-gray-300 text-sm font-medium">
          В следующий раз твой профиль будет ещё точнее — после нескольких чек-инов мы
          откалибруем его под твои реальные состояния.
        </p>

        {oil && (
          <section className="mt-8 rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="text-forest dark:text-white text-lg font-bold">
              Рекомендуемое масло
            </h3>
            <div className="mt-4 flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                <span className="material-symbols-outlined text-3xl text-forest dark:text-primary">
                  {oil.icon}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-forest dark:text-white text-lg">{oil.name}</h4>
                <p className="text-sage dark:text-gray-400 text-sm mt-1">{oil.description}</p>
                <p className="text-sage dark:text-gray-400 text-sm mt-2 leading-relaxed">
                  {oil.instruction}
                </p>
              </div>
            </div>
          </section>
        )}

        <button
          onClick={() => navigate('/', { replace: true })}
          className="w-full mt-8 flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-forest text-lg font-extrabold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined">spa</span>
          Начать первый чек-ин
        </button>
      </main>

      <BottomNavBar />
    </div>
  );
};

export default OnboardingResultScreen;
