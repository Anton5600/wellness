import React, { useState, useEffect } from 'react';

interface LockScreenProps {
    onUnlock: () => void;
    userUid: string;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, userUid }) => {
    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (pinInput.length === 4) {
            const storedPin = localStorage.getItem(`app_pin_${userUid}`);
            if (pinInput === storedPin) {
                onUnlock();
            } else {
                setError(true);
                setTimeout(() => {
                    setPinInput('');
                    setError(false);
                }, 500);
            }
        }
    }, [pinInput, userUid, onUnlock]);

    const handleNumberClick = (num: string) => {
        if (pinInput.length < 4) {
            setPinInput(prev => prev + num);
            setError(false);
        }
    };

    const handleDeleteClick = () => {
        setPinInput(prev => prev.slice(0, -1));
        setError(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background-light dark:bg-background-dark">
            <div className="w-full max-w-sm p-6 flex flex-col items-center">
                <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-primary">lock</span>
                </div>
                
                <h2 className="text-2xl font-bold text-forest dark:text-white mb-2">Введите ПИН-код</h2>
                <p className="text-sage dark:text-gray-400 text-sm mb-8 text-center">
                    Приложение заблокировано для защиты ваших данных
                </p>

                <div className={`flex justify-center gap-4 mb-12 transition-transform ${error ? 'animate-shake' : ''}`}>
                    {[...Array(4)].map((_, i) => (
                        <div 
                            key={i} 
                            className={`size-4 rounded-full transition-colors ${
                                i < pinInput.length 
                                    ? (error ? 'bg-red-500' : 'bg-primary') 
                                    : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button 
                            key={num} 
                            onClick={() => handleNumberClick(num.toString())}
                            className="size-16 rounded-full bg-white dark:bg-[#1f1f1f] shadow-sm text-2xl font-bold text-forest dark:text-white flex items-center justify-center active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="size-16"></div>
                    <button 
                        onClick={() => handleNumberClick('0')}
                        className="size-16 rounded-full bg-white dark:bg-[#1f1f1f] shadow-sm text-2xl font-bold text-forest dark:text-white flex items-center justify-center active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
                    >
                        0
                    </button>
                    <button 
                        onClick={handleDeleteClick}
                        className="size-16 rounded-full text-2xl text-forest dark:text-white flex items-center justify-center active:opacity-50 transition-opacity"
                    >
                        <span className="material-symbols-outlined">backspace</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LockScreen;
