import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const VerifyEmailScreen: React.FC = () => {
  const { user, reloadUser, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleCheckVerification = async () => {
    setLoading(true);
    setError('');
    try {
      await reloadUser();
      if (!auth.currentUser?.emailVerified) {
        setError('Почта еще не подтверждена. Пожалуйста, проверьте папку "Спам", если не видите письмо.');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка проверки статуса');
    }
    setLoading(false);
  };

  const handleResendEmail = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setMessage('Письмо повторно отправлено! Проверьте вашу почту.');
      }
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError('Слишком много попыток. Пожалуйста, подождите немного перед повторной отправкой.');
      } else {
        setError(err.message || 'Ошибка при отправке письма');
      }
    }
    setLoading(false);
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white dark:bg-[#1f1f1f] p-8 rounded-3xl shadow-xl max-w-sm w-full flex flex-col items-center">
        <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-forest dark:text-white">mark_email_unread</span>
        </div>
        
        <h1 className="text-2xl font-bold text-forest dark:text-white mb-2">Подтвердите почту</h1>
        <p className="text-sage dark:text-gray-400 mb-6 text-sm">
          Мы отправили письмо со ссылкой для подтверждения на адрес <br/>
          <span className="font-medium text-forest dark:text-white">{user?.email}</span>
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl w-full mb-4 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl w-full mb-4 text-sm">
            {message}
          </div>
        )}

        <button 
          onClick={handleCheckVerification}
          disabled={loading}
          className="w-full bg-primary text-forest font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform mb-4 disabled:opacity-70"
        >
          {loading ? 'Проверка...' : 'Я подтвердил(а) почту'}
        </button>

        <button 
          onClick={handleResendEmail}
          disabled={loading}
          className="w-full bg-transparent border border-sage/30 text-forest dark:text-white font-semibold py-4 rounded-xl active:scale-[0.98] transition-transform mb-6 disabled:opacity-70"
        >
          Отправить письмо еще раз
        </button>

        <button 
          onClick={signOut}
          className="text-sage text-sm font-medium hover:text-primary transition-colors"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
};

export default VerifyEmailScreen;
