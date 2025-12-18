// services/apiSlice.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

// Keep the Order type here or import from types/order.ts
export type OrderStatus = "Received" | "Washing" | "Drying" | "Ready" | "Delivered" | "Cancelled";

export type Order = {
  code: string;
  date: string; // ISO
  items: number;
  weightKg?: number;
  package: string;
  price: string;
  status: OrderStatus;
  eta?: string;
  deliveredAt?: string;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE || '',
    prepareHeaders: (headers) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
    // credentials: 'include' // enable if you need cookies
  }),
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], void>({
      query: () => '/orders', // GET http://127.0.0.1:8000/orders
      // optional: transformResponse, providesTags etc.
    }),
    getOrderByCode: builder.query<Order, string>({
      query: (code) => `/orders/${encodeURIComponent(code)}`,
    }),
  }),
});

export const { useGetOrdersQuery, useGetOrderByCodeQuery } = apiSlice;
