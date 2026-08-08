import React, { useState, useEffect } from 'react';

interface AromaBreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  oilName: string;
  practiceText: string;
}

type Phase = 'prep' | 'inhale' | 'hold' | 'exhale' | 'completed';

export const AromaBreathingModal: React.FC<AromaBreathingModalProps> = ({
  isOpen,
  onClose,
  oilName,
  practiceText,
}) => {
  const [phase, setPhase] = useState<Phase>('prep');
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [cycle, setCycle] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      setPhase('prep');
      setSecondsLeft(60);
      setCycle(1);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || phase === 'prep' || phase === 'completed') return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setPhase('completed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, phase]);

  // Breathing pattern loop: 4s Inhale -> 4s Hold -> 6s Exhale (14s cycle * 4 = ~56s)
  useEffect(() => {
    if (!isOpen || phase === 'prep' || phase === 'completed') return;

    let timeoutId: NodeJS.Timeout;

    const runCycle = () => {
      setPhase('inhale');
      timeoutId = setTimeout(() => {
        setPhase('hold');
        timeoutId = setTimeout(() => {
          setPhase('exhale');
          timeoutId = setTimeout(() => {
            setCycle((c) => c + 1);
            if (secondsLeft > 10) {
              runCycle();
            } else {
              setPhase('completed');
            }
          }, 6000); // Exhale 6s
        }, 4000); // Hold 4s
      }, 4000); // Inhale 4s
    };

    runCycle();

    return () => clearTimeout(timeoutId);
  }, [isOpen, phase === 'prep']);

  if (!isOpen) return null;

  const getPhaseTitle = () => {
    switch (phase) {
      case 'prep': return 'Приготовьте масло';
      case 'inhale': return 'Вдох с ладоней... 🌬️';
      case 'hold': return 'Задержка и осознание... ✨';
      case 'exhale': return 'Плавный глубокий выдох... 🍃';
      case 'completed': return 'Практика завершена! 🌸';
    }
  };

  const getPhaseSubtitle = () => {
    switch (phase) {
      case 'prep': return practiceText;
      case 'inhale': return 'Медленно наполняйте легкие ароматом (4 сек)';
      case 'hold': return 'Почувствуйте как масло наполняет спокойствием (4 сек)';
      case 'exhale': return 'Отпускайте всё напряжение из тела (6 сек)';
      case 'completed': return `Вы отлично позаботились о себе. Аромат ${oilName} останется вашим якорем безопасности.`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#1a2d18] w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl border border-white/20 relative overflow-hidden flex flex-col items-center">
        
        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full transition-colors z-20"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {/* Top badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
          <span className="material-symbols-outlined text-sm">spa</span>
          {oilName}
        </div>

        {/* Animated breathing circle */}
        <div className="relative size-44 flex items-center justify-center my-4">
          {/* Outer glow ring */}
          <div 
            className={`absolute inset-0 rounded-full bg-primary/20 transition-all duration-1000 ease-in-out ${
              phase === 'inhale' ? 'scale-125 opacity-100 bg-primary/40' :
              phase === 'hold' ? 'scale-125 opacity-80 bg-amber-400/30' :
              phase === 'exhale' ? 'scale-90 opacity-30 bg-primary/10' : 'scale-100 opacity-20'
            }`}
          />
          
          {/* Inner pulsating core */}
          <div 
            className={`size-32 rounded-full bg-gradient-to-tr from-primary via-emerald-400 to-teal-300 flex flex-col items-center justify-center text-white shadow-xl transition-all duration-[4000ms] ease-in-out ${
              phase === 'inhale' ? 'scale-110 shadow-primary/50' :
              phase === 'hold' ? 'scale-110 shadow-amber-300/50' :
              phase === 'exhale' ? 'scale-90 shadow-none' : 'scale-100'
            }`}
          >
            {phase === 'prep' ? (
              <span className="material-symbols-outlined text-4xl">air</span>
            ) : phase === 'completed' ? (
              <span className="material-symbols-outlined text-5xl">task_alt</span>
            ) : (
              <div className="text-center">
                <p className="text-3xl font-extrabold">{secondsLeft}</p>
                <p className="text-[10px] uppercase font-bold opacity-80">сек</p>
              </div>
            )}
          </div>
        </div>

        {/* Instruction text */}
        <h3 className="text-xl font-extrabold text-forest dark:text-white mt-2 transition-all">
          {getPhaseTitle()}
        </h3>
        <p className="text-sm text-sage dark:text-gray-300 mt-2 px-2 min-h-[40px]">
          {getPhaseSubtitle()}
        </p>

        {/* Action Button */}
        <div className="w-full mt-6">
          {phase === 'prep' && (
            <button
              onClick={() => setPhase('inhale')}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">play_arrow</span>
              Начать 1-мин ингаляцию
            </button>
          )}

          {(phase === 'inhale' || phase === 'hold' || phase === 'exhale') && (
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-1000 ease-linear"
                style={{ width: `${((60 - secondsLeft) / 60) * 100}%` }}
              />
            </div>
          )}

          {phase === 'completed' && (
            <button
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-all"
            >
              Сохранить состояние ✨
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
