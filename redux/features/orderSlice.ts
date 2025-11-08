// store/slices/orderSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

//
// Types (mirror what your frontend expects)
//
type BackendOrder = {
  id: number;
  code: string;
  created_at: string;
  items: number;
  weight_kg?: number | string | null;
  service?: { name?: string } | string | null; // sometimes serializer returns nested service
  package?: string; // fallback: service name or provided string
  price?: string | number | null;
  price_display?: string | null;
  status: 'requested' | 'picked' | 'in_progress' | 'ready' | 'delivered' | 'cancelled' | string;
  estimated_delivery?: string | null;
  delivered_at?: string | null;
};

export type Order = {
  code: string;
  date: string; // ISO
  items: number;
  weightKg?: number | null;
  package: string;
  price: string; // formatted for display
  status: "Received" | "Washing" | "Drying" | "Ready" | "Delivered" | "Cancelled";
  eta?: string | null;
  deliveredAt?: string | null;
};

type OrdersState = {
  orders: Order[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  statusFilter: "All" | Order['status'];
  query: string;
  creating: boolean;
  createLoading: boolean;
  // small refresh token to force re-fetch from component if needed
  refreshCounter: number;
};

const statusMap: Record<string, Order['status']> = {
  requested: "Received",
  picked: "Washing",
  in_progress: "Drying",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const frontendToBackendStatus: Record<string, string> = {
  Received: 'requested',
  Washing: 'picked',
  Drying: 'in_progress',
  Ready: 'ready',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
};

function backendToFrontend(o: BackendOrder): Order {
  const price = o.price_display ?? (o.price ? `KSh ${Number(o.price).toLocaleString()}` : "");
  const weightKg = o.weight_kg ? Number(o.weight_kg) : undefined;
  const eta = o.estimated_delivery ? new Date(o.estimated_delivery).toLocaleString() : undefined;
  const deliveredAt = o.delivered_at ? new Date(o.delivered_at).toLocaleString() : undefined;

  // determine package/service name robustly
  let pkg = '';
  if (typeof o.package === 'string' && o.package) pkg = o.package;
  else if (o.service && typeof o.service === 'object' && (o.service as any).name) pkg = (o.service as any).name;
  else pkg = `Package ${o.id}`;

  return {
    code: o.code || `WW-${o.id}`,
    date: o.created_at,
    items: o.items ?? 0,
    weightKg,
    package: pkg,
    price,
    status: statusMap[o.status] ?? "Received",
    eta,
    deliveredAt,
  };
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const c of cookies) {
    const [k, ...v] = c.split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

//
// Async thunks
//
export const fetchOrders = createAsyncThunk<
  { orders: Order[]; totalCount: number },
  void,
  { state: any; rejectValue: string }
>('orders/fetchOrders', async (_, { getState, rejectWithValue }) => {
  const state = getState().orders as OrdersState;
  const params = new URLSearchParams();
  params.set('page', String(state.page));
  params.set('page_size', String(state.pageSize));
  if (state.statusFilter !== 'All') {
    // map frontend label to backend code
    const backend = frontendToBackendStatus[state.statusFilter] ?? state.statusFilter;
    params.set('status', backend);
  }
  if (state.query) params.set('search', state.query);

  const baseUrl =
    "https://wildwosh.kibeezy.com/orders/";
  const url = `${baseUrl}?${params.toString()}`;

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = { Accept: 'application/json' };
    let res: Response;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      res = await fetch(url, { headers });
    } else {
      // session cookie flow
      const csrftoken = getCookie('csrftoken');
      if (csrftoken) headers['X-CSRFToken'] = csrftoken;
      res = await fetch(url, { headers, credentials: 'include' });
    }

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText || 'Fetch failed');
      return rejectWithValue(`Failed to load orders: ${res.status} - ${text}`);
    }

    const data = await res.json();

    let list: BackendOrder[] = [];
    let count = 0;
    if (Array.isArray(data)) {
      list = data as BackendOrder[];
      count = list.length;
    } else {
      list = (data.results ?? []) as BackendOrder[];
      count = typeof data.count === 'number' ? data.count : list.length;
    }

    const mapped = list.map(backendToFrontend);
    return { orders: mapped, totalCount: count };
  } catch (err: any) {
    return rejectWithValue(err.message ?? 'Failed to fetch orders');
  }
});

type CreateOrderPayload = {
  service: number | null;
  pickup_address: string;
  dropoff_address: string;
  urgency?: number;
  items?: number;
  package?: number;
  weight_kg?: number | null;
  price?: string | null;
  estimated_delivery?: string | null;
};

export const createOrder = createAsyncThunk<
  Order,
  CreateOrderPayload,
  { rejectValue: string }
>('orders/createOrder', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    let res: Response;

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      res = await fetch('/api/orders/', { method: 'POST', headers, body: JSON.stringify(payload) });
    } else {
      const csrftoken = getCookie('csrftoken');
      if (csrftoken) headers['X-CSRFToken'] = csrftoken;
      res = await fetch('/api/orders/', { method: 'POST', headers, body: JSON.stringify(payload), credentials: 'include' });
    }

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText || '');
      return rejectWithValue(`Create failed ${res.status}: ${text}`);
    }

    const created = (await res.json()) as BackendOrder;
    const mapped = backendToFrontend(created);

    // After creating, it's common to refresh page 1 so the newest appears
    dispatch(setPage(1));
    dispatch(incrementRefresh()); // signal components if they want to listen
    // Optionally trigger fetchOrders immediately
    dispatch(fetchOrders());

    return mapped;
  } catch (err: any) {
    return rejectWithValue(err.message ?? 'Failed to create order');
  }
});

//
// Slice
//
const initialState: OrdersState = {
  orders: [],
  loading: false,
  error: null,
  page: 1,
  pageSize: 6,
  totalPages: 1,
  totalCount: 0,
  statusFilter: 'All',
  query: '',
  creating: false,
  createLoading: false,
  refreshCounter: 0,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<OrdersState['statusFilter']>) {
      state.statusFilter = action.payload;
    },
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    incrementRefresh(state) {
      state.refreshCounter += 1;
    },
  },
  extraReducers: (builder) => {
    // fetchOrders
    builder.addCase(fetchOrders.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOrders.fulfilled, (state, action) => {
      state.loading = false;
      state.orders = action.payload.orders;
      state.totalCount = action.payload.totalCount;
      state.totalPages = Math.max(1, Math.ceil(action.payload.totalCount / state.pageSize));
      state.error = null;
    });
    builder.addCase(fetchOrders.rejected, (state, action) => {
      state.loading = false;
      state.orders = [];
      state.error = action.payload ?? action.error.message ?? 'Failed to load orders';
    });

    // createOrder
    builder.addCase(createOrder.pending, (state) => {
      state.createLoading = true;
      state.error = null;
    });
    builder.addCase(createOrder.fulfilled, (state, action) => {
      state.createLoading = false;
      // Optionally add the new order at start of list
      state.orders = [action.payload, ...state.orders];
      state.error = null;
    });
    builder.addCase(createOrder.rejected, (state, action) => {
      state.createLoading = false;
      state.error = action.payload ?? action.error.message ?? 'Failed to create order';
    });
  },
});

export const { setPage, setPageSize, setStatusFilter, setQuery, clearError, incrementRefresh } =
  ordersSlice.actions;

export default ordersSlice.reducer;

//
// Selectors (use with useSelector)
//
// Select full orders state
export const selectOrdersState = (state: any): OrdersState => state.orders;

// Basic selectors
export const selectOrders = createSelector(
  [selectOrdersState],
  (ordersState) => ordersState.orders
);
export const selectOrdersLoading = createSelector(
  [selectOrdersState],
  (ordersState) => ordersState.loading
);
export const selectOrdersError = createSelector(
  [selectOrdersState],
  (ordersState) => ordersState.error
);

// ✅ Memoized meta selector (fixing the warning!)
export const selectOrdersMeta = createSelector(
  [selectOrdersState],
  (ordersState) => ({
    page: ordersState.page,
    pageSize: ordersState.pageSize,
    totalPages: ordersState.totalPages,
    totalCount: ordersState.totalCount,
    statusFilter: ordersState.statusFilter,
    query: ordersState.query,
  })
);
