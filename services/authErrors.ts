// Дружелюбные русские сообщения для кодов ошибок Firebase Auth.
// `error.message` из SDK — сырое «Firebase: Error (auth/…)», поэтому
// показываем текст по коду `error.code`, а не по message.

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Такой пользователь уже зарегистрирован. Войдите или восстановите пароль.',
  'auth/invalid-email': 'Некорректный email. Проверьте адрес и попробуйте снова.',
  'auth/invalid-credential': 'Неверный email или пароль.',
  'auth/wrong-password': 'Неверный email или пароль.',
  'auth/user-not-found': 'Пользователь с таким email не найден.',
  'auth/weak-password': 'Пароль слишком короткий. Используйте минимум 6 символов.',
  'auth/too-many-requests': 'Слишком много попыток. Подождите немного и попробуйте снова.',
  'auth/network-request-failed': 'Проблема с сетью. Проверьте подключение и попробуйте снова.',
  'auth/user-disabled': 'Этот аккаунт отключён.',
  'auth/operation-not-allowed': 'Этот способ входа временно недоступен.',
  'auth/requires-recent-login': 'Для этого действия войдите заново.',
  'auth/popup-closed-by-user': 'Вход отменён.',
};

/** Возвращает понятное сообщение по коду ошибки Firebase Auth, либо fallback. */
export const friendlyAuthError = (error: unknown, fallback = 'Ошибка авторизации'): string => {
  const code = (error as { code?: string } | null | undefined)?.code;
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  return fallback;
};
