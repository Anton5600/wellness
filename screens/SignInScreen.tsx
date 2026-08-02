
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { myTrackerService } from '../services/myTrackerService';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute

const SignInScreen: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, resetPassword, signInWithVK } = useAuth();
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

  // VK ID Config Helpers
  const [showVkHelp, setShowVkHelp] = useState(false);
  const [vkConfig, setVkConfig] = useState<{ appId: string; redirectUri: string; isConfigured: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchVkConfig = async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/auth/vk/config`);
        if (res.ok) {
          const data = await res.json();
          setVkConfig(data);
        }
      } catch (err) {
        console.warn("Failed to fetch VK config:", err);
      }
    };
    fetchVkConfig();
  }, []);

  const handleCopyRedirectUri = () => {
    if (vkConfig?.redirectUri) {
      navigator.clipboard.writeText(vkConfig.redirectUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  const handleVkAuth = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithVK();
      myTrackerService.trackLogin('vk_user', 'vk');
      setLoading(false);
    } catch (err: any) {
      console.error("VK Auth error:", err);
      setError('Не удалось войти через VK ID. Проверьте подключение.');
      setLoading(false);
    }
  };

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
        myTrackerService.trackRegistration(email, 'email');
      } else {
        await signInWithEmail(email, password);
        myTrackerService.trackLogin(email, 'email');
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
            {!isForgotPassword && (
              <>
                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-sage/20 w-full"></div>
                  <span className="bg-background-light dark:bg-background-dark px-3 text-xs text-sage font-medium uppercase tracking-wider">или</span>
                  <div className="border-t border-sage/20 w-full"></div>
                </div>

                <button 
                  type="button"
                  onClick={handleVkAuth}
                  disabled={loading || !!lockoutUntil}
                  className="w-full bg-[#0077FF] hover:bg-[#0066EE] text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 shadow-md shadow-[#0077FF]/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.05-1.713-1.033-1.01-1.49-1.136-1.744-1.136-.356 0-.458.102-.458.585v1.652c0 .432-.136.686-1.288.686-1.898 0-4.008-1.152-5.492-3.297-2.229-3.152-2.83-5.525-2.83-6.008 0-.254.102-.492.593-.492h1.746c.44 0 .61.203.78.686.856 2.483 2.28 4.653 2.873 4.653.22 0 .322-.102.322-.66V9.722c-.085-1.186-.695-1.288-.695-1.712 0-.203.17-.407.44-.407h2.746c.373 0 .508.203.508.66v3.559c0 .39.17.525.288.525.22 0 .407-.136.814-.543 1.254-1.406 2.152-3.576 2.152-3.576.119-.254.322-.492.763-.492h1.746c.525 0 .635.27.525.66-.22.992-2.297 3.966-2.297 3.966-.186.288-.254.424 0 .763.17.237.746.729 1.136 1.186.712.814 1.254 1.492 1.398 1.958.153.441-.084.687-.525.687z"/>
                  </svg>
                  <span>Войти с VK ID</span>
                </button>

                {/* VK ID Helper Instructions */}
                <div className="mt-2 text-left">
                  <button
                    type="button"
                    onClick={() => setShowVkHelp(!showVkHelp)}
                    className="text-xs text-sage hover:text-primary flex items-center gap-1 font-medium transition-colors focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showVkHelp ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                    </span>
                    <span>Как настроить вход через VK ID?</span>
                  </button>

                  {showVkHelp && (
                    <div className="mt-3 bg-sage/5 dark:bg-white/5 rounded-xl p-4 border border-sage/15 text-xs text-forest dark:text-gray-200 space-y-3 leading-relaxed">
                      <p className="font-semibold text-primary">Инструкция по настройке приложения VK ID:</p>
                      <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-sage dark:text-gray-300">
                        <li>Перейдите в кабинет VK ID для бизнеса: <a href="https://id.vk.ru/about/business/go" target="_blank" rel="noopener noreferrer" className="underline text-[#0077FF]">id.vk.ru/about/business/go</a></li>
                        <li>Выберите ваше приложение (или создайте новое типа «Web-сайт»).</li>
                        <li>Перейдите в раздел <strong>«Настройки»</strong>.</li>
                        <li>Добавьте в поле <strong>«Разрешенные Redirect URI»</strong> (Адрес обратного вызова) следующее значение:</li>
                      </ol>

                      {vkConfig && (
                        <div className="flex items-stretch gap-1.5 bg-white dark:bg-black/20 p-2 rounded-lg border border-sage/10 select-all font-mono text-[10px] break-all">
                          <span className="flex-1">{vkConfig.redirectUri}</span>
                          <button
                            type="button"
                            onClick={handleCopyRedirectUri}
                            className="text-[#0077FF] hover:text-[#0066EE] font-sans font-bold px-1.5 shrink-0"
                          >
                            {copied ? "Скопировано!" : "Копировать"}
                          </button>
                        </div>
                      )}

                      <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-sage dark:text-gray-300" start={5}>
                        <li>Убедитесь, что <strong>ID приложения (App ID)</strong> совпадает с: <code className="bg-white dark:bg-black/20 px-1 py-0.5 rounded font-mono font-bold text-primary">{vkConfig?.appId || "54700577"}</code></li>
                        <li>Добавьте переменные <strong>VK_APP_ID</strong> и <strong>VK_CLIENT_SECRET</strong> (Защищенный ключ) в настройки AI Studio (в разделе Settings & Secrets) для вашего контейнера, чтобы сервер мог обменивать коды на токены.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </>
            )}

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
