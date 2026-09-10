
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import SignInScreen from './screens/SignInScreen';
import DashboardScreen from './screens/DashboardScreen';
import QuizQuestionScreen from './screens/QuizQuestionScreen';
import QuizResultScreen from './screens/QuizResultScreen';
import RitualSetupScreen from './screens/RitualSetupScreen';
import OnboardingResultScreen from './screens/OnboardingResultScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProgressScreen from './screens/ProgressScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ProfileScreen from './screens/ProfileScreen';
import SecurityScreen from './screens/SecurityScreen';
import LockScreen from './screens/LockScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import CheckInScreen from './screens/CheckInScreen';
import EntryBridgeScreen from './screens/EntryBridgeScreen';
import ResourcesScreen from './screens/ResourcesScreen';
import PracticeScreen from './screens/PracticeScreen';
import VerifyEmailScreen from './screens/VerifyEmailScreen';
import CabinetScreen from './screens/CabinetScreen';
import AdminScreen from './screens/AdminScreen';
import AdminOilsScreen from './screens/AdminOilsScreen';
import AdminOrdersScreen from './screens/AdminOrdersScreen';
import AdminCardsScreen from './screens/AdminCardsScreen';
import CartScreen from './screens/CartScreen';
import SymbolsDictionaryScreen from './screens/SymbolsDictionaryScreen';
import LegalScreen from './screens/LegalScreen';
import { myTrackerService } from './services/myTrackerService';
import { compassService } from './services/compassService';
import { checkPlutchikProfile } from './services/firestoreService';
import { useFirestoreSync, SYNC_EVENT } from './hooks/useFirestoreSync';

const BackButtonHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let removeListener: (() => void) | null = null;

    const handleBackButton = () => {
      if (location.pathname === '/' || location.pathname === '/signin' || location.pathname === '/onboarding') {
        try {
          CapacitorApp.exitApp();
        } catch {}
      } else {
        navigate(-1);
      }
    };

    try {
      if (CapacitorApp && typeof CapacitorApp.addListener === 'function') {
        const res = CapacitorApp.addListener('backButton', handleBackButton);
        if (res && typeof res.then === 'function') {
          res.then((listener) => {
            if (listener && typeof listener.remove === 'function') {
              removeListener = () => listener.remove();
            }
          }).catch(() => {});
        }
      }
    } catch {}

    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, [navigate, location.pathname]);

  return null;
};

const App: React.FC = () => {
  useEffect(() => {
    // Initialize Capgo OTA updates on startup
    import('./services/capgoUpdate').then(({ initializeCapgoUpdate }) => {
      initializeCapgoUpdate().catch(err => {
        console.error('[CapgoUpdate] Failed to initialize:', err);
      });
    });

    // Run the RuStore update check on mount
    import('./services/ruStoreUpdate').then(({ checkAndPromptRuStoreUpdate }) => {
      checkAndPromptRuStoreUpdate().catch(err => {
        console.error('[RuStoreUpdate] Global error:', err);
      });
    });

    // Initialize MyTracker analytics service on app startup
    try {
      myTrackerService.init();
    } catch (err) {
      console.error('[MyTracker] Failed to initialize:', err);
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <div className="bg-background-light dark:bg-background-dark min-h-[100dvh]">
            <div className="relative mx-auto flex h-full min-h-[100dvh] w-full max-w-[430px] flex-col overflow-x-hidden bg-white shadow-2xl dark:bg-[#0a0a0a] pb-[env(safe-area-inset-bottom)]">
                <AppRoutes />
            </div>
          </div>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

const GateSpinner: React.FC = () => (
  <div className="flex min-h-[100dvh] items-center justify-center bg-background-light dark:bg-background-dark">
    <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MAX_PROFILE_ATTEMPTS = 3;

/**
 * Состояние профиля Плутчика для гейтов онбординга. `no-user` — ещё не авторизован
 * (гейты тогда просто пропускают детей, как и раньше).
 *
 * Ретраи здесь только на `unknown` — неудачное чтение (таймаут, отказ правил, нет токена).
 * Достоверный `absent` означает нового пользователя, и ждать ему нечего: достоверность
 * обеспечивает `waitForAuthToken()` внутри `checkPlutchikProfile`. Ретрай на `absent` давал
 * новичку ~12s спиннера (2s+4s в прямом гейте, затем столько же в обратном).
 *
 * На `SYNC_EVENT` проверка повторяется: фоновая синхронизация могла подтянуть профиль из
 * Firestore на свежей установке, где локальный кеш пуст.
 */
const usePlutchikProfileGate = (): 'checking' | 'present' | 'absent' | 'no-user' => {
  const { user } = useAuth();
  const [state, setState] = useState<'checking' | 'present' | 'absent' | 'no-user'>('checking');

  useEffect(() => {
    if (!user) {
      setState('no-user');
      return;
    }
    let active = true;
    let running = false;

    const check = async () => {
      if (running) return;
      running = true;
      try {
        compassService.setCurrentUserId(user.uid);
        for (let attempt = 0; attempt < MAX_PROFILE_ATTEMPTS; attempt += 1) {
          const result = await checkPlutchikProfile(user.uid);
          if (!active) return;
          if (result === 'present') return setState('present');
          if (result === 'absent') return setState('absent');
          await sleep((attempt + 1) * 1000); // 'unknown' — чтение не удалось, пробуем ещё
          if (!active) return;
        }
        setState('absent');
      } finally {
        running = false;
      }
    };

    check();
    window.addEventListener(SYNC_EVENT, check);

    return () => {
      active = false;
      window.removeEventListener(SYNC_EVENT, check);
    };
  }, [user]);

  return state;
};

/**
 * Гейт онбординга нового пользователя. Пока базовый профиль Плутчика не сохранён,
 * любой защищённый экран перенаправляется на настройку ритуалов. Проверка по
 * локальному кешу, затем по Firestore (`plutchikProfiles/{uid}`).
 */
const RequireOnboarding: React.FC = () => {
  const state = usePlutchikProfileGate();

  if (state === 'checking') return <GateSpinner />;
  if (state === 'absent') return <Navigate to="/rituals" replace />;
  return <Outlet />;
};

/**
 * Обратный гейт: если профиль Плутчика уже есть (пользователь вернулся после переустановки
 * или с другого устройства), экраны онбординга не показываем — сразу на дашборд.
 */
const RequireNoOnboarding: React.FC = () => {
  const state = usePlutchikProfileGate();

  if (state === 'checking') return <GateSpinner />;
  if (state === 'present') return <Navigate to="/" replace />;
  return <Outlet />;
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const [isLocked, setIsLocked] = useState(false);

  // Фоновая синхронизация профиля с Firestore (вход / возврат в приложение / периодически).
  useFirestoreSync();

  useEffect(() => {
    if (user && !loading) {
      const pin = localStorage.getItem(`app_pin_${user.uid}`);
      const sessionUnlocked = sessionStorage.getItem(`app_unlocked_${user.uid}`);
      if (pin && !sessionUnlocked) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } else {
      setIsLocked(false);
    }
  }, [user, loading]);

  const handleUnlock = () => {
    if (user) {
      sessionStorage.setItem(`app_unlocked_${user.uid}`, 'true');
      setIsLocked(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-[100dvh] flex flex-col">
        <div className="relative mx-auto flex h-full min-h-[100dvh] w-full max-w-[430px] flex-col overflow-x-hidden bg-white shadow-2xl dark:bg-[#0a0a0a] animate-pulse">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-800"></div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
              </div>
            </div>
            <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-800"></div>
          </div>
          <div className="px-6 py-6">
            <div className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-800 w-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-6 pb-4">
            <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-800"></div>
            <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-800"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isLocked && user) {
    return <LockScreen onUnlock={handleUnlock} userUid={user.uid} />;
  }

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <BackButtonHandler />
      <Routes>
        <Route path="/legal/:documentType" element={<LegalScreen />} />
        {user ? (
          <>
            {/* Онбординг нового пользователя: ритуалы → квиз Плутчика → результат.
                Обёрнут в RequireNoOnboarding: если профиль уже есть — сразу на дашборд. */}
            <Route element={<RequireNoOnboarding />}>
              <Route path="/rituals" element={<RitualSetupScreen />} />
              <Route path="/quiz" element={<QuizQuestionScreen />} />
              <Route path="/onboarding-result" element={<OnboardingResultScreen />} />
            </Route>
            <Route path="/verify-email" element={<VerifyEmailScreen />} />

            {/* Основное приложение (доступно после онбординга) */}
            <Route element={<RequireOnboarding />}>
              <Route path="/" element={<DashboardScreen />} />
              <Route path="/result" element={<QuizResultScreen />} />
              <Route path="/history" element={<HistoryScreen />} />
              <Route path="/progress" element={<ProgressScreen />} />
              <Route path="/cabinet" element={<CabinetScreen />} />
              <Route path="/cart" element={<CartScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/security" element={<SecurityScreen />} />
              <Route path="/notifications" element={<NotificationsScreen />} />
              <Route path="/check-in" element={<CheckInScreen />} />
              <Route path="/entry" element={<EntryBridgeScreen />} />
              <Route path="/resources" element={<ResourcesScreen />} />
              <Route path="/practice/:id" element={<PracticeScreen />} />
              <Route path="/admin" element={<AdminScreen />} />
              <Route path="/admin-oils" element={<AdminOilsScreen />} />
              <Route path="/admin-orders" element={<AdminOrdersScreen />} />
              <Route path="/admin-cards" element={<AdminCardsScreen />} />
              <Route path="/symbols-dictionary" element={<SymbolsDictionaryScreen />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Route>
          </>
        ) : (
          <>
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/signin" element={<SignInScreen />} />
            <Route path="*" element={<Navigate to="/onboarding" />} />
          </>
        )}
      </Routes>
    </HashRouter>
  );
};

export default App;
