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

export type Investment = {
  id: string;
  plan_type: 'starter' | 'professional' | 'enterprise';
  amount: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  annual_return_percentage: number;
  expected_annual_return: number;
  expected_monthly_return: number;
  total_received_returns: number;
  lockup_period_months: number;
  investment_date: string;
  maturity_date: string;
  payout_frequency: string;
  created_at: string;
  updated_at: string;
  // Calculated fields
  progress_percentage?: number;
  days_until_maturity?: number;
  next_payout_date?: string | null;
  last_payout_date?: string | null;
};

export type InvestmentSummary = {
  total_invested: number;
  active_investments: number;
  total_investments: number;
  total_expected_returns: number;
  total_received_returns: number;
  pending_investments: number;
  completed_investments: number;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE || '',
    prepareHeaders: (headers) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('wildwash_auth_state') : null;
      if (token) {
        try {
          const authState = JSON.parse(token);
          if (authState.token) {
            headers.set('authorization', `Token ${authState.token}`);
          }
        } catch (e) {
          console.error('Failed to parse auth token', e);
        }
      }
      return headers;
    },
  }),
  tagTypes: ['Investments', 'InvestmentSummary'],
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], void>({
      query: () => '/orders',
    }),
    getOrderByCode: builder.query<Order, string>({
      query: (code) => `/orders/${encodeURIComponent(code)}`,
    }),
    // Investment endpoints
    getMyInvestments: builder.query<Investment[], void>({
      query: () => '/loans/investments/my_investments/',
      providesTags: ['Investments'],
    }),
    getInvestmentSummary: builder.query<InvestmentSummary, void>({
      query: () => '/loans/investments/summary/',
      providesTags: ['InvestmentSummary'],
    }),
    createInvestment: builder.mutation<Investment, { plan_type: string; amount: number }>({
      query: (data) => ({
        url: '/loans/investments/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Investments', 'InvestmentSummary'],
    }),
    getInvestmentDetail: builder.query<Investment, string>({
      query: (id) => `/loans/investments/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Investments', id }],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByCodeQuery,
  useGetMyInvestmentsQuery,
  useGetInvestmentSummaryQuery,
  useCreateInvestmentMutation,
  useGetInvestmentDetailQuery,
} = apiSlice;
