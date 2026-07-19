import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EMOTIONS } from '../constants';
import { EmotionSymbol } from '../components/EmotionSymbol';

const SymbolsDictionaryScreen: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col min-h-[100dvh] w-full bg-background-light dark:bg-background-dark font-display pb-10">
            <header className="flex items-center p-4 bg-white dark:bg-[#1f1f1f] shadow-sm sticky top-0 z-10">
                <button 
                    onClick={() => navigate(-1)} 
                    className="size-10 flex border items-center justify-center rounded-full bg-white dark:bg-[#2a2a2a] text-forest dark:text-white shadow-sm"
                >
                    <span className="material-symbols-outlined shrink-0 block">arrow_back_ios_new</span>
                </button>
                <div className="ml-4 flex-1">
                    <h1 className="text-xl font-extrabold text-forest dark:text-white">Словарь символов</h1>
                </div>
            </header>

            <main className="p-6">
                <p className="text-sage dark:text-gray-400 mb-8 text-center px-4 leading-relaxed">
                    Этот язык символов отражает природу каждой эмоции. Используйте их для коммуникации, самопознания и визуализации своих состояний.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {Object.values(EMOTIONS).map((emotion) => (
                        <div 
                            key={emotion.key} 
                            className="bg-white dark:bg-[#1f1f1f] p-6 rounded-3xl shadow-sm border border-sage/10 dark:border-sage/20 flex flex-col items-center justify-center space-y-6"
                        >
                            <div className="w-full flex justify-center py-4">
                                <EmotionSymbol 
                                    emotionKey={emotion.key} 
                                    size={140} 
                                    className="drop-shadow-md transition-transform hover:scale-105 duration-500" 
                                />
                            </div>
                            
                            <div className="text-center w-full">
                                <h2 className="text-2xl font-extrabold text-forest dark:text-white mb-2">{emotion.title}</h2>
                                <p className="font-semibold text-primary mb-3">{emotion.headline}</p>
                                <p className="text-sm text-sage dark:text-gray-400 leading-relaxed text-left">
                                    {emotion.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default SymbolsDictionaryScreen;
