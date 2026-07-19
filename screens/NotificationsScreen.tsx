import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    requestPermissions, 
    scheduleDailyReminder, 
    cancelDailyReminder,
    scheduleMorningMood,
    cancelMorningMood,
    scheduleWeeklyReport,
    cancelWeeklyReport,
    scheduleStuckReminder,
    cancelStuckReminder
} from '../services/notificationService';

const NotificationsScreen: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [dailyReminder, setDailyReminder] = useState(false);
    const [dailyTime, setDailyTime] = useState('20:00');
    
    const [stuckReminder, setStuckReminder] = useState(false);
    
    const [morningMood, setMorningMood] = useState(false);
    const [morningTime, setMorningTime] = useState('08:00');
    
    const [weeklyReport, setWeeklyReport] = useState(false);

    useEffect(() => {
        if (user) {
            const prefs = localStorage.getItem(`app_notifications_${user.uid}`);
            if (prefs) {
                const parsed = JSON.parse(prefs);
                setDailyReminder(parsed.dailyReminder ?? false);
                setDailyTime(parsed.dailyTime ?? '20:00');
                setStuckReminder(parsed.stuckReminder ?? false);
                setMorningMood(parsed.morningMood ?? false);
                setMorningTime(parsed.morningTime ?? '08:00');
                setWeeklyReport(parsed.weeklyReport ?? false);
            }
        }
    }, [user]);

    const handleToggle = async (key: string, value: boolean) => {
        const hasPermission = await requestPermissions();
        if (!hasPermission && value) {
            alert('Пожалуйста, разрешите уведомления в настройках устройства.');
            return;
        }

        let newPrefs = {};
        if (key === 'dailyReminder') { 
            setDailyReminder(value); 
            newPrefs = { dailyReminder: value }; 
            if (value) scheduleDailyReminder(dailyTime);
            else cancelDailyReminder();
        }
        if (key === 'stuckReminder') { 
            setStuckReminder(value); 
            newPrefs = { stuckReminder: value }; 
            if (value) scheduleStuckReminder();
            else cancelStuckReminder();
        }
        if (key === 'morningMood') { 
            setMorningMood(value); 
            newPrefs = { morningMood: value }; 
            if (value) scheduleMorningMood(morningTime);
            else cancelMorningMood();
        }
        if (key === 'weeklyReport') { 
            setWeeklyReport(value); 
            newPrefs = { weeklyReport: value }; 
            if (value) scheduleWeeklyReport();
            else cancelWeeklyReport();
        }
        
        if (user) {
            const currentPrefs = JSON.parse(localStorage.getItem(`app_notifications_${user.uid}`) || '{}');
            localStorage.setItem(`app_notifications_${user.uid}`, JSON.stringify({ ...currentPrefs, ...newPrefs }));
        }
    };

    const handleTimeChange = (key: string, value: string) => {
        let newPrefs = {};
        if (key === 'dailyTime') { 
            setDailyTime(value); 
            newPrefs = { dailyTime: value }; 
            if (dailyReminder) scheduleDailyReminder(value);
        }
        if (key === 'morningTime') { 
            setMorningTime(value); 
            newPrefs = { morningTime: value }; 
            if (morningMood) scheduleMorningMood(value);
        }
        
        if (user) {
            const currentPrefs = JSON.parse(localStorage.getItem(`app_notifications_${user.uid}`) || '{}');
            localStorage.setItem(`app_notifications_${user.uid}`, JSON.stringify({ ...currentPrefs, ...newPrefs }));
        }
    };

    const Toggle = ({ enabled, onChange }: { enabled: boolean, onChange: () => void }) => (
        <button 
            onClick={onChange}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <div className={`absolute top-1 size-4 bg-white rounded-full transition-transform ${enabled ? 'left-7' : 'left-1'}`} />
        </button>
    );

    return (
        <div className="pb-28 bg-background-light dark:bg-background-dark min-h-[100dvh]">
            <header className="flex items-center p-4 pb-2 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40">
                <button onClick={() => navigate(-1)} className="text-forest dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer">
                    <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
                <h1 className="text-xl font-extrabold text-forest dark:text-white ml-2">Уведомления</h1>
            </header>

            <main className="px-6 mt-4 space-y-4">
                {/* Ежедневное напоминание */}
                <div className="bg-white dark:bg-[#1f1f1f] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="pr-4">
                            <h3 className="font-bold text-forest dark:text-white text-lg">Ежедневный квиз</h3>
                            <p className="text-sage dark:text-gray-400 text-sm mt-1">Напоминание: "Как вы себя чувствуете сегодня?"</p>
                        </div>
                        <Toggle enabled={dailyReminder} onChange={() => handleToggle('dailyReminder', !dailyReminder)} />
                    </div>
                    {dailyReminder && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <span className="text-forest dark:text-white font-medium">Время напоминания</span>
                            <input 
                                type="time" 
                                value={dailyTime}
                                onChange={(e) => handleTimeChange('dailyTime', e.target.value)}
                                className="bg-gray-100 dark:bg-gray-800 text-forest dark:text-white px-3 py-1.5 rounded-lg font-medium outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Напоминание о застревании */}
                <div className="bg-white dark:bg-[#1f1f1f] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="pr-4">
                            <h3 className="font-bold text-forest dark:text-white text-lg">Поддержка при "застревании"</h3>
                            <p className="text-sage dark:text-gray-400 text-sm mt-1">Если вы 3 дня подряд отмечаете Грусть или Страх, мы предложим помощь.</p>
                        </div>
                        <Toggle enabled={stuckReminder} onChange={() => handleToggle('stuckReminder', !stuckReminder)} />
                    </div>
                </div>

                {/* Утренний настрой */}
                <div className="bg-white dark:bg-[#1f1f1f] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="pr-4">
                            <h3 className="font-bold text-forest dark:text-white text-lg">Утренний настрой</h3>
                            <p className="text-sage dark:text-gray-400 text-sm mt-1">Короткие вдохновляющие цитаты и рекомендации масел на день.</p>
                        </div>
                        <Toggle enabled={morningMood} onChange={() => handleToggle('morningMood', !morningMood)} />
                    </div>
                    {morningMood && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <span className="text-forest dark:text-white font-medium">Время напоминания</span>
                            <input 
                                type="time" 
                                value={morningTime}
                                onChange={(e) => handleTimeChange('morningTime', e.target.value)}
                                className="bg-gray-100 dark:bg-gray-800 text-forest dark:text-white px-3 py-1.5 rounded-lg font-medium outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Еженедельный отчет */}
                <div className="bg-white dark:bg-[#1f1f1f] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="pr-4">
                            <h3 className="font-bold text-forest dark:text-white text-lg">Еженедельный отчет</h3>
                            <p className="text-sage dark:text-gray-400 text-sm mt-1">"Ваша эмоциональная статистика за неделю готова!"</p>
                        </div>
                        <Toggle enabled={weeklyReport} onChange={() => handleToggle('weeklyReport', !weeklyReport)} />
                    </div>
                </div>
                
                <p className="text-xs text-center text-gray-400 mt-6 px-4">
                    Для работы уведомлений необходимо разрешить их отправку в настройках вашего устройства.
                </p>
            </main>
        </div>
    );
};

export default NotificationsScreen;
