import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from '../components/BottomNavBar';
import { GROUNDING_EXERCISES, CRISIS_RESOURCES } from '../data/crisis';

export const ResourcesScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-28 bg-background-light dark:bg-background-dark min-h-[100dvh]">
      <header className="flex items-center p-4 pb-2 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40">
        <button onClick={() => navigate(-1)} className="text-forest dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-extrabold text-forest dark:text-white ml-2">Ресурсы помощи</h1>
      </header>

      <main className="px-6 mt-2 space-y-5">
        <div className="bg-gradient-to-tr from-primary/15 to-emerald-400/15 rounded-2xl p-5 border border-primary/20">
          <p className="text-forest dark:text-white font-bold text-base leading-snug">
            Затяжной спад — это не сбой, а сигнал замедлиться.
          </p>
          <p className="text-sm text-sage dark:text-gray-300 mt-2 leading-relaxed">
            Если несколько дней подряд вы фиксируете тревогу, грусть или усталость — это повод проявить к себе
            бережность. Ниже — простые практики, которые помогают вернуться в тело, и контакты, если нужна помощь рядом.
          </p>
        </div>

        <section>
          <h2 className="text-sm font-bold text-sage dark:text-gray-400 uppercase tracking-wider mb-3">Практики самопомощи</h2>
          <div className="space-y-3">
            {GROUNDING_EXERCISES.map((ex) => (
              <div key={ex.title} className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex gap-3">
                <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">{ex.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-forest dark:text-white">{ex.title}</p>
                  <p className="text-sm text-sage dark:text-gray-400 mt-1 leading-relaxed">{ex.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-sage dark:text-gray-400 uppercase tracking-wider mb-3">Кризисные контакты</h2>
          <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            {CRISIS_RESOURCES.map((r) => (
              <div key={r.name} className="flex items-center justify-between p-4">
                <div className="pr-3">
                  <p className="text-sm font-bold text-forest dark:text-white">{r.name}</p>
                  <p className="text-sm text-primary font-semibold mt-0.5">{r.phone}</p>
                </div>
                <a
                  href={`tel:${r.phone.replace(/[^+\d]/g, '')}`}
                  className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-primary">call</span>
                </a>
              </div>
            ))}
          </div>
          <p className="text-xs text-sage dark:text-gray-500 mt-2 leading-relaxed">
            Если вы чувствуете, что не справляетесь, — обратитесь к специалисту. Это не слабость, а забота о себе.
          </p>
        </section>
      </main>

      <BottomNavBar />
    </div>
  );
};

export default ResourcesScreen;
