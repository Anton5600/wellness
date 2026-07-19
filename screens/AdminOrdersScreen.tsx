import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus, OilCatalogItem } from '../types';
import { getOilsCatalog } from '../services/firestoreService';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Ожидает',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменен'
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-orange-100 text-orange-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

const AdminOrdersScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<Record<string, OilCatalogItem>>({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Load catalog map for item names
        const oils = await getOilsCatalog();
        const map: Record<string, OilCatalogItem> = {};
        oils.forEach(o => { map[o.id] = o; });
        setCatalog(map);

        // Load orders
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const loadedOrders = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setOrders(loadedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Ошибка при обновлении статуса");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background-light dark:bg-background-dark font-display pb-10">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-[#1a2d18] shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-forest dark:text-white flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-black/20">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-forest dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">local_shipping</span>
            Управление заказами
          </h1>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        {loading ? (
          <div className="text-center p-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span></div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-800">
            <span className="material-symbols-outlined text-6xl text-sage/50 mb-2">inbox</span>
            <p className="text-sage text-lg">Заказов пока нет</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-[#1f1f1f] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-sage font-mono mb-1">Заказ #{order.id?.substring(0, 8).toUpperCase()}</p>
                  <h3 className="font-bold text-forest dark:text-white text-lg">{order.contactName}</h3>
                  <p className="text-sm font-medium text-sage dark:text-gray-400">{order.contactPhone}</p>
                </div>
                <div>
                  <select 
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider outline-none border-none appearance-none cursor-pointer ${STATUS_COLORS[order.status]}`}
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl text-sm border border-gray-100 dark:border-gray-800">
                <p className="font-bold text-forest dark:text-white mb-2">Товары:</p>
                <ul className="space-y-1 mb-4">
                  {order.items.map((item, idx) => {
                    const oil = catalog[item.oilId];
                    return (
                      <li key={idx} className="flex justify-between text-forest dark:text-gray-300">
                        <span>{item.quantity} x {oil ? oil.name : `Unknown (${item.oilId})`}</span>
                        <span className="text-sage">{oil && oil.price ? oil.price * item.quantity : 0} ₽</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-forest dark:text-white">Сумма заказа:</span>
                  <span className="font-bold text-primary text-lg">{order.totalAmount} ₽</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-sage mb-1">Адрес доставки:</p>
                <p className="text-sm text-forest dark:text-gray-300 bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  {order.deliveryAddress || 'Не указан'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-sage">
                  Оформлен: {new Date(order.createdAt).toLocaleString('ru-RU')}
                </span>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default AdminOrdersScreen;
