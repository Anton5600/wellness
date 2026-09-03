import React, { useState, useEffect } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import { useAuth } from '../context/AuthContext';
import { EmotionalGraphEntry } from '../types';
import { compassService } from '../services/compassService';
import { EMOTIONS } from '../constants';
import { useNavigate } from 'react-router-dom';

const HistoryScreen: React.FC = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState<EmotionalGraphEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        compassService.setCurrentUserId(user?.uid);
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const entries = await compassService.getHistory();
                if (!cancelled) setHistory(entries);
            } catch (error) {
                console.error("Failed to load history:", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [user?.uid]);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('ru-RU', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    const handleItemClick = (dominant: string) => {
        const result = EMOTIONS[dominant as keyof typeof EMOTIONS];
        if (result) {
            navigate('/result', { state: { result, fromHistory: true } });
        }
    };

    return (
        <div className="pb-28 bg-background-light dark:bg-background-dark min-h-[100dvh]">
            <header className="p-6 pt-8">
                <h1 className="text-3xl font-extrabold text-forest dark:text-white">История</h1>
                <p className="text-sage dark:text-gray-400 mt-1">Просмотрите свои прошлые эмоциональные состояния.</p>
            </header>

            <main className="px-6">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#1f1f1f] shadow-sm border border-transparent">
                                <div className="size-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                                </div>
                                <div className="size-4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                            </div>
                        ))}
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-10 text-sage">
                        <span className="material-symbols-outlined text-5xl text-primary mb-4">history</span>
                        <p className="font-semibold text-forest dark:text-white">История пока пуста</p>
                        <p className="text-sm mt-1">Сделайте первый чек-ин, чтобы начать отслеживать свое состояние.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map(entry => {
                            const emotion = EMOTIONS[entry.dominant];
                            const textColorClass = emotion.color.replace('bg-', 'text-');
                            return (
                                <div
                                    key={entry.date}
                                    onClick={() => handleItemClick(entry.dominant)}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#1f1f1f] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                >
                                    <div className={`flex-shrink-0 size-12 rounded-lg flex items-center justify-center ${emotion.color} bg-opacity-20`}>
                                        <span className={`material-symbols-outlined text-3xl ${textColorClass}`}>psychology</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-forest dark:text-white">{emotion.title}</h3>
                                        <p className="text-sage dark:text-gray-400 text-xs">{formatDate(entry.timestamp)}</p>
                                        {entry.aroma && (
                                            <p className="text-sage dark:text-gray-400 text-xs mt-0.5">Масло: {entry.aroma}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`size-3 rounded-full ${emotion.color}`}></div>
                                        <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            <BottomNavBar />
        </div>
    );
};

export default HistoryScreen;
