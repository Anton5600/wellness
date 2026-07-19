import React, { createContext, useState, useEffect, useContext } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (oilId: string) => void;
  removeFromCart: (oilId: string) => void;
  updateQuantity: (oilId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('app_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (oilId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.oilId === oilId);
      if (existing) {
        return prev.map(item => item.oilId === oilId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { oilId, quantity: 1 }];
    });
  };

  const removeFromCart = (oilId: string) => {
    setCart(prev => prev.filter(item => item.oilId !== oilId));
  };

  const updateQuantity = (oilId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(oilId);
      return;
    }
    setCart(prev => prev.map(item => item.oilId === oilId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
