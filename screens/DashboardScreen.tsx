
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../context/AuthContext';
import { getEmotionHistory } from '../services/firestoreService';
import { EmotionHistoryEntry } from '../types';
import { EMOTIONS } from '../constants';
import BottomNavBar from '../components/BottomNavBar';
import { useCart } from '../context/CartContext';
import { METAPHORIC_CARDS, MetaphoricCard } from '../data/cards';
import { getQuoteForDay, getRandomQuote } from '../data/quotes';
import { AromaMoodWidget } from '../components/AromaMoodWidget';
import { initNotificationListeners } from '../services/notificationService';

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
  const [quote, setQuote] = useState<{text: string, author: string} | null>(getQuoteForDay());
  const [quoteLoading, setQuoteLoading] = useState(false);

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
    initNotificationListeners(() => {
      const widget = document.getElementById('aroma-widget');
      if (widget) {
        widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, []);

  useEffect(() => {
    if (!quote) {
      setQuote(getQuoteForDay());
    }
    setQuoteLoading(false);
  }, []);

  const handleRefreshQuote = () => {
    const currentText = quote?.text;
    const newQuote = getRandomQuote(currentText);
    setQuote(newQuote);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const userId = user?.uid || 'guest';
        const userHistory = await getEmotionHistory(userId);
        setHistory(userHistory);
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
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
    
    // В веб-браузере используем относительный путь /api/ai/synthesis.
    // На мобильном устройстве (Capacitor native) исключаем локальные IP (10.0.2.2, localhost)
    // и устаревшие домены, перенаправляя запрос на продуктивный сервер Amvera.
    let primaryUrl = '';
    if (Capacitor.isNativePlatform()) {
      const envUrl = import.meta.env.VITE_API_URL;
      const isLocalOrInvalid = !envUrl || 
        envUrl.includes('localhost') || 
        envUrl.includes('10.0.2.2') || 
        envUrl.includes('127.0.0.1') || 
        envUrl.includes('onrender') ||
        !envUrl.startsWith('http');
        
      primaryUrl = !isLocalOrInvalid ? envUrl : 'https://wellness-anton56.amvera.io';
    } else {
      primaryUrl = '';
    }

    const tryFetchSynthesis = async (baseUrl: string) => {
      const fullUrl = `${baseUrl}/api/ai/synthesis`;
      console.log(`Отправка запроса на: ${fullUrl}`);
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testResult: latestEmotion, card: dailyCard, quote })
      });
      return { res, url: fullUrl };
    };

    try {
      let fetchResult;
      try {
        fetchResult = await tryFetchSynthesis(primaryUrl);
      } catch (firstErr) {
        if (primaryUrl !== 'https://wellness-anton56.amvera.io') {
          console.warn(`Запрос на ${primaryUrl} не удался. Пробуем основной сервер...`);
          fetchResult = await tryFetchSynthesis('https://wellness-anton56.amvera.io');
        } else {
          throw firstErr;
        }
      }

      const { res, url } = fetchResult;
      console.log(`Статус ответа (${url}): ${res.status}`);
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        throw new Error(`Invalid JSON response: ${text.slice(0, 50)}...`);
      }
      
      if (!res.ok || data.error) {
        alert(data.error || "Произошла ошибка при синтезе.");
      } else if (data.result) {
        setSynthesisText(data.result);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Ошибка сети при запросе синтеза. Детали: ${e.message || 'Проверьте интернет-соединение'}`);
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

        {/* Personalized Aroma Support Widget */}
        <AromaMoodWidget history={history} />
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
            <div className="bg-white dark:bg-[#1a2d18] rounded-2xl overflow-hidden border border-[#e2e8e1] dark:border-sage/30 shadow-lg flex flex-col group">
                <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-900">
                    <div 
                        className="absolute inset-0 bg-cover bg-center blur-md opacity-30 scale-110" 
                        style={{ backgroundImage: `url("${dailyCard.image}")` }}
                    />
                    <div 
                        className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105 z-10" 
                        style={{ backgroundImage: `url("${dailyCard.image}")` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 z-10 pointer-events-none" />
                    
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white/90 px-3 py-1.5 rounded-full z-20 flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined shrink-0 text-sm">schedule</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Следующая завтра</span>
                    </div>
                </div>

                <div className="p-6 bg-beige-soft/30 dark:bg-black/10 flex flex-col border-t border-[#e2e8e1]/60 dark:border-sage/10">
                    <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1.5">Ваша карта</p>
                    <h4 className="text-forest dark:text-white text-2xl font-extrabold mb-2 leading-tight">{dailyCard.title}</h4>
                    <p className="text-forest/80 dark:text-gray-200 text-sm font-medium leading-relaxed border-t border-primary/10 pt-3">
                        {dailyCard.message}
                    </p>
                </div>
            </div>
        )}
      </section>

      <section className="px-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-forest dark:text-white text-lg font-bold leading-tight tracking-tight">Мудрость дня</h3>
          <button 
            onClick={handleRefreshQuote}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] animate-none">refresh</span>
            <span>Другая фраза</span>
          </button>
        </div>
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
                                className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white transition-all duration-500 shadow-md ${
                                    isSynthesizing 
                                        ? "bg-gradient-to-r from-[#213e19] via-[#4d7d3d] to-[#142910] animate-gradient-shimmer cursor-not-allowed shadow-lg" 
                                        : "bg-gradient-to-r from-[#3e6831] to-[#608f4c] hover:from-[#2e4f24] hover:to-[#4b733a] active:scale-[0.98] cursor-pointer"
                                }`}
                            >
                                {isSynthesizing ? (
                                    <div className="flex flex-col items-center gap-1.5 py-1 w-full">
                                        <div className="flex items-center justify-center gap-2 text-white">
                                            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                            <span className="text-sm font-extrabold uppercase tracking-wider">Генерируем совет...</span>
                                        </div>
                                        <span className="text-xs font-semibold text-white/95 px-4 py-1 bg-black/20 rounded-full border border-white/10 animate-pulse text-center">
                                            {loadingPhrase}
                                        </span>
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
