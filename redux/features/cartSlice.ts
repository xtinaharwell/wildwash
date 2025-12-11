
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/redux/store';

// Define a type for the service item
export interface Service {
  id: number;
  name: string;
  price: string;
  description: string;
  quantity?: number; // Add quantity field
}

// Define the state shape
interface CartState {
  items: Service[];
}

const initialState: CartState = {
  items: [],
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Service>) => {
      // Avoid adding duplicates, or increment quantity if already exists
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (!existingItem) {
        const newItem = { ...action.payload, quantity: action.payload.quantity || 1 };
        state.items.push(newItem);
      } else {
        // If item already exists, increment its quantity
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      }
    },
    removeFromCart: (state, action: PayloadAction<number>) => { // action.payload is the service id
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
    },
    updateQuantity: (state, action: PayloadAction<{ id: number; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item && action.payload.quantity > 0) {
        item.quantity = action.payload.quantity;
      }
    },
  },
});

// Export actions
export const { addToCart, removeFromCart, clearCart, updateQuantity } = cartSlice.actions;

// Export selectors
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartTotalItems = (state: RootState) => state.cart.items.length;

export default cartSlice.reducer;
