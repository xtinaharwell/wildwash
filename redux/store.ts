// store.ts
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './services/apiSlice';
import ordersReducer from './features/orderSlice';
import authReducer from './features/authSlice';
import cartReducer from './features/cartSlice';
import riderOrderNotificationReducer from './features/riderOrderNotificationSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    orders: ordersReducer,
    cart: cartReducer,
    riderOrderNotification: riderOrderNotificationReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
