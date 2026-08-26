import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from '../components/BottomNavBar';
import { PlutchikWheel } from '../components/PlutchikWheel';
import { useAuth } from '../context/AuthContext';
import { compassService } from '../services/compassService';
import { EMOTION_LABELS } from '../services/recommendation/inference';
import { EmotionKey, PlutchikVector } from '../types';

const ORDER: Array<{ key: EmotionKey; color: string }> = [
  { key: 'joy', color: '#f59e0b' },
  { key: 'trust', color: '#10b981' },
  { key: 'fear', color: '#059669' },
  { key: 'surprise', color: '#0284c7' },
  { key: 'sadness', color: '#3b82f6' },
  { key: 'disgust', color: '#8b5cf6' },
  { key: 'anger', color: '#ef4444' },
  { key: 'anticipation', color: '#f97316' },
];

export const WeeklyCheckScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vector, setVector] = useState<PlutchikVector | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    compassService.setCurrentUserId(user?.uid);
    let cancelled = false;
    compassService.getProfile().then((profile) => {
      if (cancelled) return;
      setVector({ ...profile.lastWeekly });
    });
    return () => { cancelled = true; };
  }, [user?.uid]);

  const setEmotion = (key: EmotionKey, value: number) => {
    setVector((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!vector) return;
    await compassService.updateWeeklyProfile(vector);
    setSaved(true);
    setTimeout(() => navigate(-1), 600);
  };

  return (
    <div className="pb-28 bg-background-light dark:bg-background-dark min-h-[100dvh]">
      <header className="flex items-center p-4 pb-2 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40">
        <button onClick={() => navigate(-1)} className="text-forest dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-extrabold text-forest dark:text-white ml-2">Глубокий замер</h1>
      </header>

      <main className="px-6 mt-2 space-y-4">
        {!vector ? (
          <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-8 flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex justify-center">
              <PlutchikWheel vector={vector} size={280} />
            </div>

            <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-5">
              <p className="text-sm text-sage dark:text-gray-400">
                Оцените выраженность каждой эмоции за последнюю неделю (0 — нет, 1 — максимально).
              </p>
              {ORDER.map(({ key, color }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-forest dark:text-white">{EMOTION_LABELS[key]}</span>
                    <span className="text-xs font-semibold" style={{ color }}>
                      {Math.round((vector[key] ?? 0.5) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={vector[key] ?? 0.5}
                    onChange={(e) => setEmotion(key, parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: color }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saved}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark disabled:opacity-70 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
            >
              {saved ? (
                <>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>Сохранено</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  <span>Сохранить профиль</span>
                </>
              )}
            </button>
          </>
        )}
      </main>

      <BottomNavBar />
    </div>
  );
};

export default WeeklyCheckScreen;
