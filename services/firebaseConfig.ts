// Файл: /services/firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ВАЖНО: Храните эти данные в безопасности!
// Лучше всего использовать переменные окружения (.env файл)
const firebaseConfig = {
  apiKey: "AIzaSyDyLrpeGAN6HFhfk3SpEWPmqjk4Rv42Bc0",
  authDomain: "brazzz-5f4b8.firebaseapp.com",
  projectId: "brazzz-5f4b8",
  storageBucket: "brazzz-5f4b8.firebasestorage.app",
  messagingSenderId: "1001756294399",
  appId: "1:1001756294399:web:d51d1b2d57fd86db2d60ca"
};

// Инициализируем Firebase
const app = initializeApp(firebaseConfig);

// Экспортируем сервисы, которые будем использовать в приложении
export const auth = getAuth(app);
export const db = getFirestore(app, 'wellness');