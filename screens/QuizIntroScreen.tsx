
import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuizIntroScreen: React.FC = () => {
    const navigate = useNavigate();

    const steps = [
        { name: 'Настройка', icon: 'filter_vintage' },
        { name: 'Оценка', icon: 'straighten' },
        { name: 'Глубина', icon: 'favorite' },
        { name: 'Анализ', icon: 'analytics' },
        { name: 'Результат', icon: 'verified' },
    ];

    return (
        <div className="relative flex h-[100dvh] w-full flex-col bg-beige-soft dark:bg-background-dark">
            <header className="flex items-center p-4 pb-2 justify-between">
                <button onClick={() => navigate(-1)} className="text-wood dark:text-gray-200 flex size-12 shrink-0 items-center justify-center cursor-pointer">
                    <span className="material-symbols-outlined">arrow_back_ios</span>
                </button>
                <h2 className="text-wood dark:text-gray-200 text-lg font-bold flex-1 text-center pr-12">Как проходит опрос</h2>
            </header>
            
            <div className="flex w-full flex-row items-center justify-center gap-3 py-4">
                <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                <div className="h-2 w-8 rounded-full bg-primary"></div>
                <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-700"></div>
            </div>
            
            <main className="flex-1 flex flex-col px-6 overflow-hidden">
                <div className="pt-4 text-center shrink-0">
                    <h1 className="text-wood dark:text-white text-2xl sm:text-3xl font-bold leading-tight">
                        Как устроен опрос
                    </h1>
                    <p className="text-wood/80 dark:text-gray-300 text-sm sm:text-base font-normal leading-relaxed mt-2">
                        Короткий тест из 5 шагов поможет определить ваше эмоциональное состояние и подобрать практики.
                    </p>
                </div>

                <div className="mt-6 mb-[calc(6rem+10vh)] py-4 px-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-wood/10 flex flex-col justify-center flex-1 max-h-[300px]">
                   <div className="flex flex-col gap-1 sm:gap-3">
                        {steps.map((step, index, arr) => (
                            <div key={step.name} className="flex relative items-start">
                                {index < arr.length - 1 && (
                                    <div className="absolute left-[19px] top-10 bottom-[-4px] sm:bottom-[-12px] w-px bg-wood/20 dark:bg-gray-700"></div>
                                )}
                                <div className={`flex items-center justify-center size-10 rounded-full shrink-0 z-10 ${index === arr.length - 1 ? 'bg-primary text-white' : 'bg-primary/30 text-wood dark:text-primary'}`}>
                                    <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                                </div>
                                <div className="flex items-center h-10 ml-4">
                                    <p className="text-wood dark:text-white text-sm sm:text-base font-semibold">{step.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="absolute bottom-0 left-0 w-full p-6 pb-[calc(10vh+env(safe-area-inset-bottom))] bg-gradient-to-t from-beige-soft dark:from-background-dark via-beige-soft dark:via-background-dark to-transparent">
                <button onClick={() => navigate('/quiz')} className="w-full bg-primary hover:bg-primary/90 text-forest font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]">
                    Продолжить
                </button>
            </footer>
        </div>
    );
};

export default QuizIntroScreen;
