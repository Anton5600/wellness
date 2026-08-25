
import React from 'react';
import { useNavigate } from 'react-router-dom';

const OnboardingScreen: React.FC = () => {
    const navigate = useNavigate();

    const handleNext = () => {
        navigate('/signin');
    };

    return (
        <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark">
            <div className="absolute top-0 left-0 right-0 h-[65%]">
                <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: `url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop")` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-light/40 to-background-light dark:via-background-dark/40 dark:to-background-dark"></div>
            </div>

            <div className="relative z-10 flex h-full w-full flex-col justify-end items-center px-6 pb-10">
                <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10">
                    <div className="mb-2">
                        <h1 className="text-center text-[28px] sm:text-3xl font-extrabold leading-tight tracking-tight text-forest dark:text-white">
                            Найдите свой внутренний баланс
                        </h1>
                    </div>
                    <div className="mt-4">
                        <p className="text-center text-base sm:text-lg leading-relaxed text-sage dark:text-gray-300">
                            Обретите эмоциональное равновесие через силу природы. Начните свой путь к гармонии сегодня.
                        </p>
                    </div>
                    <div className="mt-6 flex w-full flex-row items-center justify-center gap-3">
                        <div className="h-2 w-6 rounded-full bg-primary"></div>
                        <div className="h-2 w-2 rounded-full bg-black/10 dark:bg-white/20"></div>
                        <div className="h-2 w-2 rounded-full bg-black/10 dark:bg-white/20"></div>
                    </div>
                    <div className="mt-8">
                        <button onClick={handleNext} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-forest transition-transform active:scale-[0.98] shadow-lg shadow-primary/30">
                            <span>Далее</span>
                            <span className="material-symbols-outlined ml-1 text-[20px]">arrow_forward</span>
                        </button>
                    </div>
                </div>
                <div className="mt-6 mb-2 text-center">
                    <button onClick={handleNext} className="text-sm font-medium text-sage/80 dark:text-gray-400 hover:text-primary transition-colors">
                        Пропустить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingScreen;
