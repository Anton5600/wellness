
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import SignInScreen from './screens/SignInScreen';
import DashboardScreen from './screens/DashboardScreen';
import QuizIntroScreen from './screens/QuizIntroScreen';
import QuizQuestionScreen from './screens/QuizQuestionScreen';
import QuizResultScreen from './screens/QuizResultScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProgressScreen from './screens/ProgressScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ProfileScreen from './screens/ProfileScreen';
import SecurityScreen from './screens/SecurityScreen';
import LockScreen from './screens/LockScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import VerifyEmailScreen from './screens/VerifyEmailScreen';
import CabinetScreen from './screens/CabinetScreen';
import AdminScreen from './screens/AdminScreen';
import AdminOilsScreen from './screens/AdminOilsScreen';
import AdminOrdersScreen from './screens/AdminOrdersScreen';
import AdminCardsScreen from './screens/AdminCardsScreen';
import CartScreen from './screens/CartScreen';
import SymbolsDictionaryScreen from './screens/SymbolsDictionaryScreen';
import LegalScreen from './screens/LegalScreen';

const BackButtonHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = ({ canGoBack }: { canGoBack: boolean }) => {
      // Exit the app if we are on root paths
      if (location.pathname === '/' || location.pathname === '/signin' || location.pathname === '/onboarding') {
        CapacitorApp.exitApp();
      } else {
        // Otherwise navigate back
        navigate(-1);
      }
    };

    const listenerPromise = CapacitorApp.addListener('backButton', handleBackButton);

    return () => {
      listenerPromise.then(listener => listener.remove());
    };
  }, [navigate, location.pathname]);

  return null;
};

const App: React.FC = () => {
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

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const [isLocked, setIsLocked] = useState(false);

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
          user.emailVerified ? (
            <>
              <Route path="/" element={<DashboardScreen />} />
              <Route path="/quiz-intro" element={<QuizIntroScreen />} />
              <Route path="/quiz" element={<QuizQuestionScreen />} />
              <Route path="/result" element={<QuizResultScreen />} />
              <Route path="/history" element={<HistoryScreen />} />
              <Route path="/progress" element={<ProgressScreen />} />
              <Route path="/cabinet" element={<CabinetScreen />} />
              <Route path="/cart" element={<CartScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/security" element={<SecurityScreen />} />
              <Route path="/notifications" element={<NotificationsScreen />} />
              <Route path="/admin" element={<AdminScreen />} />
              <Route path="/admin-oils" element={<AdminOilsScreen />} />
              <Route path="/admin-orders" element={<AdminOrdersScreen />} />
              <Route path="/admin-cards" element={<AdminCardsScreen />} />
              <Route path="/symbols-dictionary" element={<SymbolsDictionaryScreen />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <>
              <Route path="/verify-email" element={<VerifyEmailScreen />} />
              <Route path="*" element={<Navigate to="/verify-email" />} />
            </>
          )
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
