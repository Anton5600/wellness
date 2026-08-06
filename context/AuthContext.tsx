
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as firebaseSignOut, 
  deleteUser,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '../firebaseConfig'; 
import { User } from '../types';
import { deleteAllUserData } from '../services/firestoreService';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithVK: (useLegacy?: boolean) => Promise<void>;
  signInWithYandex: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  reloadUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user authenticated via VK or Yandex OAuth redirect
    const savedVkUser = localStorage.getItem('vk_auth_user');
    const savedYandexUser = localStorage.getItem('yandex_auth_user');
    if (savedYandexUser) {
      try {
        const parsed = JSON.parse(savedYandexUser);
        if (parsed && parsed.uid) {
          setUser({
            uid: parsed.uid,
            email: parsed.email || 'Yandex User',
            name: parsed.name || 'Пользователь Яндекс',
            emailVerified: true,
          });
        }
      } catch (e) {
        console.error("Error parsing saved Yandex user", e);
      }
    } else if (savedVkUser) {
      try {
        const parsed = JSON.parse(savedVkUser);
        if (parsed && parsed.uid) {
          setUser({
            uid: parsed.uid,
            email: parsed.email || 'VK User',
            name: parsed.name || 'Пользователь VK',
            emailVerified: true,
          });
        }
      } catch (e) {
        console.error("Error parsing saved VK user", e);
      }
    }

    // Listen for postMessage from auth popups
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'VK_AUTH_SUCCESS' && event.data.user) {
        const vkUser = event.data.user;
        const appUser: User = {
          uid: vkUser.uid,
          email: vkUser.email || 'VK User',
          name: vkUser.name || 'Пользователь VK',
          emailVerified: true,
        };
        localStorage.setItem('vk_auth_user', JSON.stringify(vkUser));
        setUser(appUser);
      } else if (event.data && event.data.type === 'YANDEX_AUTH_SUCCESS' && event.data.user) {
        const yandexUser = event.data.user;
        const appUser: User = {
          uid: yandexUser.uid,
          email: yandexUser.email || 'Yandex User',
          name: yandexUser.name || 'Пользователь Яндекс',
          emailVerified: true,
        };
        localStorage.setItem('yandex_auth_user', JSON.stringify(yandexUser));
        setUser(appUser);
      }
    };
    window.addEventListener('message', handleMessage);

    // Listen for mobile deep link appUrlOpen (for OAuth in Capacitor)
    const handleAppUrlOpen = async (event: { url: string }) => {
      if (event.url && event.url.includes('wellness://auth')) {
        try {
          const urlObj = new URL(event.url);
          const dataParam = urlObj.searchParams.get('data');
          if (dataParam) {
            const oauthUser = JSON.parse(decodeURIComponent(dataParam));
            const isYandex = oauthUser.provider === 'yandex';
            const appUser: User = {
              uid: oauthUser.uid,
              email: oauthUser.email || (isYandex ? 'Yandex User' : 'VK User'),
              name: oauthUser.name || (isYandex ? 'Пользователь Яндекс' : 'Пользователь VK'),
              emailVerified: true,
            };
            localStorage.setItem(isYandex ? 'yandex_auth_user' : 'vk_auth_user', JSON.stringify(oauthUser));
            setUser(appUser);
            await Browser.close().catch(() => {});
          }
        } catch (e) {
          console.error("Error handling deep link auth", e);
        }
      }
    };

    const appUrlListener = App.addListener('appUrlOpen', handleAppUrlOpen);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || 'No email',
          name: firebaseUser.displayName || 'No name',
          emailVerified: firebaseUser.emailVerified,
        };
        setUser(appUser);
        localStorage.removeItem('vk_auth_user'); // Clear local overrides if Firebase user exists
        localStorage.removeItem('yandex_auth_user');
      } else if (!localStorage.getItem('vk_auth_user') && !localStorage.getItem('yandex_auth_user')) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('message', handleMessage);
      appUrlListener.then(listener => listener.remove()).catch(() => {});
    };
  }, []);

  const getApiOrigin = () => {
    if (Capacitor.isNativePlatform()) {
      return "https://internal-compass.ru";
    }
    return window.location.origin;
  };

  const signInWithVK = async (useLegacy?: boolean) => {
    let authUrl = '';
    try {
      const apiOrigin = getApiOrigin();
      const apiUrl = `${apiOrigin}/api/auth/vk/url${useLegacy ? '?legacy=true' : ''}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.url) {
        authUrl = data.url;
      }
    } catch (e) {
      console.warn("Could not fetch VK auth URL from backend, using direct fallback:", e);
    }

    if (!authUrl) {
      const apiOrigin = getApiOrigin();
      const redirectUri = `${apiOrigin}/api/auth/vk/callback`;
      const appId = import.meta.env.VITE_VK_APP_ID || "54703393";
      const state = Math.random().toString(36).substring(2, 15);
      if (useLegacy) {
        authUrl = `https://oauth.vk.com/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&display=page&scope=email&response_type=code&v=5.131&state=${state}`;
      } else {
        authUrl = `https://id.vk.ru/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=vkid.personal_info%20email&state=${state}`;
      }
    }

    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: authUrl });
      } else {
        // Open popup for VK authentication
        const width = 600;
        const height = 650;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        const popup = window.open(
          authUrl,
          'vk_auth',
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
        );

        if (!popup) {
          // If popup is blocked by browser, redirect current page
          window.location.href = authUrl;
        }
      }
    } catch (e) {
      console.error("Error initiating VK sign in:", e);
      throw e;
    }
  };

  const signInWithYandex = async () => {
    let authUrl = '';
    try {
      const apiOrigin = getApiOrigin();
      const apiUrl = `${apiOrigin}/api/auth/yandex/url`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.url) {
        authUrl = data.url;
      }
    } catch (e) {
      console.warn("Could not fetch Yandex auth URL from backend, using direct fallback:", e);
    }

    if (!authUrl) {
      const apiOrigin = getApiOrigin();
      const redirectUri = `${apiOrigin}/api/auth/yandex/callback`;
      const clientId = import.meta.env.VITE_YANDEX_CLIENT_ID || "";
      const state = Math.random().toString(36).substring(2, 15);
      authUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: authUrl });
      } else {
        // Open popup for Yandex authentication
        const width = 600;
        const height = 650;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        const popup = window.open(
          authUrl,
          'yandex_auth',
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
        );

        if (!popup) {
          window.location.href = authUrl;
        }
      }
    } catch (e) {
      console.error("Error initiating Yandex sign in:", e);
      throw e;
    }
  };

  const reloadUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const firebaseUser = auth.currentUser;
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || 'No email',
        name: firebaseUser.displayName || 'No name',
        emailVerified: firebaseUser.emailVerified,
      });
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    
    try {
      await sendEmailVerification(userCredential.user);
    } catch (error) {
      console.error("Ошибка при отправке письма верификации:", error);
    }
    
    setUser({
      uid: userCredential.user.uid,
      email: userCredential.user.email || 'No email',
      name: name,
      emailVerified: userCredential.user.emailVerified,
    });
  };

  const signOut = async () => {
    localStorage.removeItem('vk_auth_user');
    localStorage.removeItem('yandex_auth_user');
    setUser(null);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Sign out warning:", e);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const deleteAccount = async () => {
    localStorage.removeItem('vk_auth_user');
    localStorage.removeItem('yandex_auth_user');
    if (auth.currentUser) {
      await deleteAllUserData(auth.currentUser.uid);
      await deleteUser(auth.currentUser);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithVK, signInWithYandex, signInWithEmail, signUpWithEmail, signOut, deleteAccount, reloadUser, resetPassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
