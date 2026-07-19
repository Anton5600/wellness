
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { EmotionData, UserOil, OilCatalogItem } from '../types';
import { TELEGRAM_USERNAME } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getUserOils, addUserOil, getOilsCatalog } from '../services/firestoreService';
import { EmotionSymbol } from '../components/EmotionSymbol';

const QuizResultScreen: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart } = useCart();
    
    const result = location.state?.result as EmotionData;
    const fromHistory = location.state?.fromHistory as boolean;

    const [userOils, setUserOils] = useState<UserOil[]>([]);
    const [oilCatalog, setOilCatalog] = useState<OilCatalogItem[]>([]);
    const [addingOilIds, setAddingOilIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                const [oils, catalog] = await Promise.all([
                    getUserOils(user.uid),
                    getOilsCatalog()
                ]);
                setUserOils(oils);
                setOilCatalog(catalog);
            }
        };
        fetchData();
    }, [user]);

    const handleClose = () => {
        if (fromHistory) {
            navigate(-1); // Возвращаемся в историю
        } else {
            navigate('/'); // Возвращаемся на главную
        }
    };

    const handleAddToCabinet = async (oilName: string) => {
        if (!user) return;
        
        // Находим ID масла в каталоге по имени
        const catalogOil = oilCatalog.find(o => o.name === oilName);
        if (!catalogOil) return;

        try {
            setAddingOilIds(prev => new Set(prev).add(catalogOil.id));
            const newOil = await addUserOil(user.uid, catalogOil.id);
            setUserOils(prev => [...prev, newOil]);
        } catch (error) {
            console.error("Failed to add oil to cabinet", error);
        } finally {
            setAddingOilIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(catalogOil.id);
                return newSet;
            });
        }
    };

    // Helper: checks if user has this exact oil by matching name to catalog ID
    const hasOil = (oilName: string) => {
        const catalogOil = oilCatalog.find(o => o.name === oilName);
        if (!catalogOil) return false;
        return userOils.some(uo => uo.oilId === catalogOil.id);
    };

    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-background-light dark:bg-background-dark">
                <p className="text-lg text-forest dark:text-gray-300">Результат не найден. Пожалуйста, пройдите опрос снова.</p>
                <button onClick={() => navigate('/quiz-intro')} className="mt-6 px-6 py-3 bg-primary text-forest font-bold rounded-xl shadow-lg">
                    Пройти опрос
                </button>
            </div>
        );
    }
    
    const colorMap: {[key: string]: string} = {
        'bg-orange-500': '#f97316',
        'bg-blue-400': '#60a5fa',
        'bg-purple-400': '#c084fc',
        'bg-orange-400': '#fb923c',
        'bg-indigo-400': '#818cf8',
        'bg-gray-400': '#9ca3af',
        'bg-red-500': '#ef4444',
        'bg-teal-400': '#2dd4bf',
    };
    const headerColor = colorMap[result.color] || '#f97316';
    const textColorClass = result.color.replace('bg-', 'text-');

    const imageMap: {[key: string]: string} = {
        joy: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80',
        trust: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
        fear: 'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?auto=format&fit=crop&w=800&q=80',
        surprise: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=800&q=80',
        sadness: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?auto=format&fit=crop&w=800&q=80',
        disgust: 'https://images.unsplash.com/photo-1493723843671-1d655e66ac1c?auto=format&fit=crop&w=800&q=80',
        anger: 'https://images.unsplash.com/photo-1498677231914-50fed6bc4247?auto=format&fit=crop&w=800&q=80',
        anticipation: 'https://images.unsplash.com/photo-1505322022379-7c3353ee6291?auto=format&fit=crop&w=800&q=80'
    };
    const imageUrl = imageMap[result.key] || 'https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?auto=format&fit=crop&w=800&q=80';

    return (
        <div className="flex flex-col min-h-[100dvh] w-full bg-white dark:bg-[#0a0a0a]">
             <header className="flex items-center p-4 pb-2 justify-between sticky top-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-gray-800/50 shadow-sm">
                <button onClick={handleClose} className="text-forest dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer">
                    <span className="material-symbols-outlined text-2xl">
                        {fromHistory ? 'arrow_back_ios' : 'close'}
                    </span>
                </button>
                <h2 className="text-forest dark:text-white text-lg font-bold leading-tight flex-1 text-center pr-12">Ваш результат</h2>
            </header>

            <main className="flex-1 overflow-y-auto pb-[calc(10rem+10vh)]">
                <div style={{ backgroundColor: headerColor, backgroundImage: `url("${imageUrl}")` }} className="flex flex-col justify-end min-h-[320px] bg-cover bg-center relative p-6">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
                    
                    <div className="absolute top-8 right-6 z-10 opacity-80">
                        <EmotionSymbol emotionKey={result.key} size={120} className="drop-shadow-xl" />
                    </div>

                    <div className="relative z-10 w-2/3">
                        <span className="text-white/90 text-sm font-bold uppercase tracking-widest mb-1.5 drop-shadow-md">Текущее состояние</span>
                        <p className="text-white tracking-tight text-[44px] font-extrabold leading-none drop-shadow-lg">{result.title}</p>
                    </div>
                </div>

                <div className="p-6">
                    <h2 className="text-forest dark:text-white tracking-tight text-2xl font-bold leading-tight">{result.headline}</h2>
                    <p className="text-sage dark:text-gray-300 mt-3 text-base leading-relaxed">{result.description}</p>
                </div>

                <div className="px-6">
                    <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                </div>

                <div className="px-6 pb-6">
                    <h3 className="text-forest dark:text-white text-xl font-bold mb-4">Рекомендуемые масла</h3>
                    <div className="space-y-4">
                        {result.oils.map((oil, index) => {
                            const isOwned = hasOil(oil.name);
                            const catalogOil = oilCatalog.find(o => o.name === oil.name);
                            const isAdding = catalogOil ? addingOilIds.has(catalogOil.id) : false;

                            return (
                                <div key={index} className="flex flex-col p-4 rounded-xl bg-gray-100 dark:bg-[#1f1f1f]">
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 size-12 rounded-lg flex items-center justify-center ${result.color} bg-opacity-20`}>
                                            <span className={`material-symbols-outlined text-3xl ${textColorClass}`}>{oil.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-forest dark:text-white">{oil.name}</h4>
                                            <p className="text-sage dark:text-gray-400 text-sm mt-1">{oil.description}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Интеграция с аптечкой */}
                                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                        {isOwned ? (
                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                                <span className="text-sm font-medium">В вашей аптечке</span>
                                            </div>
                                        ) : catalogOil ? (
                                            <button 
                                                onClick={() => handleAddToCabinet(oil.name)}
                                                disabled={isAdding}
                                                className="flex items-center gap-2 text-sage hover:text-forest dark:hover:text-white transition-colors"
                                            >
                                                {isAdding ? (
                                                   <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                                ) : (
                                                   <span className="material-symbols-outlined text-lg">medication</span>
                                                )}
                                                <span className="text-sm font-bold">В аптечку</span>
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-400">Нет в каталоге</span>
                                        )}
                                        
                                        {catalogOil && (
                                            <button 
                                                onClick={() => {
                                                    addToCart(catalogOil.id);
                                                    navigate('/cart');
                                                }}
                                                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">shopping_cart_checkout</span>
                                                <span className="text-sm font-bold">Купить {catalogOil.price ? `${catalogOil.price} ₽` : ''}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {result.usage && (
                    <div className="px-6 pb-6">
                        <h3 className="text-forest dark:text-white text-xl font-bold mb-4">Способы применения</h3>
                        <div className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                            <ul className="space-y-4">
                                {result.usage.map((item, index) => (
                                    <li key={index} className="flex gap-3">
                                        <div className={`mt-0.5 p-1 rounded-full ${result.color} bg-opacity-20 shrink-0 flex items-center justify-center size-6`}>
                                            <span className={`material-symbols-outlined text-sm ${textColorClass}`}>water_drop</span>
                                        </div>
                                        <span className="text-forest dark:text-gray-300 text-sm leading-relaxed font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </main>

            <footer className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-6 pb-[calc(10vh+env(safe-area-inset-bottom))] bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-40 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-3">
                <button 
                    onClick={() => navigate('/cart')}
                    className={`w-full flex h-14 items-center justify-center gap-2 rounded-xl text-white text-lg font-extrabold shadow-lg hover:opacity-90 transition-transform active:scale-[0.98] ${result.color}`}>
                    <span className="material-symbols-outlined">shopping_bag</span>
                    <span>Перейти в корзину</span>
                </button>
                <button 
                    onClick={handleClose} 
                    className="w-full flex h-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-forest dark:text-white text-lg font-extrabold shadow-sm hover:opacity-90 transition-transform active:scale-[0.98]">
                    <span>{fromHistory ? 'Назад в историю' : 'На главную'}</span>
                </button>
            </footer>
        </div>
    );
};

export default QuizResultScreen;
