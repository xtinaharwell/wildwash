/**
 * Prefetch Integration Examples
 * Real-world examples for common Wild Wash pages
 */

/**
 * EXAMPLE 1: Orders Page with Smart Prefetching
 * 
 * Before: Each page load caused 40-50 queries, slow rendering
 * After: Data cached, instant load, prefetched next page in background
 */
'use client';

import React, { useState } from 'react';
import { usePrefetch, usePrefetchBackground, cacheKeys } from '@/lib/prefetch/usePrefetch';
import { client } from '@/lib/api/client';

// Type definitions
interface Order {
  id: number;
  code: string;
  status: string;
  [key: string]: any;
}

interface OrderResponse {
  results: Order[];
  count: number;
}

interface Rider {
  id: number;
  display_name?: string;
  [key: string]: any;
}

interface Notification {
  id: number;
  message: string;
  [key: string]: any;
}

interface Service {
  id: number;
  name: string;
  [key: string]: any;
}

interface DashboardData {
  orders?: Order[];
  notifications?: Notification[];
  profile?: any;
}

export function OrdersPageOptimized() {
  const [page, setPage] = useState(1);

  // Fetch current page with cache
  const { data: ordersResponse, loading, error, refetch } = usePrefetch(
    cacheKeys.orders(page),
    () => client.get(`/orders/?page=${page}`),
    {
      ttl: 5 * 60 * 1000, // Keep for 5 minutes
      priority: 'high',
      background: true, // Auto-refresh if stale
    }
  );

  // Prefetch next page in background
  usePrefetchBackground(
    cacheKeys.orders(page + 1),
    () => client.get(`/orders/?page=${page + 1}`),
    { priority: 'low' } // Don't slow down current page
  );

  const orders = ordersResponse?.results || [];
  const totalPages = Math.ceil((ordersResponse?.count || 0) / 20);

  return (
    <div className="space-y-4">
      {loading && <div className="text-center">Loading...</div>}
      {error && (
        <div className="bg-red-100 p-4 rounded">
          Error: {error.message} <button onClick={refetch}>Retry</button>
        </div>
      )}

      {orders.map((order: Order) => (
        <div key={order.id} className="border p-4 rounded">
          <div>{order.code}</div>
          <div>{order.status}</div>
        </div>
      ))}

      <div className="flex justify-between">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/**
 * EXAMPLE 2: Rider Dashboard with Multiple Data Sources
 * 
 * Fetches Orders, Locations, and Notifications in parallel
 * All cached independently to maximize hit rate
 */

import { usePrefetchMultiple, usePrefetchPolling } from '@/lib/prefetch/usePrefetch';

export function RiderDashboardOptimized() {
  // Fetch multiple data sources in parallel
  const { data: dashboardData, loading, error } = usePrefetchMultiple({
    orders: {
      key: cacheKeys.riderOrders('in_progress'),
      fetcher: () => client.get('/orders/rider/?status=in_progress'),
    },
    notifications: {
      key: cacheKeys.notifications(),
      fetcher: () => client.get('/notifications/'),
    },
    profile: {
      key: cacheKeys.userProfile(),
      fetcher: () => client.get('/users/me/'),
    },
  }, { ttl: 3 * 60 * 1000 }) as { data: DashboardData | null; loading: boolean; error: any };

  // Keep orders fresh with polling
  const { data: freshOrders } = usePrefetchPolling(
    cacheKeys.riderOrders('in_progress'),
    () => client.get('/orders/rider/?status=in_progress'),
    30000, // Refresh every 30 seconds
    { priority: 'high' }
  );

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <h2>Active Orders ({freshOrders?.length || 0})</h2>
        {freshOrders?.map((order: Order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      <div>
        <h2>Profile</h2>
        {dashboardData && dashboardData.profile && <ProfileCard profile={dashboardData.profile} />}

        <h2>Notifications</h2>
        {dashboardData && dashboardData.notifications && dashboardData.notifications.map((notif: Notification) => (
          <NotificationItem key={notif.id} notification={notif} />
        ))}
      </div>
    </div>
  );
}

/**
 * EXAMPLE 3: Admin Dashboard with Batch Prefetch
 * 
 * Loads all dashboard data upfront for smooth experience
 * Uses high priority and longer TTL for stability
 */

import { useBatchPrefetch } from '@/lib/prefetch/usePrefetch';

export function AdminDashboardOptimized() {
  // Batch prefetch all dashboard data
  useBatchPrefetch(
    [
      {
        key: cacheKeys.orders(1),
        fetcher: () => client.get('/orders/?page=1'),
      },
      {
        key: cacheKeys.riderProfiles(),
        fetcher: () => client.get('/riders/profiles/'),
      },
      {
        key: cacheKeys.riderLocations(),
        fetcher: () => client.get('/riders/locations/'),
      },
      {
        key: cacheKeys.services(),
        fetcher: () => client.get('/services/'),
      },
    ],
    { ttl: 10 * 60 * 1000, priority: 'high' }
  );

  // Now fetch each piece with instant response
  const { data: orders } = usePrefetch(cacheKeys.orders(1), () => client.get('/orders/?page=1'));
  const { data: riders } = usePrefetch(cacheKeys.riderProfiles(), () => client.get('/riders/profiles/'));
  const { data: locations } = usePrefetch(cacheKeys.riderLocations(), () => client.get('/riders/locations/'));

  return (
    <div className="space-y-6">
      <OrdersWidget orders={orders?.results} />
      <RidersWidget riders={riders} />
      <MapWidget locations={locations} />
    </div>
  );
}

/**
 * EXAMPLE 4: Smart Navigation with Hover Prefetch
 * 
 * Prefetches data when user hovers over links
 * By the time they click, data is already cached
 */

import { usePrefetchOnHover } from '@/lib/prefetch/usePrefetch';
import Link from 'next/link';

function SmartNavLink({
  href,
  label,
  cacheKey,
  fetcher,
}: {
  href: string;
  label: string;
  cacheKey: string;
  fetcher: () => Promise<any>;
}) {
  const { onMouseEnter } = usePrefetchOnHover(cacheKey, fetcher, { priority: 'high' });

  return (
    <Link href={href} onMouseEnter={onMouseEnter} className="hover:text-blue-600">
      {label}
    </Link>
  );
}

export function NavigationOptimized() {
  return (
    <nav className="flex gap-6">
      <SmartNavLink
        href="/orders"
        label="My Orders"
        cacheKey={cacheKeys.orders(1)}
        fetcher={() => client.get('/orders/?page=1')}
      />
      <SmartNavLink
        href="/riders"
        label="Riders"
        cacheKey={cacheKeys.riderProfiles()}
        fetcher={() => client.get('/riders/profiles/')}
      />
      <SmartNavLink
        href="/services"
        label="Services"
        cacheKey={cacheKeys.services()}
        fetcher={() => client.get('/services/')}
      />
      <SmartNavLink
        href="/offers"
        label="Special Offers"
        cacheKey={cacheKeys.offers()}
        fetcher={() => client.get('/offers/')}
      />
    </nav>
  );
}

/**
 * EXAMPLE 5: Rider Map with Polling
 * 
 * Real-time location updates without overwhelming the server
 * Uses smart polling with configurable intervals
 */

export function RiderMapOptimized() {
  // Keep locations fresh with 5-second polling
  const { data: locations } = usePrefetchPolling(
    cacheKeys.riderLocations(),
    () => client.get('/riders/locations/'),
    5000, // Refresh every 5 seconds
    { priority: 'high' }
  );

  // Keep orders updated every 10 seconds
  const { data: orders, refetch: refetchOrders } = usePrefetchPolling(
    cacheKeys.riderOrders(),
    () => client.get('/orders/rider/'),
    10000,
    { priority: 'high' }
  );

  return (
    <div className="grid grid-cols-3 gap-4">
      <Map locations={locations} />
      <OrderList orders={orders} onRefresh={refetchOrders} />
    </div>
  );
}

/**
 * EXAMPLE 6: Form Page with Cache Invalidation
 * 
 * When user leaves edit page, invalidate cache so next visit is fresh
 */

import { useInvalidateOnUnmount } from '@/lib/prefetch/usePrefetch';

export function EditOrderPageOptimized({ orderId }: { orderId: number }) {
  // When component unmounts, invalidate related caches
  useInvalidateOnUnmount([
    cacheKeys.orders(1),
    cacheKeys.orders(2),
    cacheKeys.orders(3),
  ]);

  const [formData, setFormData] = React.useState({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await client.patch(`/orders/${orderId}/`, formData);
    // Cache will be invalidated on unmount
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}

/**
 * EXAMPLE 7: Service Listing with Prefetch on Mount
 * 
 * Load services data automatically when page mounts
 */

export function ServiceListingOptimized() {
  const { data: services, loading } = usePrefetch(
    cacheKeys.services(),
    () => client.get('/services/'),
    {
      ttl: 30 * 60 * 1000, // Services rarely change, cache 30 minutes
      priority: 'medium',
    }
  );

  if (loading) return <div>Loading services...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      {services?.map((service: Service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}

/**
 * Helper components (stubs)
 */
function OrderCard({ order }: { order: Order }) {
  return <div className="border p-2">{order.code}</div>;
}

function ProfileCard({ profile }: { profile: any }) {
  return <div className="border p-2">{profile.first_name}</div>;
}

function NotificationItem({ notification }: { notification: Notification }) {
  return <div className="border p-2">{notification.message}</div>;
}

function OrdersWidget({ orders }: { orders?: Order[] }) {
  return <div>Orders: {orders?.length}</div>;
}

function RidersWidget({ riders }: { riders?: Rider[] }) {
  return <div>Riders: {riders?.length}</div>;
}

function MapWidget({ locations }: { locations?: any[] }) {
  return <div>Map: {locations?.length} locations</div>;
}

function Map({ locations }: { locations?: any[] }) {
  return <div>Map rendering {locations?.length} riders</div>;
}

function OrderList({ orders, onRefresh }: { orders?: Order[]; onRefresh?: () => void }) {
  return <div>Orders: {orders?.length}</div>;
}

function ServiceCard({ service }: { service: Service }) {
  return <div className="border p-4">{service.name}</div>;
}
