
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute

const SignInScreen: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [bgImage, setBgImage] = useState('');

  // Rate limiting state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    const images = [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=200",
      "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=400&h=200",
      "https://images.unsplash.com/photo-1499336315816-097655dcfbda?auto=format&fit=crop&q=80&w=400&h=200",
      "https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&q=80&w=400&h=200",
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=400&h=200"
    ];
    setBgImage(images[Math.floor(Math.random() * images.length)]);
  }, []);

  // Lockout timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockoutUntil) {
      interval = setInterval(() => {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockoutUntil(null);
          setFailedAttempts(0);
          setLockoutRemaining(0);
          setError('');
        } else {
          setLockoutRemaining(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleFailedAttempt = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
      setError(`Слишком много попыток. Пожалуйста, подождите 60 секунд.`);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil) return;

    if (!email || !password || (isSignUp && !name)) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      setFailedAttempts(0); // Reset on success
    } catch (error: any) {
      console.error("Email Auth Error:", error);
      setError(error.message || 'Ошибка авторизации');
      handleFailedAttempt();
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil) return;

    if (!email) {
      setError('Пожалуйста, введите email');
      return;
    }
    try {
      setError('');
      setResetMessage('');
      setLoading(true);
      await resetPassword(email);
      setResetMessage('Ссылка для восстановления пароля отправлена на вашу почту.');
      setFailedAttempts(0); // Reset on success
      setLoading(false);
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      setError(error.message || 'Ошибка при отправке письма');
      handleFailedAttempt();
      setLoading(false);
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-[100dvh] flex flex-col">
      <div className="flex items-center bg-transparent p-4 pb-2 justify-between">
        <button onClick={() => isForgotPassword ? setIsForgotPassword(false) : navigate(-1)} className="text-forest dark:text-white flex size-12 shrink-0 items-center justify-center">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios</span>
        </button>
        <h2 className="text-forest dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          {isForgotPassword ? 'Восстановление' : (isSignUp ? 'Регистрация' : 'Вход в аккаунт')}
        </h2>
      </div>
      <div className="flex-1 flex flex-col relative overflow-y-auto px-6">
        {bgImage && (
          <div className="w-full h-32 md:h-40 rounded-2xl overflow-hidden mb-2 mt-2 shrink-0 shadow-sm">
            <img src={bgImage} alt="Wellness" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}
        <div className="pt-4 pb-4 shrink-0">
          <h1 className="text-forest dark:text-white tracking-tight text-[32px] font-bold leading-tight">
            {isForgotPassword ? 'Восстановление пароля' : 'Ваш путь к гармонии'}
          </h1>
          <p className="text-sage mt-2 text-base">
            {isForgotPassword 
              ? 'Введите email, на который зарегистрирован аккаунт, и мы отправим ссылку для сброса пароля.' 
              : (isSignUp ? 'Создайте аккаунт, чтобы начать свое путешествие.' : 'Войдите, чтобы продолжить свое путешествие.')}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4" role="alert">
            <span className="block sm:inline text-sm">{error}</span>
          </div>
        )}

        {resetMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl relative mb-4" role="alert">
            <span className="block sm:inline text-sm">{resetMessage}</span>
          </div>
        )}

        <form onSubmit={isForgotPassword ? handlePasswordReset : handleEmailAuth} className="flex flex-col gap-2 py-4">
          {isSignUp && !isForgotPassword && (
            <div className="flex flex-col w-full pb-2">
              <label className="text-forest dark:text-white text-base font-medium leading-normal pb-2">Имя</label>
              <input 
                className="form-input flex w-full rounded-xl text-forest focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-sage/20 bg-white dark:bg-sage/10 dark:text-white dark:placeholder:text-gray-400 dark:border-sage/40 h-14 placeholder:text-sage/50 p-4 text-base font-normal disabled:opacity-50" 
                placeholder="Ваше имя" 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignUp}
                disabled={!!lockoutUntil}
              />
            </div>
          )}
          <div className="flex flex-col w-full">
            <label className="text-forest dark:text-white text-base font-medium leading-normal pb-2">Электронная почта</label>
            <input 
              className="form-input flex w-full rounded-xl text-forest focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-sage/20 bg-white dark:bg-sage/10 dark:text-white dark:placeholder:text-gray-400 dark:border-sage/40 h-14 placeholder:text-sage/50 p-4 text-base font-normal disabled:opacity-50" 
              placeholder="your@email.com" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!lockoutUntil}
            />
          </div>
          
          {!isForgotPassword && (
            <div className="flex flex-col w-full pt-4">
              <label className="text-forest dark:text-white text-base font-medium leading-normal pb-2">Пароль</label>
              <div className="flex w-full items-stretch rounded-xl border border-sage/20 bg-white dark:bg-sage/10 dark:border-sage/40 overflow-hidden focus-within:ring-2 focus-within:ring-primary/50">
                <input 
                  className="form-input flex w-full border-none focus:ring-0 bg-transparent h-14 placeholder:text-sage/50 dark:text-white dark:placeholder:text-gray-400 p-4 text-base font-normal disabled:opacity-50" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={!!lockoutUntil}
                />
                <div 
                  className="text-sage dark:text-gray-400 flex items-center justify-center pr-4 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {!isSignUp && !isForgotPassword && (
            <div className="flex justify-end pt-1">
              <button 
                type="button" 
                onClick={() => { setIsForgotPassword(true); setError(''); setResetMessage(''); }} 
                className="text-sage text-sm font-medium hover:text-primary disabled:opacity-50"
                disabled={!!lockoutUntil}
              >
                Забыли пароль?
              </button>
            </div>
          )}
          
          <div className="pt-6 flex flex-col gap-4">
            <button 
              type="submit" 
              disabled={loading || !!lockoutUntil}
              className="w-full bg-primary text-forest font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {lockoutUntil 
                ? `Подождите ${lockoutRemaining} сек.` 
                : (loading ? 'Загрузка...' : (isForgotPassword ? 'Отправить ссылку' : (isSignUp ? 'Зарегистрироваться' : 'Войти')))}
            </button>
            <p className="text-xs text-center text-sage dark:text-gray-400 mt-2 px-4 leading-relaxed">
              Продолжая, вы соглашаетесь с{' '}
              <button type="button" onClick={() => navigate('/legal/terms')} className="underline hover:text-primary">Пользовательским соглашением</button>{' '}
              и{' '}
              <button type="button" onClick={() => navigate('/legal/privacy')} className="underline hover:text-primary">Политикой конфиденциальности</button>.
            </p>
            
            {isForgotPassword && (
              <button 
                type="button" 
                onClick={() => { setIsForgotPassword(false); setError(''); setResetMessage(''); }} 
                disabled={loading || !!lockoutUntil}
                className="w-full bg-transparent border border-sage/30 text-forest dark:text-white font-semibold py-4 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Назад ко входу
              </button>
            )}
          </div>
        </form>
        
        <div className="flex-1"></div>
        
        {!isForgotPassword && (
          <div className="relative w-full pt-12 pb-10 mt-auto">
            <div className="relative z-10 flex flex-col items-center gap-2">
              <p className="text-sage text-base">
                {isSignUp ? 'Уже есть аккаунт?' : 'Впервые здесь?'} 
                <button 
                  type="button" 
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  className="text-forest dark:text-white font-bold hover:text-primary ml-2"
                >
                  {isSignUp ? 'Войти' : 'Присоединиться'}
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignInScreen;
