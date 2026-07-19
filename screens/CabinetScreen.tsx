import React, { useState, useEffect } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import { useAuth } from '../context/AuthContext';
import { UserOil, OilCatalogItem } from '../types';
import { getUserOils, addUserOil, removeUserOil, getOilsCatalog } from '../services/firestoreService';

import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const CabinetScreen: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [userOils, setUserOils] = useState<UserOil[]>([]);
    const [oilCatalog, setOilCatalog] = useState<OilCatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState<string | null>(null);
    const [selectedOil, setSelectedOil] = useState<OilCatalogItem | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                setLoading(true);
                const [oils, catalog] = await Promise.all([
                    getUserOils(user.uid),
                    getOilsCatalog()
                ]);
                setUserOils(oils);
                setOilCatalog(catalog);
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handleAddOil = async (oilId: string) => {
        if (!user) return;
        try {
            setIsAdding(oilId);
            const newOil = await addUserOil(user.uid, oilId);
            setUserOils(prev => [newOil, ...prev]);
        } catch (error) {
            console.error("Failed to add oil", error);
        } finally {
            setIsAdding(null);
        }
    };

    const handleRemoveOil = async (docId: string) => {
        try {
            setIsRemoving(docId);
            await removeUserOil(docId);
            setUserOils(prev => prev.filter(oil => oil.id !== docId));
        } catch (error) {
            console.error("Failed to remove oil", error);
        } finally {
            setIsRemoving(null);
        }
    };

    // Filter catalog for search results (excluding already owned oils)
    const ownedOilIds = new Set(userOils.map(uo => uo.oilId));
    const searchResults = searchQuery.trim() === '' 
        ? [] 
        : oilCatalog.filter(oil => 
            oil.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !ownedOilIds.has(oil.id)
          );

    return (
        <div className="pb-28 bg-background-light dark:bg-background-dark min-h-[100dvh]">
            <header className="p-6 pt-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-extrabold text-forest dark:text-white">Моя аптечка</h1>
                    <p className="text-sage dark:text-gray-400 mt-1">Управляйте своей коллекцией эфирных масел.</p>
                </div>
                <button 
                    onClick={() => navigate('/cart')}
                    className="relative flex items-center justify-center rounded-full size-12 bg-white dark:bg-[#1f1f1f] border border-sage/20 text-forest dark:text-primary active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
                </button>
            </header>

            <main className="px-6 space-y-8">
                {/* Search Section */}
                <section>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-sage">search</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Поиск масел для добавления..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-10 py-4 rounded-xl bg-white dark:bg-[#1f1f1f] border border-sage/20 dark:border-sage/40 text-forest dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-sage/50"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-sage hover:text-forest dark:hover:text-white"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        )}
                    </div>

                    {/* Search Results */}
                    {searchQuery.trim() !== '' && (
                        <div className="mt-4 space-y-3">
                            <h3 className="text-sm font-bold text-forest dark:text-white uppercase tracking-wider">Результаты поиска</h3>
                            {searchResults.length > 0 ? (
                                searchResults.map(oil => (
                                    <div key={oil.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#1f1f1f] shadow-sm border border-sage/10 dark:border-sage/30">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined">{oil.icon}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-forest dark:text-white">{oil.name}</p>
                                                <p className="text-xs text-sage dark:text-gray-400 line-clamp-1">{oil.description}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleAddOil(oil.id)}
                                            disabled={isAdding === oil.id}
                                            className="flex items-center justify-center size-8 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                                        >
                                            {isAdding === oil.id ? (
                                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-sm">add</span>
                                            )}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sage text-sm text-center py-4">Масла не найдены или уже добавлены в аптечку.</p>
                            )}
                        </div>
                    )}
                </section>

                {/* Inventory Section */}
                <section>
                    <h3 className="text-lg font-bold text-forest dark:text-white mb-4">В наличии ({userOils.length})</h3>
                    
                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#1f1f1f] shadow-sm border border-transparent">
                                    <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : userOils.length === 0 ? (
                        <div className="text-center py-10 bg-white/50 dark:bg-[#1f1f1f]/50 rounded-2xl border border-dashed border-sage/30">
                            <span className="material-symbols-outlined text-5xl text-sage/50 mb-4">medication</span>
                            <p className="font-semibold text-forest dark:text-white">Ваша аптечка пуста</p>
                            <p className="text-sm text-sage mt-1 px-4">Воспользуйтесь поиском выше, чтобы добавить масла, которые у вас уже есть.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {userOils.map(userOil => {
                                const oilDetails = oilCatalog.find(o => o.id === userOil.oilId);
                                if (!oilDetails) return null;

                                return (
                                    <div 
                                        key={userOil.id} 
                                        onClick={() => setSelectedOil(oilDetails)}
                                        className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#1f1f1f] shadow-sm border border-sage/10 dark:border-sage/30 group cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-full bg-sage/20 dark:bg-sage/10 flex items-center justify-center text-forest dark:text-sage">
                                                <span className="material-symbols-outlined">{oilDetails.icon}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-forest dark:text-white">{oilDetails.name}</p>
                                                <p className="text-xs text-sage dark:text-gray-400 line-clamp-1">{oilDetails.description}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveOil(userOil.id);
                                            }}
                                            disabled={isRemoving === userOil.id}
                                            className="flex items-center justify-center size-8 rounded-full text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Удалить из аптечки"
                                        >
                                            {isRemoving === userOil.id ? (
                                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
            
            <BottomNavBar />

            {/* Modal for Oil Details */}
            {selectedOil && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedOil(null)}
                >
                    <div 
                        className="bg-white dark:bg-[#1f1f1f] rounded-3xl p-8 w-full max-w-sm shadow-2xl relative transform transition-all"
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setSelectedOil(null)}
                            className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-forest dark:hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                        
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                                <span className="material-symbols-outlined text-4xl">{selectedOil.icon}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-forest dark:text-white">{selectedOil.name}</h2>
                            <p className="text-sage dark:text-gray-300 text-base leading-relaxed">
                                {selectedOil.description}
                            </p>
                        </div>
                        
                        <div className="flex gap-3 mt-8">
                            <button 
                                onClick={() => setSelectedOil(null)}
                                className="flex-1 bg-gray-100 dark:bg-gray-800 text-forest dark:text-white font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Закрыть
                            </button>
                            <button 
                                onClick={() => {
                                    addToCart(selectedOil.id);
                                    setSelectedOil(null);
                                    navigate('/cart');
                                }}
                                className="flex-[2] bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">shopping_cart_checkout</span>
                                Купить • {selectedOil.price ? `${selectedOil.price} ₽` : 'Цена по запросу'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CabinetScreen;