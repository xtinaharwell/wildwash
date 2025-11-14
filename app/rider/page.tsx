"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, MapPin, Package } from "lucide-react";
import RouteGuard from "@/components/RouteGuard";
import { useRiderNotifications } from "@/lib/hooks/useRiderNotifications";
import { useRiderOrderNotifications } from "@/lib/hooks/useRiderOrderNotifications";
import { useBackgroundOrderPolling, useOrderPollingRefresh } from "@/lib/hooks/useBackgroundOrderPolling";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

/* --- Types --- */
type OrderStatus = 'requested' | 'picked' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';

type Order = {
  id: number;
  code: string;
  service: {
    name: string;
    package: string;
  };
  pickup_address: string;
  dropoff_address: string;
  status: OrderStatus;
  urgency: number;
  items: number;
  weight_kg?: number | null;
  price?: number | null;
  created_at: string;
  estimated_delivery?: string | null;
  delivered_at?: string | null;
  user?: string;
  pickup_location?: { lat: number; lng: number };
  dropoff_location?: { lat: number; lng: number };
};

type RiderProfile = {
  id: number;
  user?: string | null;
  display_name?: string | null;
  phone?: string | null;
  vehicle_type?: string | null;
  vehicle_reg?: string | null;
  rating?: number | null;
  completed_jobs?: number | null;
  id_document?: string | null;
  license_document?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  raw?: Record<string, any>;
};

type RiderLocation = {
  id?: number;
  rider?: number | string | null;
  rider_display?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  recorded_at?: string | null;
  raw?: Record<string, any>;
};

/* --- Component --- */
export default function RiderMapPage(): React.ReactElement {
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorOrders, setErrorOrders] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>('requested');

  const [profiles, setProfiles] = useState<RiderProfile[]>([]);
  const [locations, setLocations] = useState<RiderLocation[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(true);
  const [loadingLocations, setLoadingLocations] = useState<boolean>(true);
  const [errorProfiles, setErrorProfiles] = useState<string | null>(null);
  const [errorLocations, setErrorLocations] = useState<string | null>(null);

  // Confirmation state for action buttons (orderId -> timestamp)
  const [confirmingOrderId, setConfirmingOrderId] = useState<number | null>(null);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get the order notification hook
  const { decrementCount: decrementOrderCount, setAvailableOrdersCount: setOrdersCount, fetchAndUpdateOrdersCount } = useRiderOrderNotifications();

  // Get authentication token
  const authState = JSON.parse(
    typeof window !== 'undefined' ? localStorage.getItem('wildwash_auth_state') || '{}' : '{}'
  );
  const token = authState.token || null;

  // Use background polling for orders - silent updates without page reload
  const backgroundOrders = useBackgroundOrderPolling(token, true, 15000);
  const orders = backgroundOrders;
  const refreshOrders = useOrderPollingRefresh();

  // Update loading state when orders arrive
  useEffect(() => {
    if (backgroundOrders.length > 0 && loadingOrders) {
      setLoadingOrders(false);
    }
  }, [backgroundOrders, loadingOrders]);

  // Cleanup confirmation timeout on unmount
  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    };
  }, []);

  // map refs - Temporarily commented out
  /*
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);
  const leafletLoadedRef = useRef(false);
  */

  /* --- Data fetchers --- */
  // fetchOrders is now handled by background polling service
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      await refreshOrders(token);
    } catch (err: any) {
      console.error("Manual orders refresh error:", err);
      setErrorOrders(err?.message ?? "Failed to refresh orders");
    }
  }, [token, refreshOrders]);

  const fetchProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    setErrorProfiles(null);
    try {
      const authState = JSON.parse(localStorage.getItem('wildwash_auth_state') || '{}');
      const token = authState.token;
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const res = await fetch(`${API_BASE}/riders/profiles/`, { 
        method: "GET", 
        headers: { 
          Accept: "application/json",
          Authorization: `Token ${token}`
        } 
      });
      if (!res.ok) throw new Error(`Profiles fetch failed: ${res.status} ${res.statusText}`);
      const data = await res.json().catch(() => null);
      const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

      setProfiles(
        list.map((p: any) => ({
          id: p.id,
          user: p.user ?? p.username ?? (p.user && p.user.username) ?? null,
          display_name: p.display_name ?? null,
          phone: p.phone ?? null,
          vehicle_type: p.vehicle_type ? String(p.vehicle_type).toLowerCase() : null,
          vehicle_reg: p.vehicle_reg ?? null,
          rating: p.rating ?? null,
          completed_jobs: p.completed_jobs ?? null,
          id_document: p.id_document ?? null,
          license_document: p.license_document ?? null,
          created_at: p.created_at ?? null,
          updated_at: p.updated_at ?? null,
          raw: p,
        }))
      );
    } catch (err: any) {
      console.error("fetchProfiles error:", err);
      setErrorProfiles(err?.message ?? "Failed to load profiles");
      setProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    setLoadingLocations(true);
    setErrorLocations(null);
    try {
      const authState = JSON.parse(localStorage.getItem('wildwash_auth_state') || '{}');
      const token = authState.token;
      if (!token) {
        throw new Error('Authentication required');
      }

      const res = await fetch(`${API_BASE}/riders/`, { 
        method: "GET", 
        headers: { 
          Accept: "application/json",
          Authorization: `Token ${token}`
        } 
      });
      if (!res.ok) throw new Error(`Locations fetch failed: ${res.status} ${res.statusText}`);
      const data = await res.json().catch(() => null);
      const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

      setLocations(
        list.map((l: any) => ({
          id: l.id,
          rider: l.rider ?? null,
          rider_display: l.rider_display ?? (l.rider && l.rider.username) ?? null,
          latitude: l.latitude !== undefined ? Number(l.latitude) : l.lat !== undefined ? Number(l.lat) : null,
          longitude: l.longitude !== undefined ? Number(l.longitude) : l.lon !== undefined ? Number(l.lon) : null,
          accuracy: l.accuracy ?? null,
          speed: l.speed ?? null,
          recorded_at: l.recorded_at ?? null,
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

  useEffect(() => {
    fetchOrders();
    fetchProfiles();
    fetchLocations();
    // Initialize order notification count on page load
    fetchAndUpdateOrdersCount();
  }, []);

  // Set up notifications with sound for new orders
  useRiderNotifications(token, true, 15000); // Poll notifications every 15 seconds

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const refresh = async () => {
    await Promise.all([fetchOrders(), fetchProfiles(), fetchLocations()]);
  };

  const handleAssignOrder = async (orderId: number) => {
    try {
      const authState = JSON.parse(localStorage.getItem('wildwash_auth_state') || '{}');
      const token = authState.token;
      if (!token) {
        throw new Error('Authentication required');
      }

      const res = await fetch(`${API_BASE}/orders/rider/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          action: 'accept'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to assign order: ${res.status}`);
      }

      // Decrement the available orders count in navbar
      decrementOrderCount(1);

      // Refresh the orders list and switch to in_progress page
      await fetchOrders();
      setCurrentStatus('in_progress'); // Switch to in_progress page after assignment
    } catch (err: any) {
      console.error('Failed to assign order:', err);
      alert(err.message || 'Failed to assign order. Please try again.');
    }
  };

  const handleCompletePickup = async (orderId: number) => {
    try {
      const authState = JSON.parse(localStorage.getItem('wildwash_auth_state') || '{}');
      const token = authState.token;
      if (!token) {
        throw new Error('Authentication required');
      }

      // Check if user is confirming (double-click pattern)
      if (confirmingOrderId !== orderId) {
        // First click - show confirmation state
        setConfirmingOrderId(orderId);
        // Clear confirmation after 3 seconds
        if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        confirmTimeoutRef.current = setTimeout(() => {
          setConfirmingOrderId(null);
        }, 3000);
        return;
      }

      // Second click within 3 seconds - proceed with action
      setConfirmingOrderId(null);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);

      const res = await fetch(`${API_BASE}/orders/update/?id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          status: 'picked'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to complete pickup: ${res.status}`);
      }

      // Refresh the orders list and switch to picked page
      await refreshOrders(token);
      setCurrentStatus('picked'); // Switch to picked page after completion
    } catch (err: any) {
      console.error('Failed to complete pickup:', err);
      alert(err.message || 'Failed to complete pickup. Please try again.');
    }
  };

  // Find latest location for each rider
  const latestLocationByRider = useMemo(() => {
    const m = new Map<string, RiderLocation>();
    for (const loc of locations) {
      const key = String(loc.rider ?? loc.rider_display ?? loc.id ?? Math.random());
      const cur = m.get(key);
      const tsCur = cur ? new Date(cur.recorded_at ?? 0).getTime() : 0;
      const tsNew = new Date(loc.recorded_at ?? 0).getTime();
      if (!cur || tsNew >= tsCur) m.set(key, loc);
    }
    return m;
  }, [locations]);

  // Filter orders by selected status
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => o.status === currentStatus);
  }, [orders, currentStatus]);

  /* --- Map helpers --- */
  async function injectLeafletCss() {
    if (document.getElementById("leaflet-css")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.id = "leaflet-css";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }

  // Geocode address to coordinates (MOVED TO BACKEND - disabled client-side to avoid CORS and rate limiting)
  // If you need this on the frontend, use a backend endpoint instead of calling Nominatim directly
  async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    // DISABLED: Client-side geocoding causes CORS issues and rate limiting
    // Instead, coordinates should be provided by the backend
    return null;
  }

  function svgDataUrl(svgString: string) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  }

  function getOrderMarkerSvg(status: OrderStatus, isPickup: boolean) {
    const colors: Record<OrderStatus, string> = {
      requested: "#ef4444",
      picked: "#3b82f6",
      in_progress: "#eab308",
      ready: "#22c55e",
      delivered: "#6b7280",
      cancelled: "#9ca3af",
    };

    const color = colors[status] || "#6b7280";

    if (isPickup) {
      return `<?xml version='1.0' encoding='UTF-8'?>
        <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'>
          <path d='M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z' fill='${color}'/>
          <path d='M9 7h6M9 10h6M12 7v6' stroke='white' stroke-width='1.5'/>
        </svg>`;
    } else {
      return `<?xml version='1.0' encoding='UTF-8'?>
        <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'>
          <path d='M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z' fill='${color}'/>
          <circle cx='12' cy='9' r='3' fill='white'/>
        </svg>`;
    }
  }

  function getRiderMarkerSvg(vehicleType?: string) {
    const v = (vehicleType ?? "").toLowerCase();
    if (v.includes("van") || v.includes("truck") || v.includes("car")) {
      return `<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24'><rect x='1' y='6' width='18' height='8' rx='1.2' fill='#105969'/><rect x='19' y='8' width='3' height='6' rx='0.5' fill='#005966'/><circle cx='6.5' cy='16' r='1.6' fill='#000000'/><circle cx='15.5' cy='16' r='1.6' fill='#000000'/></svg>`;
    } else if (v.includes("motor") || (v.includes("bike") && v.includes("motor"))) {
      return `<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24'><path d='M2 16a3 3 0 006 0' fill='#105969'/><path d='M16 13l2-2 3 1' stroke='#000000' stroke-width='1.2' fill='none'/><circle cx='6' cy='17' r='2' fill='#000000'/><circle cx='18' cy='17' r='2' fill='#000000'/></svg>`;
    } else if (v.includes("bicycle") || v.includes("bike")) {
      return `<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24'><circle cx='6' cy='17' r='2' fill='#000000'/><circle cx='18' cy='17' r='2' fill='#000000'/><path d='M6 17L10 7h3l2 6' stroke='#105969' stroke-width='1.2' fill='none'/></svg>`;
    }
    return `<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24'><path d='M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z' fill='#105969'/><circle cx='12' cy='9' r='2.5' fill='#fff'/></svg>`;
  }

  /* --- Map initialization & markers --- Temporarily commented out
  /*
  async function ensureMapAndMarkers() {
    try {
      await injectLeafletCss();
      const mod = await import("leaflet");
      const L = (mod as any).default || mod;
      leafletLoadedRef.current = true;

      if (!mapContainerRef.current) return;

      // Initialize map if needed
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, { center: [0, 0], zoom: 2, preferCanvas: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        mapInstanceRef.current = map;
        // sometimes container size hasn't been calculated yet
        setTimeout(() => map.invalidateSize(true), 120);
      }

      // Clear existing markers
      markersRef.current.forEach((m) => {
        try {
          mapInstanceRef.current.removeLayer(m);
        } catch {}
      });
      markersRef.current = [];

      const map = mapInstanceRef.current;
      const bounds: any[] = [];

      // Add order markers
      for (const order of filteredOrders) {
        // pickup
        if (order.pickup_location) {
          const icon = L.icon({
            iconUrl: svgDataUrl(getOrderMarkerSvg(order.status, true)),
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -30],
          });

          const marker = L.marker([order.pickup_location.lat, order.pickup_location.lng], { icon }).addTo(map);

          const pickupHtmlParts = [
            `<div style="font-size:13px">`,
            `<div style="font-weight:600">Order ${escapeHtml(order.code)}</div>`,
            `<div style="color:#666">Pickup Location</div>`,
            `<div style="margin-top:4px">${escapeHtml(order.pickup_address)}</div>`,
            `<div style="color:#666;margin-top:4px">Status: ${escapeHtml(capitalize(order.status))}<br/>Items: ${escapeHtml(String(order.items))}<br/>Created: ${escapeHtml(formatDateTime(order.created_at))}</div>`,
            `</div>`,
          ].join("");

          marker.bindPopup(pickupHtmlParts);
          markersRef.current.push(marker);
          bounds.push([order.pickup_location.lat, order.pickup_location.lng]);
        }

        // dropoff
        if (order.dropoff_location) {
          const icon = L.icon({
            iconUrl: svgDataUrl(getOrderMarkerSvg(order.status, false)),
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -30],
          });

          const marker = L.marker([order.dropoff_location.lat, order.dropoff_location.lng], { icon }).addTo(map);

          const est = order.estimated_delivery ? `Est. Delivery: ${formatDateTime(order.estimated_delivery)}` : "";
          const dropHtmlParts = [
            `<div style="font-size:13px">`,
            `<div style="font-weight:600">Order ${escapeHtml(order.code)}</div>`,
            `<div style="color:#666">Dropoff Location</div>`,
            `<div style="margin-top:4px">${escapeHtml(order.dropoff_address)}</div>`,
            `<div style="color:#666;margin-top:4px">Status: ${escapeHtml(capitalize(order.status))}<br/>Items: ${escapeHtml(String(order.items))}${est ? "<br/>" + escapeHtml(est) : ""}</div>`,
            `</div>`,
          ].join("");

          marker.bindPopup(dropHtmlParts);
          markersRef.current.push(marker);
          bounds.push([order.dropoff_location.lat, order.dropoff_location.lng]);
        }
      }

      // Add rider markers
      for (const [key, loc] of latestLocationByRider.entries()) {
        if (!loc.latitude || !loc.longitude) continue;

        const vehicleType = profiles.find((p) => String(p.id) === String(loc.rider) || String(p.user) === String(loc.rider))?.vehicle_type;

        const icon = L.icon({
          iconUrl: svgDataUrl(getRiderMarkerSvg(vehicleType || undefined)),
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -30],
        });

        const marker = L.marker([loc.latitude, loc.longitude], { icon }).addTo(map);

        const title = loc.rider_display ?? String(loc.rider ?? key ?? "Rider");
        const when = loc.recorded_at ? new Date(loc.recorded_at).toLocaleString() : "unknown";
        const vehicleLabel = (vehicleType ? `${String(vehicleType)}` : "unknown vehicle").replace(/^[a-z]/, (c) => c.toUpperCase());

        const popupHtml = [
          `<div style="font-size:13px">`,
          `<div style="font-weight:600">${escapeHtml(title)}</div>`,
          `<div style="font-size:12px;color:#444">${escapeHtml(vehicleLabel)}</div>`,
          `<div style="font-size:12px;color:#666;margin-top:6px">Last seen: ${escapeHtml(when)}</div>`,
          `</div>`,
        ].join("");

        marker.bindPopup(popupHtml);
        markersRef.current.push(marker);
        bounds.push([loc.latitude, loc.longitude]);
      }

      // Fit bounds if we have markers
      if (bounds.length) {
        try {
          map.invalidateSize(true);
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
        } catch (err) {
          console.warn("fitBounds failed, falling back to first point", err);
          map.setView(bounds[0], 12);
        }
      } else {
        map.setView([0, 0], 2);
      }
    } catch (err) {
      console.error("ensureMapAndMarkers error:", err);
    }
  }

  // Update map when data changes
  useEffect(() => {
    const t = setTimeout(() => ensureMapAndMarkers(), 150);
    return () => clearTimeout(t);
  }, [filteredOrders, locations, profiles]);

  // Create map once and cleanup on unmount
  useEffect(() => {
    return () => {
      // destroy map and markers on unmount
      try {
        markersRef.current.forEach((m) => {
          try {
            mapInstanceRef.current?.removeLayer?.(m);
          } catch {}
        });
        markersRef.current = [];
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove(); // leaflet map remove
          mapInstanceRef.current = null;
        }
      } catch {}
      leafletLoadedRef.current = false;
    };
  }, []);
  */

  /* --- Render --- */
  return (
    <RouteGuard requireRider>
      <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <header className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold">Rider Map</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                View nearby orders and other riders on the map
              </p>
            </div>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-full border dark:border-slate-700 px-3 py-2 bg-white/80 dark:bg-white/5 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </header>

          <div className="grid grid-cols-1 gap-6">
            {/* Left: Order list & filters */}
            <section className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-semibold">Orders</h2>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {(['requested', 'in_progress', 'picked'] as const).map((status) => {
                    const count = orders.filter(order => order.status === status).length;
                    return (
                      <button
                        key={status}
                        onClick={() => setCurrentStatus(status)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          currentStatus === status 
                            ? "bg-red-600 text-white shadow-md" 
                            : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <span>{capitalize(status)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          currentStatus === status 
                            ? "bg-red-700 text-white" 
                            : "bg-slate-100 dark:bg-slate-700"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {loadingOrders ? (
                <div className="py-8 text-center">Loading orders...</div>
              ) : errorOrders ? (
                <div className="py-4 text-red-600">Error: {errorOrders}</div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-6 text-center text-slate-500">No orders found.</div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <div className="flex-grow">
                        <div className="font-semibold">Order {order.code}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Service: {order.service.name}
                          <br />
                          Items: {order.items}
                          {order.weight_kg && ` • ${order.weight_kg}kg`}
                          <br />
                          Created: {formatDateTime(order.created_at)}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                          <div>From: {order.pickup_address}</div>
                          <div>To: {order.dropoff_address}</div>
                        </div>
                      </div>
                      {order.status === 'requested' && (
                        <button
                          onClick={() => handleAssignOrder(order.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        >
                          Assign Me
                        </button>
                      )}
                      {order.status === 'in_progress' && (
                        <button
                          onClick={() => handleCompletePickup(order.id)}
                          className={`px-3 py-1 text-sm rounded-full transition-all flex items-center gap-1 ${
                            confirmingOrderId === order.id
                              ? 'bg-orange-600 hover:bg-orange-700 animate-pulse'
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white`}
                        >
                          <span>
                            {confirmingOrderId === order.id ? 'Click again to confirm' : 'Complete Pickup'}
                          </span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Right: Map - Temporarily commented out
            <aside className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 shadow space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold">Live Map</h3>
                </div>
              </div>

              <div className="space-y-3">
                <div ref={mapContainerRef} style={{ height: 600, width: "100%" }} className="rounded" />
                <div className="text-xs text-slate-500">
                  <div className="font-semibold mb-1">Legend:</div>
                  <div>Orders:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>🔴 Requested</div>
                    <div>🔵 Picked Up</div>
                    <div>🟡 In Progress</div>
                    <div>🟢 Ready</div>
                  </div>
                  <div className="mt-2">Riders:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>🚗 Car/Van</div>
                    <div>🏍️ Motorbike</div>
                    <div>🚲 Bicycle</div>
                  </div>
                </div>
              </div>
            </aside>
            */}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}

/* --- Helpers --- */
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

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[m]
  );
}
