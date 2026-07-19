
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QUIZ_QUESTIONS } from '../constants';
import { EmotionKey } from '../types';
import { calculateResult } from '../services/quizService';
import { saveEmotionHistory } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';

const QuizQuestionScreen: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<EmotionKey[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<EmotionKey | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    const question = QUIZ_QUESTIONS[currentStep];
    const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

    const handleSelectAnswer = (emotionKey: EmotionKey) => {
        setSelectedAnswer(emotionKey);
    };

    const handleContinue = async () => {
        if (!selectedAnswer) return;

        const newAnswers = [...answers, selectedAnswer];
        setAnswers(newAnswers);
        
        if (currentStep < QUIZ_QUESTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
            setSelectedAnswer(null);
        } else {
            if (user) {
                const result = calculateResult(newAnswers);
                try {
                    await saveEmotionHistory(user.uid, result.key);
                } catch (error) {
                    console.error("Ошибка при сохранении истории в Firebase:", error);
                    // Мы не прерываем выполнение, чтобы пользователь все равно увидел результат
                }
                navigate('/result', { state: { result } });
            }
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark h-[100dvh] flex flex-col font-display">
            <header className="flex items-center px-4 py-4 bg-background-light dark:bg-background-dark">
                <button onClick={() => currentStep > 0 ? setCurrentStep(currentStep-1) : navigate(-1)} className="text-forest dark:text-white flex size-10 shrink-0 items-center justify-center cursor-pointer">
                    <span className="material-symbols-outlined">arrow_back_ios</span>
                </button>
                <h2 className="text-forest dark:text-white text-lg font-bold leading-tight flex-1 text-center pr-10">Шаг {currentStep + 1} из {QUIZ_QUESTIONS.length}</h2>
            </header>

            <div className="px-6 py-2">
                <div className="flex flex-col gap-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>

            <main className="flex-1 flex flex-col px-6 overflow-y-auto">
                <div className="pt-10 pb-8 text-center">
                    <h1 className="text-forest dark:text-white text-3xl font-extrabold leading-tight">{question.question}</h1>
                    <p className="mt-3 text-sage dark:text-gray-400 text-base">{question.subtext}</p>
                </div>

                <div className="flex flex-col gap-4">
                    {question.answers.map((answer) => (
                        <label key={answer.text} className="relative cursor-pointer group">
                            <input
                                className="peer sr-only"
                                name="emotion"
                                type="radio"
                                checked={selectedAnswer === answer.emotionKey}
                                onChange={() => handleSelectAnswer(answer.emotionKey)}
                            />
                            <div className="flex items-center justify-between p-5 rounded-xl border-2 border-transparent bg-white dark:bg-gray-800 transition-all peer-checked:border-primary peer-checked:shadow-lg peer-checked:shadow-primary/20">
                                <p className="text-forest dark:text-white text-base font-bold">{answer.text}</p>
                                <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-600 peer-checked:border-primary flex items-center justify-center transition-colors">
                                    {selectedAnswer === answer.emotionKey && <div className="h-3 w-3 rounded-full bg-primary"></div>}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </main>

            <footer className="p-6 pb-[calc(10vh+env(safe-area-inset-bottom))] bg-transparent mt-auto">
                <button 
                    onClick={handleContinue} 
                    disabled={!selectedAnswer}
                    className="w-full flex h-14 items-center justify-center rounded-xl bg-primary text-forest text-lg font-extrabold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                    <span>Продолжить</span>
                </button>
            </footer>
        </div>
    );
};

export default QuizQuestionScreen;
