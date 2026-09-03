import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from '../components/BottomNavBar';
import DailyRitual from '../components/DailyRitual';

/** Экран «Проверка состояния»: тот же ежедневный ритуал, но с заголовком и кнопкой назад. */
export const CheckInScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-28 bg-background-light dark:bg-background-dark min-h-[100dvh]">
      <header className="flex items-center p-4 pb-2 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40">
        <button onClick={() => navigate(-1)} className="text-forest dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-extrabold text-forest dark:text-white ml-2">Проверка состояния</h1>
      </header>

      <main className="px-6 mt-2 space-y-4">
        <DailyRitual />
      </main>

      <BottomNavBar />
    </div>
  );
};

export default CheckInScreen;
