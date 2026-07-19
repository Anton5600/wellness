import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getCountFromServer, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { EMOTIONS } from '../constants';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AdminStats {
  totalQuizzes: number;
  emotionsCount: Record<string, number>;
  recentActivity: any[];
}

const AdminScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);

        const historyRef = collection(db, 'emotionHistory');
        
        let totalQuizzes = 0;
        try {
          const totalSnapshot = await getCountFromServer(historyRef);
          totalQuizzes = totalSnapshot.data().count;
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, 'emotionHistory');
        }

        const emotionsCount: Record<string, number> = {};
        const emotionKeys = Object.keys(EMOTIONS);
        
        for (const key of emotionKeys) {
          try {
            const q = query(historyRef, where('emotionKey', '==', key));
            const snap = await getCountFromServer(q);
            emotionsCount[key] = snap.data().count;
          } catch (e) {
            handleFirestoreError(e, OperationType.GET, 'emotionHistory');
          }
        }

        let recentActivity: any[] = [];
        try {
          const recentQ = query(historyRef, orderBy('timestamp', 'desc'), limit(10));
          const recentSnap = await getDocs(recentQ);
          recentActivity = recentSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, 'emotionHistory');
        }

        setStats({
          totalQuizzes,
          emotionsCount,
          recentActivity
        });
      } catch (err: any) {
        console.error("Admin fetch error:", err);
        setError("Нет доступа или ошибка загрузки. Убедитесь, что вы администратор.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAdminData();
    } else {
      setError("Необходима авторизация.");
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-primary animate-spin">
          <span className="material-symbols-outlined text-4xl">refresh</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 text-center">
        <span className="material-symbols-outlined text-red-500 text-6xl mb-4">gpp_bad</span>
        <h2 className="text-xl font-bold text-forest dark:text-white mb-2">Доступ запрещен</h2>
        <p className="text-sage mb-6">{error}</p>
        <button 
          onClick={() => navigate(-1)} 
          className="bg-primary text-forest px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Вернуться
        </button>
      </div>
    );
  }

  // Find most popular emotion
  let popularEmotion = '';
  let maxCount = 0;
  Object.entries(stats.emotionsCount).forEach(([key, count]) => {
    if (count > maxCount) {
      maxCount = count;
      popularEmotion = key;
    }
  });

  return (
    <div className="min-h-[100dvh] bg-background-light dark:bg-background-dark font-display pb-10">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-[#1a2d18] shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-forest dark:text-white flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-black/20">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-forest dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
            Панель управления
          </h1>
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-2">
              <div className="size-14 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-3xl">analytics</span>
              </div>
              <div>
                <p className="text-sage dark:text-gray-400 text-sm font-medium">Опросов</p>
                <p className="text-3xl font-extrabold text-forest dark:text-white">{stats.totalQuizzes}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-2">
              <div className="size-14 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-3xl">favorite</span>
              </div>
              <div>
                <p className="text-sage dark:text-gray-400 text-sm font-medium">Частая</p>
                <p className="text-xl font-extrabold text-forest dark:text-white">
                  {popularEmotion ? EMOTIONS[popularEmotion as keyof typeof EMOTIONS]?.title : 'Нет данных'} 
                </p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin-oils')}
            className="bg-white dark:bg-[#1f1f1f] cursor-pointer rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center items-center hover:bg-gray-50 dark:hover:bg-black/20 transition-colors group">
            <div className="size-14 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">inventory_2</span>
            </div>
            <p className="text-lg font-bold text-forest dark:text-white">Каталог масел</p>
            <p className="text-sm text-sage">Список и цены</p>
          </div>

          <div 
            onClick={() => navigate('/admin-cards')}
            className="bg-white dark:bg-[#1f1f1f] cursor-pointer rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center items-center hover:bg-gray-50 dark:hover:bg-black/20 transition-colors group">
            <div className="size-14 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">view_carousel</span>
            </div>
            <p className="text-lg font-bold text-forest dark:text-white">Все карты</p>
            <p className="text-sm text-sage">Обзор колоды</p>
          </div>

          <div 
            onClick={() => navigate('/admin-orders')}
            className="col-span-1 md:col-span-2 lg:col-span-1 bg-white dark:bg-[#1f1f1f] cursor-pointer rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center items-center hover:bg-gray-50 dark:hover:bg-black/20 transition-colors group">
            <div className="size-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">local_shipping</span>
            </div>
            <p className="text-lg font-bold text-forest dark:text-white">Все заказы</p>
            <p className="text-sm text-sage">Обработка и статус</p>
          </div>
        </div>

        {/* Emotions Breakdown */}
        <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-forest dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">pie_chart</span>
            Статистика эмоций
          </h2>
          
          <div className="space-y-3">
            {Object.entries(stats.emotionsCount)
              .sort((a, b) => b[1] - a[1]) // Sort desc
              .map(([key, count]) => {
              const obj = EMOTIONS[key as keyof typeof EMOTIONS];
              const percentage = stats.totalQuizzes > 0 ? Math.round((count / stats.totalQuizzes) * 100) : 0;
              
              if (count === 0) return null;
              
              return (
                <div key={key} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium text-forest dark:text-white">{obj.title}</div>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-4 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${obj.color} opacity-80`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm text-sage">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-forest dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Последние 10 опросов
          </h2>
          
          {stats.recentActivity.length === 0 ? (
            <p className="text-sage text-center py-4">Нет данных</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="py-3 px-2 text-sm font-medium text-sage">Дата и время</th>
                    <th className="py-3 px-2 text-sm font-medium text-sage">Эмоция</th>
                    <th className="py-3 px-2 text-sm font-medium text-sage">UID пользователя</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActivity.map(activity => {
                    const date = new Date(activity.timestamp);
                    const emotion = EMOTIONS[activity.emotionKey as keyof typeof EMOTIONS];
                    return (
                      <tr key={activity.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="py-3 px-2 text-sm text-forest dark:text-gray-300">
                          {date.toLocaleString('ru-RU')}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`${emotion?.color} text-white px-2 py-1 rounded text-xs font-medium`}>
                            {emotion?.title || activity.emotionKey}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs text-sage font-mono">
                          {activity.userId.substring(0, 8)}...
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default AdminScreen;
