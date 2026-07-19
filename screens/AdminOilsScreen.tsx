import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { OilCatalogItem } from '../types';
import { getOilsCatalog, seedOilsCatalog } from '../services/firestoreService';

const AdminOilsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [oils, setOils] = useState<OilCatalogItem[]>([]);
  const [editingOil, setEditingOil] = useState<OilCatalogItem | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');

  useEffect(() => {
    fetchOils();
  }, [user]);

  const fetchOils = async () => {
    try {
      setLoading(true);
      const catalog = await getOilsCatalog();
      setOils(catalog);
    } catch (error) {
      console.error("Failed to fetch oils: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      setSeedLoading(true);
      await seedOilsCatalog();
      await fetchOils();
      alert("Каталог успешно инициализирован базовыми данными!");
    } catch (error) {
      alert("Ошибка при инициализации каталога.");
    } finally {
      setSeedLoading(false);
    }
  };

  const handleEditClick = (oil: OilCatalogItem) => {
    setEditingOil(oil);
    setNewPrice(oil.price?.toString() || '0');
  };

  const handleSavePrice = async () => {
    if (!editingOil || !user) return;
    
    const priceNum = parseInt(newPrice, 10);
    if (isNaN(priceNum) || priceNum < 0) {
      alert("Введите корректную цену.");
      return;
    }

    try {
      const oilRef = doc(db, 'oils', editingOil.id);
      await setDoc(oilRef, {
        name: editingOil.name,
        description: editingOil.description,
        icon: editingOil.icon,
        price: priceNum
      });
      alert("Цена обновлена!");
      setEditingOil(null);
      fetchOils();
    } catch (error) {
      console.error("Failed to update price: ", error);
      alert("Ошибка при сохранении цены.");
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
            <span className="material-symbols-outlined text-primary">inventory_2</span>
            Управление каталогом масел
          </h1>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-forest dark:text-white mb-1">База данных масел</h2>
            <p className="text-sm text-sage">Всего масел в базе: {oils.length}</p>
          </div>
          <button 
            onClick={handleSeed}
            disabled={seedLoading}
            className="bg-primary/20 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm flex items-center gap-2"
          >
            {seedLoading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">database</span>}
            Заполнить / Сбросить базу
          </button>
        </div>

        {loading ? (
          <div className="text-center p-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {oils.map((oil) => (
              <div key={oil.id} className="bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col items-center text-center">
                <div className="size-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-3xl">{oil.icon}</span>
                </div>
                <h3 className="font-bold text-forest dark:text-white mb-1">{oil.name}</h3>
                <p className="text-xs text-sage line-clamp-2 mb-3 h-8">{oil.description}</p>
                <div className="mt-auto w-full flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-forest dark:text-white text-lg">
                    {oil.price ? `${oil.price} ₽` : 'Не указана'}
                  </span>
                  <button 
                    onClick={() => handleEditClick(oil)}
                    className="text-primary bg-primary/10 hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Изменить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Price Modal */}
      {editingOil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingOil(null)}>
          <div className="bg-white dark:bg-[#1f1f1f] p-6 rounded-2xl w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-forest dark:text-white mb-4">Цена: {editingOil.name}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-sage mb-1">Новая цена (₽)</label>
              <input 
                type="number" 
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-forest dark:text-white focus:outline-none focus:border-primary"
                placeholder="Например, 1500"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setEditingOil(null)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-forest dark:text-white py-3 rounded-xl font-bold"
              >
                Отмена
              </button>
              <button 
                onClick={handleSavePrice}
                className="flex-1 bg-primary text-forest py-3 rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOilsScreen;
