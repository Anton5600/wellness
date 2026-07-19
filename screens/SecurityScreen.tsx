import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SecurityScreen: React.FC = () => {
    const { user, deleteAccount } = useAuth();
    const navigate = useNavigate();
    
    const [pinEnabled, setPinEnabled] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [confirmPinInput, setConfirmPinInput] = useState('');
    const [step, setStep] = useState<'create' | 'confirm'>('create');
    const [pinError, setPinError] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (user) {
            const existingPin = localStorage.getItem(`app_pin_${user.uid}`);
            setPinEnabled(!!existingPin);
        }
    }, [user]);

    const handleTogglePin = () => {
        if (pinEnabled) {
            // Disable PIN
            if (user) {
                localStorage.removeItem(`app_pin_${user.uid}`);
                setPinEnabled(false);
            }
        } else {
            // Enable PIN
            setStep('create');
            setPinInput('');
            setConfirmPinInput('');
            setPinError('');
            setShowPinModal(true);
        }
    };

    const handlePinSubmit = () => {
        if (step === 'create') {
            if (pinInput.length !== 4) {
                setPinError('ПИН-код должен состоять из 4 цифр');
                return;
            }
            setStep('confirm');
            setPinError('');
        } else {
            if (pinInput !== confirmPinInput) {
                setPinError('ПИН-коды не совпадают');
                setConfirmPinInput('');
                return;
            }
            if (user) {
                localStorage.setItem(`app_pin_${user.uid}`, pinInput);
                setPinEnabled(true);
                setShowPinModal(false);
            }
        }
    };

    const handleNumberClick = (num: string) => {
        if (step === 'create') {
            if (pinInput.length < 4) setPinInput(prev => prev + num);
        } else {
            if (confirmPinInput.length < 4) setConfirmPinInput(prev => prev + num);
        }
    };

    const handleDeleteClick = () => {
        if (step === 'create') {
            setPinInput(prev => prev.slice(0, -1));
        } else {
            setConfirmPinInput(prev => prev.slice(0, -1));
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setDeleteError('');
        try {
            await deleteAccount();
            navigate('/signin');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/requires-recent-login') {
                setDeleteError('Для удаления аккаунта требуется недавняя авторизация. Пожалуйста, выйдите и войдите снова.');
            } else {
                setDeleteError('Произошла ошибка при удалении аккаунта.');
            }
            setIsDeleting(false);
        }
    };

    const renderPinDots = (currentInput: string) => {
        return (
            <div className="flex justify-center gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`size-4 rounded-full ${i < currentInput.length ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="pb-28 bg-background-light dark:bg-background-dark min-h-[100dvh]">
            <header className="flex items-center p-4 pb-2 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40">
                <button onClick={() => navigate(-1)} className="text-forest dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer">
                    <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
                <h1 className="text-xl font-extrabold text-forest dark:text-white ml-2">Безопасность</h1>
            </header>

            <main className="px-6 mt-4">
                <div className="bg-white dark:bg-[#1f1f1f] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-forest dark:text-white text-lg">Вход по ПИН-коду</h3>
                            <p className="text-sage dark:text-gray-400 text-sm mt-1">Защитите свои данные от посторонних</p>
                        </div>
                        <button 
                            onClick={handleTogglePin}
                            className={`w-12 h-6 rounded-full transition-colors relative ${pinEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <div className={`absolute top-1 size-4 bg-white rounded-full transition-transform ${pinEnabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                <div className="mt-8">
                    <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full bg-white dark:bg-[#1f1f1f] rounded-xl p-4 shadow-sm border border-red-100 dark:border-red-900/30 flex items-center justify-between"
                    >
                        <div className="text-left">
                            <h3 className="font-bold text-red-500 text-lg">Удалить аккаунт</h3>
                            <p className="text-sage dark:text-gray-400 text-sm mt-1">Навсегда удалить все данные и историю</p>
                        </div>
                        <span className="material-symbols-outlined text-red-500">delete_forever</span>
                    </button>
                </div>
            </main>

            {/* PIN Setup Modal */}
            {showPinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
                    <div className="w-full max-w-sm p-6 flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-12">
                            <button onClick={() => setShowPinModal(false)} className="text-gray-400">Отмена</button>
                            <h2 className="text-xl font-bold text-forest dark:text-white">
                                {step === 'create' ? 'Придумайте ПИН-код' : 'Повторите ПИН-код'}
                            </h2>
                            <div className="w-12"></div>
                        </div>

                        {renderPinDots(step === 'create' ? pinInput : confirmPinInput)}
                        
                        {pinError && <p className="text-red-500 text-sm mb-4">{pinError}</p>}

                        <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button 
                                    key={num} 
                                    onClick={() => handleNumberClick(num.toString())}
                                    className="size-16 rounded-full bg-gray-100 dark:bg-gray-800 text-2xl font-bold text-forest dark:text-white flex items-center justify-center active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                                >
                                    {num}
                                </button>
                            ))}
                            <div className="size-16"></div>
                            <button 
                                onClick={() => handleNumberClick('0')}
                                className="size-16 rounded-full bg-gray-100 dark:bg-gray-800 text-2xl font-bold text-forest dark:text-white flex items-center justify-center active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
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

                        <button 
                            onClick={handlePinSubmit}
                            disabled={step === 'create' ? pinInput.length !== 4 : confirmPinInput.length !== 4}
                            className="mt-12 w-full py-4 rounded-xl bg-primary text-forest font-bold disabled:opacity-50 transition-opacity"
                        >
                            Продолжить
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteModal(false)}>
                    <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-red-500 mb-2">Удаление аккаунта</h2>
                        <p className="text-sage dark:text-gray-300 mb-6">
                            Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо. Вся ваша история эмоций будет удалена навсегда.
                        </p>
                        
                        {deleteError && <p className="text-red-500 text-sm mb-4">{deleteError}</p>}

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="w-full py-3 rounded-xl bg-red-500 text-white font-bold disabled:opacity-50 flex justify-center items-center"
                            >
                                {isDeleting ? 'Удаление...' : 'Да, удалить навсегда'}
                            </button>
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-forest dark:text-white font-bold"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecurityScreen;
