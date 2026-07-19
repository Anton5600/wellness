import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getOilsCatalog } from '../services/firestoreService';
import { OilCatalogItem, Order } from '../types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TELEGRAM_USERNAME } from '../constants';

const CartScreen: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, cartCount } = useCart();
  const { user } = useAuth();
  
  const [catalog, setCatalog] = useState<OilCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const fetchCatalog = async () => {
      const oils = await getOilsCatalog();
      setCatalog(oils);
      setLoading(false);
    };
    fetchCatalog();
  }, []);

  const getOilStatus = (oilId: string) => catalog.find(o => o.id === oilId);

  const totalAmount = cart.reduce((sum, item) => {
    const oil = getOilStatus(item.oilId);
    if (!oil || !oil.price) return sum;
    return sum + (oil.price * item.quantity);
  }, 0);

  const handleCreateOrder = async () => {
    if (!user) return;
    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert("Пожалуйста, заполните все поля.");
      return;
    }

    setSubmitting(true);
    try {
      const newOrder = {
        userId: user.uid,
        items: cart,
        totalAmount,
        status: 'pending',
        createdAt: Date.now(),
        contactName: name,
        contactPhone: phone,
        deliveryAddress: address,
      };

      await addDoc(collection(db, 'orders'), newOrder);
      
      clearCart();
      alert("Ваш заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.");
      navigate('/');
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("Ошибка при оформлении заказа. Попробуйте снова.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">autorenew</span>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background-light dark:bg-background-dark font-display pb-32">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-[#1a2d18] shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-forest dark:text-white flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-black/20">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-forest dark:text-white">Корзина ({cartCount})</h1>
        <div className="w-10"></div>
      </header>

      <main className="p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="text-center py-20 bg-white/50 dark:bg-black/20 rounded-3xl border border-dashed border-sage/30">
            <span className="material-symbols-outlined text-6xl text-sage mb-4 opacity-50">shopping_bag</span>
            <p className="font-bold text-forest dark:text-white text-lg">Корзина пуста</p>
            <p className="text-sage text-sm mt-2 px-6">Перейдите в каталог или после прохождения теста, чтобы добавить масла.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {cart.map((item) => {
                const oil = getOilStatus(item.oilId);
                if (!oil) return null;

                return (
                  <div key={item.oilId} className="flex gap-4 p-4 bg-white dark:bg-[#1f1f1f] rounded-2xl shadow-sm border border-sage/10 dark:border-sage/30">
                    <div className="size-16 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-3xl">{oil.icon}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-forest dark:text-white leading-tight pr-4">{oil.name}</h3>
                          <button onClick={() => removeFromCart(item.oilId)} className="text-sage hover:text-red-500">
                            <span className="material-symbols-outlined text-xl">close</span>
                          </button>
                        </div>
                        <p className="font-bold text-primary text-sm mt-1">{oil.price ? `${oil.price} ₽` : 'Уточняется'}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-4 bg-gray-100 dark:bg-black/20 rounded-lg px-2 py-1">
                          <button onClick={() => updateQuantity(item.oilId, item.quantity - 1)} className="text-forest dark:text-white">
                            <span className="material-symbols-outlined text-sm block">remove</span>
                          </button>
                          <span className="font-medium text-forest dark:text-white text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.oilId, item.quantity + 1)} className="text-forest dark:text-white">
                            <span className="material-symbols-outlined text-sm block">add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Block */}
            <div className="bg-white dark:bg-[#1f1f1f] p-5 rounded-2xl shadow-sm border border-sage/10 dark:border-sage/30 mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sage">Товары ({cartCount})</span>
                <span className="font-medium text-forest dark:text-white">{totalAmount} ₽</span>
              </div>
              <div className="flex justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-4 text-sm">
                <span className="text-sage">Доставка</span>
                <span className="font-medium text-forest dark:text-white">Рассчитывается отдельно</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="font-bold text-forest dark:text-white text-lg">Итого (розница)</span>
                <span className="font-extrabold text-primary text-2xl">{totalAmount} ₽</span>
              </div>

              {!showCheckout ? (
                <div className="mt-6 flex flex-col gap-3">
                  <button 
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl text-md shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">local_shipping</span>
                    Быстрый заказ (розница)
                  </button>
                  <button 
                    onClick={() => {
                        const itemsText = cart.map(item => {
                            const oil = getOilStatus(item.oilId);
                            return oil ? `- ${oil.name} (${item.quantity} шт.)` : '';
                        }).join('%0A');
                        window.open(`https://t.me/${TELEGRAM_USERNAME}?text=Здравствуйте! Хочу оформить заказ со скидкой 25%:%0A${itemsText}`, '_blank');
                    }}
                    className="w-full bg-indigo-500 text-white font-bold py-4 rounded-xl text-md shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">discount</span>
                    Заказ со скидкой 25% • {Math.round(totalAmount * 0.75)} ₽
                  </button>
                </div>
              ) : (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="font-bold text-forest dark:text-white mb-4">Данные для доставки</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-sage mb-1">Имя получателя</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-forest dark:text-white focus:outline-none focus:border-primary"
                        placeholder="Иван Иванов"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-sage mb-1">Телефон</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-forest dark:text-white focus:outline-none focus:border-primary"
                        placeholder="+7 (999) 000-00-00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-sage mb-1">Полный адрес доставки</label>
                      <textarea 
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-forest dark:text-white focus:outline-none focus:border-primary min-h-[80px]"
                        placeholder="г. Москва, ул. Ленина, д. 1, кв. 1"
                      />
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleCreateOrder}
                    disabled={submitting}
                    className="w-full mt-6 bg-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {submitting ? (
                      <><span className="material-symbols-outlined animate-spin">refresh</span> Оформление...</>
                    ) : (
                      'Оформить заказ'
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default CartScreen;
