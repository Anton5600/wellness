import { Capacitor } from '@capacitor/core';

/**
 * Базовый URL серверного API для fetch-запросов.
 *
 * В веб-браузере возвращает '' (относительный путь — работает через Vite-proxy /
 * тот же origin). На нативном устройстве (Capacitor) локальные адреса эмулятора
 * (10.0.2.2, localhost, 127.0.0.1) и устаревшие домены исключаются, и запрос
 * перенаправляется на `VITE_API_URL`, либо на продуктивный сервер Amvera.
 */
export const resolveApiBaseUrl = (): string => {
  if (Capacitor.isNativePlatform()) {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;
    const isValid = !!envUrl &&
      envUrl.startsWith('http') &&
      !envUrl.includes('localhost') &&
      !envUrl.includes('10.0.2.2') &&
      !envUrl.includes('127.0.0.1') &&
      !envUrl.includes('onrender');
    return (isValid ? envUrl! : 'https://wellness-anton56.amvera.io').replace(/\/+$/, '');
  }
  return '';
};
