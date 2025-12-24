'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { removeFromCart, clearCart, selectCartItems, updateQuantity } from '@/redux/features/cartSlice';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);

  const handleRemoveFromCart = (id: number) => {
    dispatch(removeFromCart(id));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const handleQuantityChange = (id: number, quantity: number) => {
    if (quantity > 0) {
      dispatch(updateQuantity({ id, quantity }));
    }
  };

  const totalPrice = cartItems.reduce((acc, item) => {
    const qty = item.quantity || 1;
    return acc + Number(item.price) * qty;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold">Your Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="mt-8 text-center">
            <p className="text-lg text-slate-500">Your cart is empty.</p>
            <Link href="/" className="mt-4 inline-block bg-red-600 text-white px-6 py-3 rounded-md font-medium">
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="mt-8">
            <ul className="space-y-4">
              {cartItems.map((item) => (
                <li key={item.id} className="bg-white/80 dark:bg-white/5 p-4 rounded-lg shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-base sm:text-lg truncate">{item.name}</h2>
                      <p className="text-sm text-slate-500">KSh {Number(item.price).toFixed(2)} each</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveFromCart(item.id)}
                      title="Remove item from cart"
                      className="inline-flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md p-2 transition shrink-0"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-1">
                      <button
                        onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                        className="text-lg font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 w-6 h-6 flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">{item.quantity || 1}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                        className="text-lg font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 w-6 h-6 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Subtotal</p>
                      <p className="font-semibold text-sm">KSh {(Number(item.price) * (item.quantity || 1)).toFixed(2)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold">Total:</h2>
                    <p className="text-2xl font-bold text-red-600">KSh {totalPrice.toFixed(2)}</p>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link href="/book" className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium text-center hover:bg-red-700 transition w-full">
                Book / Schedule Pick Up
              </Link>
              <button onClick={handleClearCart} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-medium py-2 transition">
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
