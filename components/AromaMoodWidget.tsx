import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmotionHistoryEntry } from '../types';
import { 
  getAromaRecommendation, 
  AromaGoal, 
  AromaRecommendation 
} from '../services/aromaRecommendationService';
import { AromaBreathingModal } from './AromaBreathingModal';
import { useCart } from '../context/CartContext';
import { EMOTIONS } from '../constants';

interface AromaMoodWidgetProps {
  history: EmotionHistoryEntry[];
}

export const AromaMoodWidget: React.FC<AromaMoodWidgetProps> = ({ history }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [activeGoal, setActiveGoal] = useState<AromaGoal | null>(null);
  const [recommendation, setRecommendation] = useState<AromaRecommendation>(() => 
    getAromaRecommendation(history)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    setRecommendation(getAromaRecommendation(history, activeGoal || undefined));
  }, [history, activeGoal]);

  const handleGoalSelect = (goal: AromaGoal) => {
    setActiveGoal(goal);
  };

  const handleAddToCart = () => {
    addToCart(recommendation.oilId);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const latestEmotion = history.length > 0 ? EMOTIONS[history[0].emotionKey] : null;

  return (
    <div id="aroma-widget" className="bg-gradient-to-br from-emerald-950/20 via-white to-primary/5 dark:from-[#1a2e19] dark:via-[#182617] dark:to-[#121f11] rounded-3xl p-5 border border-primary/20 shadow-xl relative overflow-hidden my-4 transition-all">
      
      {/* Toast alert when oil added to cart */}
      {addedToast && (
        <div className="absolute top-3 right-3 bg-forest text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg animate-bounce z-20">
          <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
          Масло добавлено в корзину!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">spa</span>
          </div>
          <div>
            <h3 className="text-forest dark:text-white font-extrabold text-base leading-snug">
              {recommendation.title}
            </h3>
            <p className="text-[11px] text-sage dark:text-gray-300">
              {latestEmotion ? `На основе эмоции «${latestEmotion.title}»` : 'Персональный подбор масел'}
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          recommendation.isStuckAlert && recommendation.goal === 'stuck_support'
            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
            : 'bg-primary/20 text-forest dark:text-primary'
        }`}>
          {recommendation.badge}
        </span>
      </div>

      {/* Interactive Goal Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none my-2 text-xs">
        {recommendation.isStuckAlert && (
          <button
            onClick={() => handleGoalSelect('stuck_support')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
              (activeGoal === 'stuck_support' || (!activeGoal && recommendation.goal === 'stuck_support'))
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            <span className="material-symbols-outlined text-sm">favorite</span>
            Поддержка
          </button>
        )}

        <button
          onClick={() => handleGoalSelect('morning')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
            (activeGoal === 'morning' || (!activeGoal && recommendation.goal === 'morning'))
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white/60 dark:bg-white/5 text-forest dark:text-gray-300 hover:bg-primary/10'
          }`}
        >
          ☀️ Утро
        </button>

        <button
          onClick={() => handleGoalSelect('focus')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
            activeGoal === 'focus'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white/60 dark:bg-white/5 text-forest dark:text-gray-300 hover:bg-primary/10'
          }`}
        >
          ⚡ Фокус
        </button>

        <button
          onClick={() => handleGoalSelect('antistress')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
            activeGoal === 'antistress'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white/60 dark:bg-white/5 text-forest dark:text-gray-300 hover:bg-primary/10'
          }`}
        >
          🧘 Антистресс
        </button>

        <button
          onClick={() => handleGoalSelect('evening')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
            activeGoal === 'evening'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white/60 dark:bg-white/5 text-forest dark:text-gray-300 hover:bg-primary/10'
          }`}
        >
          🌙 Вечер
        </button>
      </div>

      {/* Main Oil Card Details */}
      <div className="bg-white/80 dark:bg-[#1a2819]/90 rounded-2xl p-4 border border-sage/10 dark:border-sage/20 shadow-sm mt-1">
        <div className="flex items-start gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 text-white flex items-center justify-center shrink-0 shadow-md">
            <span className="material-symbols-outlined text-2xl">{recommendation.oilIcon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-forest dark:text-white font-extrabold text-lg leading-tight">
              {recommendation.oilName}
            </h4>
            <p className="text-xs text-sage dark:text-gray-300 mt-1 leading-relaxed">
              {recommendation.reason}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-sage/10 dark:border-sage/20 flex items-center gap-2 text-xs text-forest dark:text-gray-200">
          <span className="material-symbols-outlined text-primary text-base shrink-0">touch_app</span>
          <span className="font-medium italic">{recommendation.practice}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-primary/20"
        >
          <span className="material-symbols-outlined text-base">air</span>
          1-мин Ингаляция
        </button>

        <button
          onClick={handleAddToCart}
          className="bg-white dark:bg-[#253924] border border-primary/30 text-forest dark:text-white font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-primary/10"
        >
          <span className="material-symbols-outlined text-base text-primary">add_shopping_cart</span>
          Заказать масло
        </button>
      </div>

      {/* Interactive Breathing Modal */}
      <AromaBreathingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        oilName={recommendation.oilName}
        practiceText={recommendation.practice}
      />
    </div>
  );
};
