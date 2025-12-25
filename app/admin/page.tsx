"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import RouteGuard from "@/components/RouteGuard";
import { client } from "@/lib/api/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Users,
  Truck,
  CheckCircle,
  DollarSign,
  Loader2,
  AlertCircle,
  RefreshCw,
  MapPin,
} from "lucide-react";

/* --- Types --- */
type RawOrder = Record<string, any>;
type RawLocation = Record<string, any>;
type RawUser = Record<string, any>;
type RawLoan = Record<string, any>;

type Order = {
  id?: number;
  code?: string;
  created_at?: string;
  price?: string | number;
  status?: string;
  rider?: string | null;
  raw?: RawOrder;
};

type RiderLocation = {
  id?: number;
  rider?: string | number | null;
  rider_display?: string | null;
  latitude?: number | string;
  longitude?: number | string;
  accuracy?: number | null;
  speed?: number | null;
  recorded_at?: string | null;
  raw?: RawLocation;
};

type User = {
  id?: number;
  username?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  location?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  date_joined?: string;
  created_at?: string;
  raw?: RawUser;
};

type LoanApplication = {
  id?: string;
  loan_type?: string;
  loan_amount?: string | number;
  duration_days?: number;
  purpose?: string;
  status?: string;
  total_repayment?: string | number;
  created_at?: string;
  approved_at?: string;
  order_code?: string;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  guarantors?: Array<{
    id?: string;
    name?: string;
    phone_number?: string;
    email?: string;
  }>;
  raw?: RawLoan;
};

type TradeIn = {
  id?: number;
  user_id?: number;
  user_name?: string;
  user_phone?: string;
  description?: string;
  estimated_price?: string | number;
  contact_phone?: string;
  status?: string;
  created_at?: string;
  raw?: Record<string, any>;
};

type BNPLUser = {
  id?: number;
  user_id?: number;
  user_name?: string;
  user_phone?: string;
  is_enrolled?: boolean;
  is_active?: boolean;
  credit_limit?: string | number;
  current_balance?: string | number;
  created_at?: string;
  updated_at?: string;
  raw?: Record<string, any>;
};

/* --- Component --- */
export default function AdminPage(): React.ReactElement {
  const [orders, setOrders] = useState<Order[]>([]);
  const [locations, setLocations] = useState<RiderLocation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [bnplUsers, setBnplUsers] = useState<BNPLUser[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'riders' | 'users' | 'loans' | 'tradeins' | 'bnpl' | 'analytics'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [riderFilter, setRiderFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [userJoinDateFilter, setUserJoinDateFilter] = useState<string>('');
  const [loanStatusFilter, setLoanStatusFilter] = useState<string>('');
  const [tradeInStatusFilter, setTradeInStatusFilter] = useState<string>('');
  const [bnplSearchQuery, setBnplSearchQuery] = useState<string>('');

  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [loadingLocations, setLoadingLocations] = useState<boolean>(true);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [loadingLoans, setLoadingLoans] = useState<boolean>(true);
  const [loadingTradeIns, setLoadingTradeIns] = useState<boolean>(true);
  const [loadingBNPL, setLoadingBNPL] = useState<boolean>(true);

  const [errorOrders, setErrorOrders] = useState<string | null>(null);
  const [errorLocations, setErrorLocations] = useState<string | null>(null);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);
  const [errorLoans, setErrorLoans] = useState<string | null>(null);
  const [errorTradeIns, setErrorTradeIns] = useState<string | null>(null);
  const [errorBNPL, setErrorBNPL] = useState<string | null>(null);

  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);

  // Helper function to calculate price from order_items with quantities
  const calculateOrderPrice = (order: any): number => {
    if (order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
      return order.order_items.reduce((total: number, item: any) => {
        const itemPrice = Number(item.service_price ?? 0);
        const quantity = Number(item.quantity ?? 1);
        return total + (itemPrice * quantity);
      }, 0);
    }
    return Number(order.total_price ?? order.price ?? order.price_display ?? 0);
  };

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setErrorOrders(null);
    try {
      const data = await client.get("/orders/?page_size=100");
      const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      setOrders(
        list.map((o: any) => ({
          id: o.id,
          code: o.code,
          created_at: o.created_at,
          price: calculateOrderPrice(o),
          status: o.status ?? o.status_code ?? o.state ?? "unknown",
          rider: typeof o.rider === 'object' 
            ? (o.rider?.username || o.rider?.first_name || o.rider?.name || null)
            : o.rider ?? o.user ?? null,
          raw: o,
        }))
      );
    } catch (err: any) {
      console.error("fetchOrders error:", err);
      setErrorOrders(err?.message ?? "Failed to load orders");
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    setLoadingLocations(true);
    setErrorLocations(null);
    try {
      // Use authenticated client for rider locations
      const data = await client.get("/riders/");
      const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

      setLocations(
        list.map((l: any) => ({
          id: l.id,
          rider: l.rider ?? null,
          rider_display: l.rider_display ?? (l.rider && l.rider.username) ?? null,
          latitude: l.latitude ?? l.lat ?? null,
          longitude: l.longitude ?? l.lon ?? l.lng ?? null,
          accuracy: l.accuracy ?? null,
          speed: l.speed ?? null,
          recorded_at: l.recorded_at ?? l.created_at ?? null,
          raw: l,
        }))
      );
    } catch (err: any) {
      console.error("fetchLocations error:", err);
      setErrorLocations(err?.message ?? "Failed to load rider locations");
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      // Use authenticated client to fetch users from the correct endpoint
      const data = await client.get("/users/users/?page_size=100");
      const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

      setUsers(
        list.map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone ?? u.phone_number ?? null,
          first_name: u.first_name,
          last_name: u.last_name,
          role: u.role ?? null,
          location: u.location ?? null,
          is_staff: u.is_staff ?? false,
          is_superuser: u.is_superuser ?? false,
          date_joined: u.date_joined,
          created_at: u.created_at,
          raw: u,
        }))
      );
    } catch (err: any) {
      console.error("fetchUsers error:", err);
      setErrorUsers(err?.message ?? "Failed to load users");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchLoans = useCallback(async () => {
    setLoadingLoans(true);
    setErrorLoans(null);
    try {
      const data = await client.get("/loans/loans/?page_size=100");
      const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

      setLoans(
        list.map((l: any) => {
          // Extract user information from the loan object
          const userData = l.user || {};
          const userName = userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}` 
            : userData.username || "Unknown User";
          
          return {
            id: l.id,
            loan_type: l.loan_type ?? "unknown",
            loan_amount: l.loan_amount ?? 0,
            duration_days: l.duration_days ?? 0,
            purpose: l.purpose ?? "",
            status: l.status ?? "pending",
            total_repayment: l.total_repayment ?? 0,
            created_at: l.created_at,
            approved_at: l.approved_at,
            order_code: l.order_code,
            user_id: userData.id ?? l.user_id,
            user_name: userName,
            user_email: userData.email ?? l.user_email,
            user_phone: userData.phone ?? userData.phone_number ?? l.user_phone,
            guarantors: l.guarantors ?? [],
            raw: l,
          };
        })
      );
    } catch (err: any) {
      console.error("fetchLoans error:", err);
      setErrorLoans(err?.message ?? "Failed to load loan applications");
      setLoans([]);
    } finally {
      setLoadingLoans(false);
    }
  }, []);

  const fetchTradeIns = useCallback(async () => {
    setLoadingTradeIns(true);
    setErrorTradeIns(null);
    try {
      const data = await client.get("/payments/tradein/?page_size=100");
      const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

      setTradeIns(
        list.map((t: any) => {
          const userData = t.user || {};
          const userName = userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}` 
            : userData.username || "Unknown User";
          
          return {
            id: t.id,
            user_id: userData.id ?? t.user_id,
            user_name: userName,
            user_phone: userData.phone ?? userData.phone_number,
            description: t.description ?? "",
            estimated_price: t.estimated_price ?? 0,
            contact_phone: t.contact_phone ?? "",
            status: t.status ?? "pending",
            created_at: t.created_at,
            raw: t,
          };
        })
      );
    } catch (err: any) {
      console.error("fetchTradeIns error:", err);
      setErrorTradeIns(err?.message ?? "Failed to load trade-ins");
      setTradeIns([]);
    } finally {
      setLoadingTradeIns(false);
    }
  }, []);

  const fetchBNPL = useCallback(async () => {
    setLoadingBNPL(true);
    setErrorBNPL(null);
    try {
      const data = await client.get("/payments/bnpl/users/?page_size=100");
      const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

      setBnplUsers(
        list.map((b: any) => {
          const userData = b.user || {};
          const userName = userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}` 
            : userData.username || "Unknown User";
          
          return {
            id: b.id,
            user_id: userData.id ?? b.user_id,
            user_name: userName,
            user_phone: userData.phone ?? userData.phone_number,
            is_enrolled: b.is_enrolled ?? false,
            is_active: b.is_active ?? false,
            credit_limit: b.credit_limit ?? 0,
            current_balance: b.current_balance ?? 0,
            created_at: b.created_at,
            updated_at: b.updated_at,
            raw: b,
          };
        })
      );
    } catch (err: any) {
      console.error("fetchBNPL error:", err);
      setErrorBNPL(err?.message ?? "Failed to load BNPL users");
      setBnplUsers([]);
    } finally {
      setLoadingBNPL(false);
    }
  }, []);

  useEffect(() => {
    // initial load
    fetchOrders();
    fetchLocations();
    fetchUsers();
    fetchLoans();
    fetchTradeIns();
    fetchBNPL();
  }, [fetchOrders, fetchLocations, fetchUsers, fetchLoans, fetchTradeIns, fetchBNPL]);

  // Derived metrics
  const totalOrders = orders.length;
  const completed = orders.filter((o) => String(o.status ?? "").toLowerCase() === "delivered").length;
  const inProgress = orders.filter((o) => String(o.status ?? "").toLowerCase() !== "delivered").length;
  const totalRevenue = orders.reduce((sum, o) => {
    const price = Number(o.price ?? 0);
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  // Latest location per rider (in case public endpoint returns multiple per rider)
  const latestLocationByRider = (() => {
    const map = new Map<string, RiderLocation>();
    for (const loc of locations) {
      const key = String(loc.rider ?? loc.rider_display ?? loc.id ?? Math.random());
      const existing = map.get(key);
      const tsExisting = existing ? new Date(existing.recorded_at ?? existing.raw?.created_at ?? 0).getTime() : 0;
      const tsNew = new Date(loc.recorded_at ?? loc.raw?.created_at ?? 0).getTime();
      if (!existing || tsNew >= tsExisting) map.set(key, loc);
    }
    return Array.from(map.entries()).map(([riderKey, loc]) => ({ riderKey, ...loc }));
  })();

  const riderCount = latestLocationByRider.length;

  // daily stats for charts
  const dailyStats = Object.values(
    orders.reduce((acc: Record<string, { date: string; orders: number; revenue: number }>, o) => {
      const date = o.created_at?.split?.("T")?.[0] ?? new Date().toISOString().split("T")[0];
      if (!acc[date]) acc[date] = { date, orders: 0, revenue: 0 };
      acc[date].orders += 1;
      const price = Number(o.price ?? 0);
      acc[date].revenue += isNaN(price) ? 0 : price;
      return acc;
    }, {})
  );

  const refreshAll = async () => {
    await Promise.all([fetchOrders(), fetchLocations(), fetchUsers(), fetchLoans(), fetchTradeIns(), fetchBNPL()]);
  };

  // filter helpers
  const availableStatuses = Array.from(new Set(orders.map(o => (o.status ?? '').toString()))).filter(Boolean);
  const availableRiders = Array.from(new Set(orders.map(o => (o.rider ?? '').toString()))).filter(Boolean);
  const availableLocations = Array.from(new Set(orders.map(o => (o.raw?.user?.location || '').toString()))).filter(Boolean);

  const getDateRange = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (dateFilter) {
      case 'today':
        return {
          start: today.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return {
          start: weekStart.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        return {
          start: monthStart.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        };
      case 'custom':
        return {
          start: startDate,
          end: endDate
        };
      default:
        return { start: '', end: '' };
    }
  }, [dateFilter, startDate, endDate]);

  const filteredOrders = orders.filter(o => {
    if (statusFilter && String(o.status ?? '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (riderFilter && String(o.rider ?? '').toLowerCase() !== riderFilter.toLowerCase()) return false;
    if (locationFilter) {
      const customerLocation = (o.raw?.user?.location || '').toLowerCase();
      if (customerLocation !== locationFilter.toLowerCase()) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesCode = String(o.code ?? '').toLowerCase().includes(q);
      const matchesRider = String(o.rider ?? '').toLowerCase().includes(q);
      if (!matchesCode && !matchesRider) return false;
    }

    // Date filtering
    const { start, end } = getDateRange();
    if (start && end) {
      const orderDate = o.created_at?.split('T')[0];
      if (!orderDate || orderDate < start || orderDate > end) return false;
    }

    return true;
  });

  const filteredUsers = users.filter(u => {
    // Search by username, email, or name
    if (userSearchQuery) {
      const q = userSearchQuery.toLowerCase();
      const matchesUsername = String(u.username ?? '').toLowerCase().includes(q);
      const matchesEmail = String(u.email ?? '').toLowerCase().includes(q);
      const matchesName = `${u.first_name ?? ''} ${u.last_name ?? ''}`.toLowerCase().includes(q);
      if (!matchesUsername && !matchesEmail && !matchesName) return false;
    }

    // Filter by role
    if (userRoleFilter) {
      if (userRoleFilter === 'admin' && !u.is_superuser) return false;
      if (userRoleFilter === 'staff' && (!u.is_staff || u.is_superuser)) return false;
      if (userRoleFilter === 'user' && (u.is_staff || u.is_superuser)) return false;
    }

    // Filter by join date
    if (userJoinDateFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const userJoinDate = new Date(u.date_joined ?? '');
      userJoinDate.setHours(0, 0, 0, 0);

      switch (userJoinDateFilter) {
        case 'today':
          if (userJoinDate.getTime() !== today.getTime()) return false;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          if (userJoinDate.getTime() < weekAgo.getTime()) return false;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          if (userJoinDate.getTime() < monthAgo.getTime()) return false;
          break;
      }
    }

    return true;
  });

  // Compute body JSX separately to avoid complex inline nested ternaries in JSX
  const body = (() => {
    if (loadingOrders || loadingLocations) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-red-600 w-6 h-6" />
        </div>
      );
    }
    if (errorOrders || errorLocations) {
      return (
        <div className="py-8">
          {errorOrders && <div className="mb-2 text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Orders error: {errorOrders}</div>}
          {errorLocations && <div className="text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Riders error: {errorLocations}</div>}
        </div>
      );
    }

    return (
      <div>
        {/* Tab Navigation */}
        <div className="mb-8 flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 sm:px-6 md:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'orders'
                ? 'bg-red-600 text-white shadow-lg hover:bg-red-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('riders')}
            className={`px-3 sm:px-6 md:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'riders'
                ? 'bg-red-600 text-white shadow-lg hover:bg-red-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Riders
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 sm:px-6 md:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'users'
                ? 'bg-red-600 text-white shadow-lg hover:bg-red-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-3 sm:px-6 md:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'loans'
                ? 'bg-red-600 text-white shadow-lg hover:bg-red-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Loans
          </button>
          <button
            onClick={() => setActiveTab('tradeins')}
            className={`px-3 sm:px-6 md:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'tradeins'
                ? 'bg-red-600 text-white shadow-lg hover:bg-red-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Trade-Ins
          </button>
          <button
            onClick={() => setActiveTab('bnpl')}
            className={`px-3 sm:px-6 md:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'bnpl'
                ? 'bg-red-600 text-white shadow-lg hover:bg-red-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            BNPL
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 sm:px-6 md:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-red-600 text-white shadow-lg hover:bg-red-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Summary - Only show for Orders tab */}
        {activeTab === 'orders' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard icon={<Users />} label="Total Orders" value={String(totalOrders)} />
          <StatCard icon={<Loader2 />} label="In Progress" value={String(inProgress)} />
          <StatCard icon={<CheckCircle />} label="Completed" value={String(completed)} />
          <StatCard icon={<DollarSign />} label="Revenue" value={`KSh ${totalRevenue.toLocaleString()}`} />
          <StatCard icon={<Truck />} label="Active Riders" value={String(new Set(orders.map(o => o.rider)).size)} />
          <StatCard icon={<Users />} label="Total Users" value={String(users.length)} />
        </div>
        )}

        {/* Recent Orders - Orders Tab */}
        {activeTab === 'orders' && (
        <div className="mb-8">
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-6 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Recent Orders</h2>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)} 
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">All statuses</option>
                  {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <select 
                  value={riderFilter} 
                  onChange={(e) => setRiderFilter(e.target.value)} 
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">All riders</option>
                  {availableRiders.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <select 
                  value={locationFilter} 
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">All locations</option>
                  {availableLocations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <input 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder="Search code or rider" 
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20" 
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value as any)} 
                  className="rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="week">Last 7 days</option>
                  <option value="today">Today</option>
                  <option value="month">Last 30 days</option>
                  <option value="custom">Custom range</option>
                </select>

                {dateFilter === 'custom' && (
                  <>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </>
                )}
              </div>

              <button 
                onClick={() => { 
                  setStatusFilter(''); 
                  setRiderFilter(''); 
                  setLocationFilter('');
                  setSearchQuery(''); 
                  setDateFilter('week');
                  setStartDate('');
                  setEndDate('');
                }} 
                className="text-sm px-3 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors duration-200 flex items-center gap-2 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-once">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                </svg>
                Reset all filters
              </button>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
              <table className="min-w-full text-sm divide-y divide-slate-200/50 dark:divide-slate-800/50">
                <thead className="text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Code</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Location</th>
                    <th className="text-left py-3 px-4 font-medium">Rider</th>
                    <th className="text-right py-3 px-4 font-medium">Price (KSh)</th>
                    <th className="text-right py-3 px-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                  {filteredOrders.slice(0, 50).map((o) => (
                    <tr key={o.id ?? o.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400">
                        <Link href={`/orders/${o.code}`} className="hover:underline">
                          {o.code}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          o.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          o.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{o.raw?.user?.location || "—"}</td>
                      <td className="py-3 px-4">{o.rider ?? "—"}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {isNaN(Number(o.price)) || o.price === null || o.price === undefined 
                          ? '—' 
                          : Number(o.price).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">{o.created_at?.split?.("T")?.[0] ?? "—"}</td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="8" y1="15" x2="16" y2="15"/>
                            <line x1="9" y1="9" x2="9.01" y2="9"/>
                            <line x1="15" y1="9" x2="15.01" y2="9"/>
                          </svg>
                          <span>No orders found</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {/* Charts and Statistics - Analytics Tab */}
        {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Orders per Day Chart */}
          <ChartCard title="Orders per Day">
            <BarChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          {/* Rider Order Statistics */}
          <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Rider Statistics</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="text-left py-3 px-4">Rider</th>
                    <th className="text-left py-3 px-4">Location</th>
                    <th className="text-center py-3 px-4">Total Orders</th>
                    <th className="text-center py-3 px-4">Completed</th>
                    <th className="text-center py-3 px-4">In Progress</th>
                    <th className="text-center py-3 px-4">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {availableRiders.map((rider) => {
                    const riderOrders = orders.filter(o => String(o.rider) === rider);
                    const completed = riderOrders.filter(o => String(o.status).toLowerCase() === 'delivered').length;
                    const inProgress = riderOrders.filter(o => !['delivered', 'cancelled'].includes(String(o.status).toLowerCase())).length;
                    const total = riderOrders.length;
                    const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
                    
                    return (
                      <tr key={rider} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-medium">{rider}</td>
                        <td className="py-3 px-4">{riderOrders[0]?.raw?.rider?.service_location?.name || "—"}</td>
                        <td className="py-3 px-4 text-center">{total}</td>
                        <td className="py-3 px-4 text-center text-green-600">{completed}</td>
                        <td className="py-3 px-4 text-center text-blue-600">{inProgress}</td>
                        <td className="py-3 px-4 text-center font-medium">{successRate}%</td>
                      </tr>
                    );
                  })}
                  {availableRiders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No riders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {/* Loan Applications - Loans Tab */}
        {activeTab === 'loans' && (
        <div className="mb-8">
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-6 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Loan Applications</h2>
            
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <select 
                  value={loanStatusFilter} 
                  onChange={(e) => setLoanStatusFilter(e.target.value)} 
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="repaid">Repaid</option>
                  <option value="rejected">Rejected</option>
                  <option value="defaulted">Defaulted</option>
                </select>
              </div>

              <button 
                onClick={() => { 
                  setLoanStatusFilter('');
                  fetchLoans();
                }} 
                className="px-4 py-2 bg-slate-300 dark:bg-slate-700 rounded-full hover:bg-slate-400 dark:hover:bg-slate-600 transition-all font-medium text-sm"
              >
                Clear Filters
              </button>
            </div>

            {loadingLoans ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin text-red-600 w-6 h-6" />
              </div>
            ) : errorLoans ? (
              <div className="p-4 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorLoans}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-right py-3 px-4">Amount</th>
                      <th className="text-right py-3 px-4">Repayment</th>
                      <th className="text-center py-3 px-4">Duration</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Purpose</th>
                      <th className="text-left py-3 px-4">Guarantors</th>
                      <th className="text-left py-3 px-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.filter(l => !loanStatusFilter || String(l.status).toLowerCase() === loanStatusFilter.toLowerCase()).map((loan) => (
                      <tr key={loan.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedLoan(loan)}
                            className="font-mono text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline cursor-pointer transition-all"
                          >
                            {String(loan.id).substring(0, 12)}...
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <p className="font-medium text-slate-900 dark:text-white text-xs">{loan.user_name || "Unknown"}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{loan.user_email || "—"}</p>
                            {loan.user_phone && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">{loan.user_phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                            {loan.loan_type === 'order_collateral' ? 'Order' : 'Asset'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                          KSh {Number(loan.loan_amount ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                          KSh {Number(loan.total_repayment ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">{loan.duration_days}d</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            loan.status === 'pending' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                            loan.status === 'approved' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                            loan.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            loan.status === 'repaid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                            loan.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            loan.status === 'defaulted' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                          }`}>
                            {String(loan.status).charAt(0).toUpperCase() + String(loan.status).slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400">{loan.purpose}</td>
                        <td className="py-3 px-4 text-center">{loan.guarantors?.length ?? 0}</td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {loan.created_at ? new Date(loan.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Loan Details Modal */}
        {selectedLoan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Loan Application Details</h2>
                <button
                  onClick={() => setSelectedLoan(null)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Applicant Information */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-3">Applicant Information</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-500">Name</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{selectedLoan.user_name || "Unknown User"}</p>
                    </div>
                    {selectedLoan.user_email && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Email</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 break-all">{selectedLoan.user_email}</p>
                      </div>
                    )}
                    {selectedLoan.user_phone && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Phone</p>
                        <p className="text-sm text-slate-900 dark:text-white">{selectedLoan.user_phone}</p>
                      </div>
                    )}
                    {selectedLoan.user_id && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">User ID</p>
                        <p className="text-xs font-mono text-slate-600 dark:text-slate-400">{selectedLoan.user_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Loan ID and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Loan ID</p>
                    <p className="font-mono text-sm text-slate-900 dark:text-white break-all">{selectedLoan.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      selectedLoan.status === 'pending' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                      selectedLoan.status === 'approved' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                      selectedLoan.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      selectedLoan.status === 'repaid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                      selectedLoan.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                      selectedLoan.status === 'defaulted' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                    }`}>
                      {String(selectedLoan.status).charAt(0).toUpperCase() + String(selectedLoan.status).slice(1)}
                    </span>
                  </div>
                </div>

                {/* Loan Type and Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">Loan Type</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedLoan.loan_type === 'order_collateral' ? 'Order Collateral' : 'Asset Collateral'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">Loan Amount</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      KSh {Number(selectedLoan.loan_amount ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Repayment Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">Total Repayment</p>
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      KSh {Number(selectedLoan.total_repayment ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">Duration</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedLoan.duration_days} days
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">Interest</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      KSh {(Number(selectedLoan.total_repayment ?? 0) - Number(selectedLoan.loan_amount ?? 0)).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">Purpose</p>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-900 dark:text-white leading-relaxed">{selectedLoan.purpose}</p>
                  </div>
                </div>

                {/* Collateral Information */}
                {selectedLoan.loan_type === 'order_collateral' && selectedLoan.order_code && (
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">Order Collateral</p>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="font-mono font-semibold text-blue-900 dark:text-blue-200">{selectedLoan.order_code}</p>
                    </div>
                  </div>
                )}

                {/* Guarantors */}
                {selectedLoan.guarantors && selectedLoan.guarantors.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-3">
                      Guarantor{selectedLoan.guarantors.length !== 1 ? 's' : ''} ({selectedLoan.guarantors.length})
                    </p>
                    <div className="space-y-2">
                      {selectedLoan.guarantors.map((guarantor, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-2 border-red-500">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{guarantor.name}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            📧 {guarantor.email}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            📞 {guarantor.phone_number}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Created</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedLoan.created_at ? new Date(selectedLoan.created_at).toLocaleString() : '—'}
                    </p>
                  </div>
                  {selectedLoan.approved_at && (
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Approved</p>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {new Date(selectedLoan.approved_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                <button
                  onClick={() => setSelectedLoan(null)}
                  className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-all font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Riders Section - Riders Tab */}
        {activeTab === 'riders' && (
        <div className="mb-8">
          <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Rider Statistics</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="text-left py-3 px-4">Rider</th>
                    <th className="text-left py-3 px-4">Location</th>
                    <th className="text-center py-3 px-4">Total Orders</th>
                    <th className="text-center py-3 px-4">Completed</th>
                    <th className="text-center py-3 px-4">In Progress</th>
                    <th className="text-center py-3 px-4">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {availableRiders.map((rider) => {
                    const riderOrders = orders.filter(o => String(o.rider) === rider);
                    const completed = riderOrders.filter(o => String(o.status).toLowerCase() === 'delivered').length;
                    const inProgress = riderOrders.filter(o => !['delivered', 'cancelled'].includes(String(o.status).toLowerCase())).length;
                    const total = riderOrders.length;
                    const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
                    
                    return (
                      <tr key={rider} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-medium">{rider}</td>
                        <td className="py-3 px-4">{riderOrders[0]?.raw?.rider?.service_location?.name || "—"}</td>
                        <td className="py-3 px-4 text-center">{total}</td>
                        <td className="py-3 px-4 text-center text-green-600">{completed}</td>
                        <td className="py-3 px-4 text-center text-blue-600">{inProgress}</td>
                        <td className="py-3 px-4 text-center font-medium">{successRate}%</td>
                      </tr>
                    );
                  })}
                  {availableRiders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No riders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {/* Users Section - Users Tab */}
        {activeTab === 'users' && (
        <div className="mb-8">
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-6 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Registered Users</h2>
            
            {errorUsers && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorUsers}
              </div>
            )}

            {/* User Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <input 
                  value={userSearchQuery} 
                  onChange={(e) => setUserSearchQuery(e.target.value)} 
                  placeholder="Search by username, email, or name" 
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20" 
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <select 
                  value={userRoleFilter} 
                  onChange={(e) => setUserRoleFilter(e.target.value)} 
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">All roles</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <select 
                  value={userJoinDateFilter} 
                  onChange={(e) => setUserJoinDateFilter(e.target.value)} 
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">All join dates</option>
                  <option value="today">Joined Today</option>
                  <option value="week">Joined This Week</option>
                  <option value="month">Joined This Month</option>
                </select>
              </div>

              <button 
                onClick={() => { 
                  setUserSearchQuery('');
                  setUserRoleFilter('');
                  setUserJoinDateFilter('');
                }} 
                className="text-sm px-3 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors duration-200 flex items-center gap-2 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-once">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                </svg>
                Reset
              </button>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
              <table className="min-w-full text-sm divide-y divide-slate-200/50 dark:divide-slate-800/50">
                <thead className="text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Username</th>
                    <th className="text-left py-3 px-4 font-medium">Phone</th>
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-center py-3 px-4 font-medium">Role</th>
                    <th className="text-right py-3 px-4 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                  {filteredUsers.slice(0, 50).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <td className="py-3 px-4 font-medium text-indigo-600 dark:text-indigo-400">{u.username}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.phone || u.phone_number || u.email || "—"}</td>
                      <td className="py-3 px-4">{u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : "—"}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex gap-1">
                          {u.is_superuser && <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Admin</span>}
                          {u.is_staff && !u.is_superuser && <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Staff</span>}
                          {!u.is_staff && !u.is_superuser && u.role && <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 capitalize">{u.role}</span>}
                          {!u.is_staff && !u.is_superuser && !u.role && <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">User</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap">{(u.created_at || u.date_joined)?.split?.("T")?.[0] ?? "—"}</td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="8" y1="15" x2="16" y2="15"/>
                            <line x1="9" y1="9" x2="9.01" y2="9"/>
                            <line x1="15" y1="9" x2="15.01" y2="9"/>
                          </svg>
                          <span>No users found</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {/* Trade-Ins Section - Trade-Ins Tab */}
        {activeTab === 'tradeins' && (
        <div className="mb-8">
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-6 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Trade-In Submissions</h2>
            
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <select 
                  value={tradeInStatusFilter} 
                  onChange={(e) => setTradeInStatusFilter(e.target.value)} 
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <button 
                onClick={() => { 
                  setTradeInStatusFilter('');
                  fetchTradeIns();
                }} 
                className="px-4 py-2 bg-slate-300 dark:bg-slate-700 rounded-full hover:bg-slate-400 dark:hover:bg-slate-600 transition-all font-medium text-sm"
                           >
                Clear Filters
              </button>
            </div>

            {loadingTradeIns ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin text-red-600 w-6 h-6" />
              </div>
            ) : errorTradeIns ? (
              <div className="p-4 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorTradeIns}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Contact Phone</th>
                      <th className="text-left py-3 px-4">Item Description</th>
                      <th className="text-right py-3 px-4">Estimated Price</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeIns.filter(t => !tradeInStatusFilter || String(t.status).toLowerCase() === tradeInStatusFilter.toLowerCase()).map((trade) => (
                      <tr key={trade.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">{trade.id}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <p className="font-medium text-slate-900 dark:text-white">{trade.user_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{trade.user_phone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{trade.contact_phone || "—"}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{trade.description || "—"}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                          KSh {Number(trade.estimated_price ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            trade.status === 'pending' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                            trade.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            trade.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                          }`}>
                            {String(trade.status).charAt(0).toUpperCase() + String(trade.status).slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {trade.created_at ? new Date(trade.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        )}

        {/* BNPL Users Section - BNPL Tab */}
        {activeTab === 'bnpl' && (
        <div className="mb-8">
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-6 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">BNPL Users</h2>
            
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <input 
                  value={bnplSearchQuery} 
                  onChange={(e) => setBnplSearchQuery(e.target.value)} 
                  placeholder="Search by username or phone" 
                  className="w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 px-3 py-2 text-sm transition-shadow duration-200 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20" 
                />
              </div>

              <button 
                onClick={() => { 
                  setBnplSearchQuery('');
                  fetchBNPL();
                }} 
                className="px-4 py-2 bg-slate-300 dark:bg-slate-700 rounded-full hover:bg-slate-400 dark:hover:bg-slate-600 transition-all font-medium text-sm"
              >
                Clear Filters
              </button>
            </div>

            {loadingBNPL ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin text-red-600 w-6 h-6" />
              </div>
            ) : errorBNPL ? (
              <div className="p-4 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorBNPL}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Phone</th>
                      <th className="text-center py-3 px-4">Enrolled</th>
                      <th className="text-center py-3 px-4">Active</th>
                      <th className="text-right py-3 px-4">Credit Limit</th>
                      <th className="text-right py-3 px-4">Current Balance</th>
                      <th className="text-right py-3 px-4">Available Credit</th>
                      <th className="text-left py-3 px-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bnplUsers.filter(b => {
                      if (bnplSearchQuery) {
                        const q = bnplSearchQuery.toLowerCase();
                        return String(b.user_name ?? '').toLowerCase().includes(q) || String(b.user_phone ?? '').toLowerCase().includes(q);
                      }
                      return true;
                    }).map((bnpl) => {
                      const availableCredit = Number(bnpl.credit_limit ?? 0) - Number(bnpl.current_balance ?? 0);
                      return (
                        <tr key={bnpl.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{bnpl.user_name}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{bnpl.user_phone || "—"}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${bnpl.is_enrolled ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'}`}>
                              {bnpl.is_enrolled ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${bnpl.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                              {bnpl.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                            KSh {Number(bnpl.credit_limit ?? 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-orange-600 dark:text-orange-400">
                            KSh {Number(bnpl.current_balance ?? 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                            KSh {availableCredit.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {bnpl.created_at ? new Date(bnpl.created_at).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    );
  })();

  return (
    <RouteGuard requireAdmin>
      <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <header className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold">Admin</h1>
            </div>

            <div className="flex gap-3 items-center">
              <button
                onClick={refreshAll}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm bg-white/90 dark:bg-white/5"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </header>

          {body}
        </div>
      </div>
    </RouteGuard>
  );
}



/* --- Helpers & small components --- */
function formatDateTime(s?: string | null) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    return d.toLocaleString();
  } catch {
    return String(s);
  }
}

function latestTimeSummary(arr: Array<any>) {
  if (!arr || arr.length === 0) return "No data";
  const times = arr
    .map((r) => new Date(r.recorded_at ?? r.created_at ?? 0).getTime())
    .filter(Boolean)
    .sort((a, b) => b - a);
  if (times.length === 0) return "No timestamps";
  const latest = new Date(times[0]);
  return `Latest ${latest.toLocaleString()}`;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-700/50 flex flex-col gap-1 sm:gap-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      <div className="flex items-center gap-1.5 text-red-600">
        <span className="w-4 h-4 sm:w-5 sm:h-5">{icon}</span>
        <span className="font-medium text-slate-600 dark:text-slate-300 text-xs sm:text-sm truncate">{label}</span>
      </div>
      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-6 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-700/50">
      <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">{title}</h2>
      <div className="transition-transform duration-300 hover:scale-[1.02]">
        <ResponsiveContainer width="100%" height={250}>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

