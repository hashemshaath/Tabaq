import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface CartItem {
  dishId: number;
  nameEn: string;
  nameAr: string;
  price: number;
  currency: string;
  qty: number;
  imageUrl?: string;
  restaurantId: number;
  restaurantNameEn: string;
  restaurantNameAr: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (dishId: number) => void;
  updateQty: (dishId: number, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  currency: string;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((incoming: Omit<CartItem, 'qty'>) => {
    setItems(prev => {
      // If the cart already has items from a different restaurant, clear it first
      const existingRestaurantId = prev[0]?.restaurantId;
      if (existingRestaurantId && existingRestaurantId !== incoming.restaurantId) {
        // Clear the cart and start fresh with the new restaurant's item
        return [{ ...incoming, qty: 1 }];
      }
      const idx = prev.findIndex(i => i.dishId === incoming.dishId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        return updated;
      }
      return [...prev, { ...incoming, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((dishId: number) => {
    setItems(prev => prev.filter(i => i.dishId !== dishId));
  }, []);

  const updateQty = useCallback((dishId: number, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.dishId !== dishId));
    } else {
      setItems(prev => prev.map(i => i.dishId === dishId ? { ...i, qty } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const currency = items[0]?.currency ?? 'SAR';

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice, currency }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
