import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { METAPHORIC_CARDS } from '../data/cards';
import { EMOTIONS } from '../constants';

const AdminCardsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const activeCard = selectedCard ? METAPHORIC_CARDS.find(c => c.id === selectedCard) : null;

  return (
    <div className="min-h-[100dvh] bg-background-light dark:bg-background-dark font-display pb-10">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-[#1a2d18] shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-forest dark:text-white flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-black/20">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-forest dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">view_carousel</span>
            Все карты ({METAPHORIC_CARDS.length})
          </h1>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {METAPHORIC_CARDS.map(card => {
            const emotion = card.emotionKey ? EMOTIONS[card.emotionKey as keyof typeof EMOTIONS] : null;
            return (
              <div 
                key={card.id} 
                onClick={() => setSelectedCard(card.id)}
                className="bg-white dark:bg-[#1f1f1f] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:shadow-md transition-shadow group"
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" 
                    style={{ backgroundImage: `url("${card.image}")` }}
                  />
                  {emotion && (
                    <div className={`absolute top-2 right-2 ${emotion.color} text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm`}>
                      {emotion.title}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-forest dark:text-white font-bold text-sm mb-1 line-clamp-1">{card.title}</h3>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Card Detail Modal */}
      {activeCard && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedCard(null)}
        >
          <div 
            className="bg-white dark:bg-[#1a2d18] rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl flex flex-col border border-[#e2e8e1] dark:border-sage/30"
            onClick={e => e.stopPropagation()}
          >
            {/* Upper part: Pristine Art Frame */}
            <div className="aspect-[3/4] relative w-full overflow-hidden bg-gray-900">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCard(null);
                }}
                className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 z-50 hover:bg-black/70 transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined shrink-0 block">close</span>
              </button>
              <div 
                className="absolute inset-0 bg-cover bg-center blur-md opacity-30 scale-110" 
                style={{ backgroundImage: `url("${activeCard.image}")` }}
              />
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat z-10" 
                style={{ backgroundImage: `url("${activeCard.image}")` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 z-10 pointer-events-none" />
              <div className="absolute top-4 left-4 z-20">
                <div className="bg-white/20 backdrop-blur text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm border border-white/30">
                  {activeCard.id}
                </div>
              </div>
            </div>

            {/* Lower part: Text details */}
            <div className="p-6 bg-beige-soft/30 dark:bg-black/10 flex flex-col border-t border-[#e2e8e1]/60 dark:border-sage/10">
              <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Ваша карта</p>
              <h4 className="text-forest dark:text-white text-2xl font-extrabold mb-3 leading-tight">{activeCard.title}</h4>
              <p className="text-forest/80 dark:text-gray-200 text-sm font-medium leading-relaxed border-t border-primary/10 pt-3">
                {activeCard.message}
              </p>
              {activeCard.emotionKey && (
                <div className="mt-4 flex">
                   <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${EMOTIONS[activeCard.emotionKey as keyof typeof EMOTIONS]?.color || 'bg-primary'}`}>
                      Связанная эмоция: {EMOTIONS[activeCard.emotionKey as keyof typeof EMOTIONS]?.title || activeCard.emotionKey}
                   </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCardsScreen;
