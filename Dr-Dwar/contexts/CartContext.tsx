import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Medicine } from '../constants/medicineData';

export interface CartItem extends Medicine {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (medicine: Medicine) => void;
  removeFromCart: (medicineId: string) => void;
  updateQuantity: (medicineId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (medicineId: string) => number;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = '@dr_dwar_cart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  // Load cart from AsyncStorage on app start
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };

    if (cartItems.length > 0) {
      saveCart();
    }
  }, [cartItems]);

  const addToCart = (medicine: Medicine) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item['Sr No'] === medicine['Sr No']);

      if (existingItem) {
        return prevItems.map((item) =>
          item['Sr No'] === medicine['Sr No'] ? { ...item, quantity: item.quantity + 1 } : item,
        );
      } else {
        return [...prevItems, { ...medicine, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (medicineId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item['Sr No'] !== medicineId));
  };

  const updateQuantity = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => (item['Sr No'] === medicineId ? { ...item, quantity } : item)),
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getItemQuantity = (medicineId: string): number => {
    const item = cartItems.find((item) => item['Sr No'] === medicineId);
    return item ? item.quantity : 0;
  };

  const getTotalItems = (): number => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = (): number => {
    return cartItems.reduce((total, item) => total + parseFloat(item.MRP) * item.quantity, 0);
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    getTotalItems,
    getTotalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
