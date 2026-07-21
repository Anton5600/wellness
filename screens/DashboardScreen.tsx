
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEmotionHistory } from '../services/firestoreService';
import { EmotionHistoryEntry } from '../types';
import { EMOTIONS } from '../constants';
import BottomNavBar from '../components/BottomNavBar';
import { useCart } from '../context/CartContext';
import { METAPHORIC_CARDS, MetaphoricCard } from '../data/cards';

const LOADING_PHRASES = [
  "Настраиваем нейронные связи на дзен...",
  "Завариваем виртуальный чай, ожидайте...",
  "Собираем звезды для вашего напутствия...",
  "Синхронизируем алгоритмы с вашей аурой...",
  "Укрываем данные теплым пледом...",
  "Вслушиваемся в цифровой шепот Вселенной...",
  "Загружаем порцию доброты и спокойствия...",
  "Вычисляем траекторию внутреннего баланса...",
  "Синтезируем смысл из нулей, единиц и любви...",
  "Прогреваем серверы лучами виртуального солнца..."
];

const CartIcon: React.FC<{ navigate: any }> = ({ navigate }) => {
  const { cartCount } = useCart();
  return (
    <button 
      onClick={() => navigate('/cart')}
      className="relative flex items-center justify-center rounded-full size-10 bg-white dark:bg-sage/20 text-forest dark:text-primary active:scale-95 transition-transform"
    >
      <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full size-4 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </button>
  );
};

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<EmotionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<{text: string, author: string} | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);

  // Card of the day state
  const [cardRevealed, setCardRevealed] = useState(false);
  const [dailyCard, setDailyCard] = useState<MetaphoricCard | null>(null);
  
  const [synthesisText, setSynthesisText] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSynthesizing) {
      setLoadingPhrase(LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]);
      interval = setInterval(() => {
        setLoadingPhrase(LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSynthesizing]);

  useEffect(() => {
    if (user) {
      const todayStr = new Date().toISOString().split('T')[0];
      const savedCardData = localStorage.getItem(`dailyMetaphoricCard_${user.uid}`);
      
      if (savedCardData) {
        try {
          const parsed = JSON.parse(savedCardData);
          if (parsed.date === todayStr && parsed.card) {
            const freshCard = METAPHORIC_CARDS.find(c => c.id === parsed.card.id);
            setDailyCard(freshCard || parsed.card);
            setCardRevealed(true);
          }
        } catch (e) {
          console.error('Error parsing saved metaphoric card data', e);
        }
      }
    }
  }, [user]);

  const drawCard = () => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const randomIndex = Math.floor(Math.random() * METAPHORIC_CARDS.length);
    const card = METAPHORIC_CARDS[randomIndex];
    setDailyCard(card);
    setCardRevealed(true);
    localStorage.setItem(`dailyMetaphoricCard_${user.uid}`, JSON.stringify({
      date: todayStr,
      card
    }));
  };

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        // Используем прокси allorigins для обхода CORS и блокировки HTTP (Mixed Content)
        const targetUrl = encodeURIComponent('http://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=ru');
        const response = await fetch(`https://api.allorigins.win/get?url=${targetUrl}`);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        
        // Forismatic иногда возвращает некорректный JSON (например, с неэкранированными кавычками)
        const cleanJson = data.contents.replace(/\\'/g, "'");
        const parsedData = JSON.parse(cleanJson);
        
        setQuote({
          text: parsedData.quoteText,
          author: parsedData.quoteAuthor || 'Неизвестный автор'
        });
      } catch (error) {
        console.error("Ошибка при загрузке цитаты:", error);
        // Резервная цитата на случай, если API недоступно
        setQuote({
          text: "Улыбнись миру, и он улыбнется тебе в ответ.",
          author: "Народная мудрость"
        });
      } finally {
        setQuoteLoading(false);
      }
    };

    fetchQuote();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (user) {
        setLoading(true);
        const userHistory = await getEmotionHistory(user.uid);
        setHistory(userHistory);
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const latestEmotion = history.length > 0 ? EMOTIONS[history[0].emotionKey] : null;

  const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return 'Сегодня';
      if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
      
      const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 4 && diffDays > 1) return `${diffDays} дня назад`;
      if (diffDays === 1) return `1 день назад`;
      
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  }

  const handleSynthesis = async () => {
    if (!latestEmotion || !dailyCard) return;
    setIsSynthesizing(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/gemini/synthesis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testResult: latestEmotion, card: dailyCard, quote })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        alert(data.error || "Произошла ошибка при синтезе.");
      } else if (data.result) {
        setSynthesisText(data.result);
      }
    } catch (e) {
      console.error(e);
      alert("Ошибка сети при запросе синтеза.");
    } finally {
      setIsSynthesizing(false);
    }
  }

  return (
    <div className="pb-28 bg-background-light dark:bg-background-dark min-h-[100dvh]">
      <header className="flex items-center p-6 pb-2 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center">
              <div className="bg-center bg-no-repeat aspect-square w-full bg-cover rounded-full border-2 border-primary" style={{backgroundImage: `url("https://storage.googleapis.com/aida-static/doterra/avatar.jpg")`}}></div>
          </div>
          <div className="flex-1">
              <p className="text-sage dark:text-[#a0c09d] text-xs font-medium uppercase tracking-wider">Добро пожаловать</p>
              <h1 className="text-forest dark:text-white text-xl font-extrabold leading-tight tracking-tight">Привет, {user?.name}</h1>
          </div>
        </div>
        <div className="flex gap-2 items-center justify-end">
            <CartIcon navigate={navigate} />
            <button 
                onClick={() => navigate('/notifications')}
                className="flex items-center justify-center rounded-full size-10 bg-white dark:bg-sage/20 text-forest dark:text-primary active:scale-95 transition-transform"
            >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
            </button>
        </div>
      </header>

      <section className="px-6 py-6">
        <div className="p-6 flex flex-col rounded-2xl shadow-lg bg-white dark:bg-[#1a2d18] border border-[#e2e8e1] dark:border-sage/30">
          {loading ? (
             <div className="animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="size-14 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-dashed border-[#e2e8e1] dark:border-sage/30">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 w-1/2">
                      <div className="size-2 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : latestEmotion ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className={`size-14 rounded-full ${latestEmotion.color.replace('bg-', 'bg-opacity-20 ')} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined ${latestEmotion.color.replace('bg-', 'text-')} text-3xl`}>psychology</span>
                  </div>
                </div>
                <div>
                  <p className="text-sage dark:text-[#a0c09d] text-sm font-medium">Ваше текущее состояние</p>
                  <p className="text-forest dark:text-white text-2xl font-bold">{latestEmotion.title}</p>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-dashed border-[#e2e8e1] dark:border-sage/30">
                <h4 className="text-forest dark:text-white font-bold text-sm">Недавняя активность:</h4>
                {history.slice(1, 4).map(entry => {
                    const emotion = EMOTIONS[entry.emotionKey];
                    return (
                         <div key={entry.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`size-2 rounded-full ${emotion.color}`}></div>
                                <p className="text-sm font-medium text-forest dark:text-[#e0e0e0]">{emotion.title}</p>
                            </div>
                            <p className="text-xs text-sage dark:text-[#a0c09d]">{formatDate(entry.timestamp)}</p>
                        </div>
                    )
                })}
              </div>
            </>
          ) : (
             <div className="text-center text-sage py-8 flex flex-col items-center">
                <span className="material-symbols-outlined text-5xl text-primary mb-4">quiz</span>
                <p className="font-semibold text-forest dark:text-white">Определите свое состояние</p>
                <p className="text-sm mt-1">Пройдите опрос, чтобы получить персональные рекомендации.</p>
             </div>
          )}
        </div>
      </section>
      
       <section className="grid grid-cols-2 gap-4 px-6 pb-4">
            <Link to="/history" className="bg-beige-soft dark:bg-wood/30 flex flex-col items-start justify-between p-4 rounded-2xl aspect-[4/3] relative overflow-hidden group">
                <div className="bg-white/90 dark:bg-black/20 backdrop-blur rounded-lg p-2 z-10">
                    <span className="material-symbols-outlined text-wood dark:text-amber-100">calendar_month</span>
                </div>
                <div className="z-10">
                    <p className="text-forest dark:text-white text-base font-extrabold leading-tight">История</p>
                </div>
            </Link>
             <Link to="/progress" className="bg-beige-soft dark:bg-wood/30 flex flex-col items-start justify-between p-4 rounded-2xl aspect-[4/3] relative overflow-hidden group">
                 <div className="bg-white/90 dark:bg-black/20 backdrop-blur rounded-lg p-2 z-10">
                    <span className="material-symbols-outlined text-wood dark:text-amber-100">trending_up</span>
                </div>
                <div className="z-10">
                    <p className="text-forest dark:text-white text-base font-extrabold leading-tight">Динамика</p>
                </div>
            </Link>
            <Link to="/cabinet" className="col-span-2 bg-beige-soft dark:bg-wood/30 flex items-center justify-between p-4 rounded-2xl relative overflow-hidden group">
                <div className="flex items-center gap-4 z-10">
                    <div className="bg-white/90 dark:bg-black/20 backdrop-blur rounded-lg p-2">
                        <span className="material-symbols-outlined text-wood dark:text-amber-100">medication</span>
                    </div>
                    <p className="text-forest dark:text-white text-base font-extrabold leading-tight">Моя аптечка</p>
                </div>
                <span className="material-symbols-outlined text-sage">chevron_right</span>
            </Link>
        </section>

      <section className="px-6 pb-8">
        <h3 className="text-forest dark:text-white text-lg font-bold leading-tight tracking-tight mb-4">Карта дня</h3>
        {!cardRevealed ? (
            <div 
                onClick={drawCard}
                className="bg-primary/10 dark:bg-primary/5 rounded-2xl p-6 border border-primary/20 aspect-[3/4] flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(152, 194, 129, 0.1) 0, rgba(152, 194, 129, 0.1) 10px, transparent 10px, transparent 20px)' }}
            >
                <div className="bg-white/90 dark:bg-black/20 backdrop-blur rounded-full p-4 mb-4 shadow-sm border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-4xl">auto_awesome</span>
                </div>
                <p className="text-forest dark:text-white font-bold text-center">Вытянуть карту дня</p>
                <p className="text-sage dark:text-[#a0c09d] text-xs text-center mt-2">Метафорическое послание для вас на сегодня</p>
            </div>
        ) : dailyCard && (
            <div className="bg-white dark:bg-[#1a2d18] rounded-2xl overflow-hidden border border-[#e2e8e1] dark:border-sage/30 shadow-lg relative aspect-[3/4] flex flex-col group">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${dailyCard.image}")` }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10"></div>
                
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur text-white/90 px-3 py-1.5 rounded-full z-20 flex items-center gap-1.5 shadow-sm">
                  <span className="material-symbols-outlined shrink-0 text-sm">schedule</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Следующая завтра</span>
                </div>

                <div className="relative z-10 flex flex-col h-full justify-end p-6">
                    <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-1 drop-shadow-md">Ваша карта</p>
                    <h4 className="text-white text-3xl font-extrabold mb-2 drop-shadow-lg leading-tight">{dailyCard.title}</h4>
                    <p className="text-white/90 text-sm font-medium drop-shadow-md border-t border-white/20 pt-3">{dailyCard.message}</p>
                </div>
            </div>
        )}
      </section>

      <section className="px-6 pb-8">
        <h3 className="text-forest dark:text-white text-lg font-bold leading-tight tracking-tight mb-4">Мудрость дня</h3>
        <div className="bg-primary/10 dark:bg-primary/5 rounded-2xl p-4 border border-primary/20">
            <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary text-3xl">format_quote</span>
                <div className="flex-1">
                    {quoteLoading ? (
                        <div className="animate-pulse flex flex-col gap-2 pt-1">
                            <div className="h-3 bg-primary/20 rounded w-full"></div>
                            <div className="h-3 bg-primary/20 rounded w-5/6"></div>
                            <div className="h-3 bg-primary/20 rounded w-1/2 mt-2"></div>
                        </div>
                    ) : (
                        <>
                            <p className="text-forest dark:text-white text-sm font-bold italic leading-relaxed">«{quote?.text}»</p>
                            <p className="text-sage dark:text-[#a0c09d] text-xs mt-2 text-right">— {quote?.author}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
      </section>

      {latestEmotion && cardRevealed && dailyCard && (
        <section className="px-6 pb-8">
            <div className="bg-gradient-to-br from-primary/20 to-sage/20 dark:from-primary/10 dark:to-sage/10 rounded-2xl p-6 border border-primary/30 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 text-primary opacity-10">
                    <span className="material-symbols-outlined" style={{ fontSize: 150 }}>magic_button</span>
                </div>
                <div className="relative z-10 flex flex-col items-start gap-3">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary">psychiatry</span>
                        <h3 className="text-forest dark:text-white text-lg font-bold">ИИ-Советник</h3>
                    </div>
                    
                    {!synthesisText ? (
                        <>
                            <p className="text-sm text-forest/80 dark:text-white/80 leading-relaxed mb-2">
                                Нейросеть проанализирует ваше состояние («{latestEmotion.title}») и Карту дня («{dailyCard.title}»), чтобы дать персональный совет.
                            </p>
                            <button 
                                onClick={handleSynthesis}
                                disabled={isSynthesizing}
                                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                            >
                                {isSynthesizing ? (
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                            <span>Ожидание...</span>
                                        </div>
                                        <span className="text-xs font-normal opacity-90 animate-pulse">{loadingPhrase}</span>
                                    </div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">insights</span>
                                        <span>Получить напутствие</span>
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 text-sm text-forest dark:text-gray-200 leading-relaxed space-y-3">
                            {synthesisText.split('\n\n').map((paragraph, i) => (
                                <p key={i}>{paragraph}</p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
      )}

      <BottomNavBar />
    </div>
  );
};

export default DashboardScreen;
