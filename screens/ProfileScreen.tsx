
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import BottomNavBar from '../components/BottomNavBar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ProfileScreen: React.FC = () => {
    const { user, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const [showAbout, setShowAbout] = useState(false);
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdmin = async () => {
            if (user) {
                if (user.email === 'akarpoff79@gmail.com') {
                    try {
                        // Автоматически создаем или обновляем документ админа
                        const adminRef = doc(db, 'admins', user.uid);
                        const adminDoc = await getDoc(adminRef);
                        if (!adminDoc.exists()) {
                            await setDoc(adminRef, {
                                email: user.email,
                                grantedAt: Date.now()
                            });
                        }
                    } catch (error) {
                        console.error("Error setting admin doc:", error);
                    }
                    setIsAdmin(true);
                    return;
                }
                try {
                    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
                    if (adminDoc.exists()) {
                        setIsAdmin(true);
                    }
                } catch (error) {
                    console.error("Error checking admin status:", error);
                }
            }
        };
        checkAdmin();
    }, [user]);

    const menuItems = [
        { name: 'Редактировать профиль', icon: 'edit', path: '', action: () => alert('Этот раздел находится в разработке') },
        { name: 'Словарь символов', icon: 'gesture', path: '/symbols-dictionary', action: () => navigate('/symbols-dictionary') },
        { name: 'Уведомления', icon: 'notifications', path: '/notifications', action: () => navigate('/notifications') },
        { name: 'Безопасность', icon: 'security', path: '/security', action: () => navigate('/security') },
        { name: 'Тема оформления', icon: 'palette', path: '', action: () => setShowThemeModal(true) },
        ...(isAdmin ? [{ name: 'Панель администратора', icon: 'admin_panel_settings', path: '/admin', action: () => navigate('/admin') }] : []),
        { name: 'Помощь и поддержка', icon: 'help_outline', path: '', action: () => alert('Этот раздел находится в разработке') },
    ];

    return (
        <div className="pb-28 bg-background-light dark:bg-background-dark min-h-[100dvh]">
            <header className="p-6 pt-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <div className="bg-center bg-no-repeat aspect-square w-24 bg-cover rounded-full border-4 border-primary" style={{backgroundImage: `url("https://storage.googleapis.com/aida-static/doterra/avatar.jpg")`}}></div>
                        <button className="absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white dark:border-background-dark">
                            <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                    </div>
                </div>
                <h1 className="text-2xl font-extrabold text-forest dark:text-white">{user?.name}</h1>
                <p className="text-sage dark:text-gray-400 mt-1">{user?.email}</p>
            </header>

            <main className="px-6 mt-4">
                <div className="bg-white dark:bg-[#1f1f1f] rounded-xl overflow-hidden shadow-sm">
                    {menuItems.map((item, index) => (
                        <button 
                            key={item.name} 
                            onClick={item.action}
                            className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors ${index < menuItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                        >
                            <span className="material-symbols-outlined text-primary">{item.icon}</span>
                            <span className="flex-1 text-left text-forest dark:text-white font-semibold">{item.name}</span>
                            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                        </button>
                    ))}
                </div>

                <div className="mt-6 flex flex-col gap-3">
                    <button onClick={() => setShowAbout(true)} className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-gray-100 dark:bg-[#1f1f1f] text-forest dark:text-white font-bold active:scale-[0.98] transition-transform shadow-sm">
                        <span className="material-symbols-outlined">info</span>
                        <span>О программе</span>
                    </button>
                     <button onClick={signOut} className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-red-500/10 text-red-500 font-bold active:scale-[0.98] transition-transform">
                        <span className="material-symbols-outlined">logout</span>
                        <span>Выйти</span>
                    </button>
                </div>
            </main>
            
            {showAbout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm" onClick={() => setShowAbout(false)}>
                    <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-forest dark:text-white">О программе</h2>
                            <button onClick={() => setShowAbout(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-4 text-sage dark:text-gray-300">
                            <p>
                                <strong className="text-forest dark:text-white">Идея и разработка:</strong><br/>
                                Антон Карпов © 2026
                            </p>
                            <p>
                                Я являюсь действующим консультантом компании doTERRA.<br/>
                                <strong className="text-forest dark:text-white">ID:</strong> 9672780
                            </p>
                            <p>
                                <strong className="text-forest dark:text-white">Telegram:</strong><br/>
                                <a href="https://t.me/AntonKarpov79" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    @AntonKarpov79
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {showThemeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm" onClick={() => setShowThemeModal(false)}>
                    <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-forest dark:text-white">Тема оформления</h2>
                            <button onClick={() => setShowThemeModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-3">
                            <button 
                                onClick={() => { setTheme('light'); setShowThemeModal(false); }}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f]'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-forest dark:text-white">light_mode</span>
                                    <span className="font-semibold text-forest dark:text-white">Светлая</span>
                                </div>
                                {theme === 'light' && <span className="material-symbols-outlined text-primary">check_circle</span>}
                            </button>
                            <button 
                                onClick={() => { setTheme('dark'); setShowThemeModal(false); }}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f]'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-forest dark:text-white">dark_mode</span>
                                    <span className="font-semibold text-forest dark:text-white">Темная</span>
                                </div>
                                {theme === 'dark' && <span className="material-symbols-outlined text-primary">check_circle</span>}
                            </button>
                            <button 
                                onClick={() => { setTheme('system'); setShowThemeModal(false); }}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f]'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-forest dark:text-white">settings_system_daydream</span>
                                    <span className="font-semibold text-forest dark:text-white">Системная</span>
                                </div>
                                {theme === 'system' && <span className="material-symbols-outlined text-primary">check_circle</span>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNavBar />
        </div>
    );
};

export default ProfileScreen;
