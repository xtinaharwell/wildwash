"use client";
import React, { useEffect, useState } from "react";
import { getStoredAuthState } from "@/lib/auth";

/**
 * /book page.tsx
 * - Uses relative API paths so it's same-origin by default (avoids CORS during dev).
 * - Sends credentials (cookies) and X-CSRFToken if present.
 * - Shows server validation errors (400) clearly in the UI.
 *
 * Set NEXT_PUBLIC_API_BASE if your API is on a different origin:
 *   NEXT_PUBLIC_API_BASE=https://api.example.com
 */
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
  return null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ""; // empty = same origin

import RouteGuard from "../../components/RouteGuard";

export default function Page() {
  const [pickupBuilding, setPickupBuilding] = useState("");
  const [pickupContact, setPickupContact] = useState("");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [services, setServices] = useState<Array<{ id: number; name: string }>>([]);
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [urgency, setUrgency] = useState(2); // 1 = Normal, 2 = Fast, 3 = Express
  const [progress, setProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<any | null>(null);

  useEffect(() => {
    // warm the csrf cookie for cross-domain SPA
    fetch(`${API_BASE}/users/csrf/`, { method: "GET", credentials: "include" }).catch((e) => {
      console.warn("CSRF warmup failed", e);
    });
  }, []);

  // Fetch user profile
  useEffect(() => {
    const authState = getStoredAuthState();
    if (!authState?.token) return;

    fetch(`${API_BASE}/users/me/`, {
      credentials: "include",
      headers: {
        "Authorization": `Token ${authState.token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setUserProfile(data);
      // Prefill phone number if available
      if (data?.phone && !pickupContact) {
        setPickupContact(data.phone);
      }
    })
    .catch(err => {
      console.warn("Could not fetch user profile:", err);
    });
  }, []); // Run once on mount
  
  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/services/`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load services");
        return r.json();
      })
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          // Normalize ids to numbers (defensive)
          setServices(data.map((s) => ({ ...s, id: Number(s.id) })));
        }
      })
      .catch((err) => {
        console.warn("Could not fetch services:", err);
      });
    return () => {
      mounted = false;
    };
  }, []); // run once

  function resetMessage() {
    setMessage(null);
    setServerErrors(null);
  }

  const canSubmitOrder = !!pickupBuilding.trim() && 
    !!pickupContact.trim() && 
    selectedServices.length > 0 && 
    (sameAsPickup || !!dropoffAddress.trim());

  async function postOrder(payload: Record<string, any>) {
    resetMessage();
    setSending(true);
    setProgress(10);
    try {
      console.log("Posting order payload:", payload);
      await new Promise((r) => setTimeout(r, 250));
      setProgress(40);

      const csrf = getCookie("csrftoken");
      const authState = getStoredAuthState();
      
      const res = await fetch(`${API_BASE}/orders/`, {
        method: "POST",
        mode: "cors",
        credentials: "include", // send cookies (sessionid, csrftoken)
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRFToken": csrf } : {}),
          ...(authState?.token ? { "Authorization": `Token ${authState.token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }

      if (!res.ok) {
        console.error("Orders POST failed", res.status, data);
        setServerErrors(data || { non_field_errors: ["Server returned an error"] });
        setMessage(`Server error: ${res.status} ${res.statusText}`);
        setProgress(0);
        return { ok: false, data };
      }

      setProgress(100);
      setMessage(data?.code ? `Order ${data.code} created` : "Order created");
      return { ok: true, data };
    } catch (err: any) {
      console.error("Network/fetch error:", err);
      setMessage(`Network error: ${err?.message ?? String(err)}`);
      setProgress(0);
      setServerErrors({ network: [err?.message ?? "Network failure"] });
      return { ok: false, err };
    } finally {
      setSending(false);
      setTimeout(() => setProgress(0), 700);
    }
  }

  async function handleSubmitOrder() {
    if (!canSubmitOrder) {
      setMessage("Please fill all required fields and select at least one service.");
      return;
    }

    // Create an order for each selected service
    try {
      setMessage(null);
      setSending(true);
      
      const results = await Promise.all(selectedServices.map(async (serviceId) => {
        const payload = {
          service: Number(serviceId),
          pickup_address: pickupBuilding + (pickupContact ? ` (contact: ${pickupContact})` : ""),
          dropoff_address: sameAsPickup ? pickupBuilding : dropoffAddress,
          urgency: Number(urgency),
          items: 1,
          weight_kg: null,
          price: null,
          estimated_delivery: null,
        };

        return postOrder(payload);
      }));

      const successful = results.filter(r => r.ok).length;
      if (successful === results.length) {
        setMessage(`Successfully created ${successful} order(s)`);
        // Clear form on success
        setPickupBuilding("");
        setPickupContact("");
        setSelectedServices([]);
        setDropoffAddress("");
        setSameAsPickup(false);
        setUrgency(2);
      } else {
        setMessage(`Created ${successful} out of ${results.length} orders`);
      }
    } catch (error) {
      console.error('Error submitting orders:', error);
      setMessage('Failed to submit orders. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <RouteGuard>
      <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
          <div className="md:flex">
          <section className="w-full md:w-2/3 p-6 md:p-8">
            <header className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Wild Wash</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Laundry & Cleaning — Pickup and Dropoff</p>
              </div>
              <div className="hidden md:block text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400">Progress</div>
                <div className="mt-2 w-40">
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">{progress}%</div>
              </div>
            </header>

            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-700">Pickup Address</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pickup-building" className="block text-xs text-slate-500 mb-1">Building / Street</label>
                    <input 
                      id="pickup-building"
                      type="text"
                      value={pickupBuilding} 
                      onChange={(e) => setPickupBuilding(e.target.value)} 
                      placeholder="e.g. Olive Towers, 4th floor" 
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-600 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" 
                    />
                  </div>
                  <div>
                    <label htmlFor="pickup-contact" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Contact (phone)</label>
                    <input 
                      id="pickup-contact"
                      type="tel"
                      value={pickupContact} 
                      onChange={(e) => setPickupContact(e.target.value)} 
                      placeholder="e.g. +254 7xx xxx xxx" 
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-600 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" 
                    />
                  </div>
                </div>

                <div>
                  <div className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Select Services</div>
                  <div className="space-y-2" role="group" aria-label="Available services">
                    {services.map((service) => (
                      <label key={service.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`service-${service.id}`}
                          checked={selectedServices.includes(service.id)}
                          onChange={(e) => {
                            setSelectedServices(prev => 
                              e.target.checked 
                                ? [...prev, service.id]
                                : prev.filter(id => id !== service.id)
                            );
                          }}
                          className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-red-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>


              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dropoff Address</div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="same-as-pickup"
                      checked={sameAsPickup}
                      onChange={(e) => {
                        setSameAsPickup(e.target.checked);
                        if (e.target.checked) {
                          setDropoffAddress(pickupBuilding);
                        }
                      }}
                      className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-red-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Same as Pickup address</span>
                  </label>
                  {!sameAsPickup && (
                    <div>
                      <label htmlFor="dropoff-address" className="sr-only">Dropoff Address</label>
                      <input 
                        id="dropoff-address"
                        type="text"
                        value={dropoffAddress} 
                        onChange={(e) => setDropoffAddress(e.target.value)} 
                        placeholder="e.g. Home / Office address for dropoff" 
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Urgency</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label htmlFor="urgency-slider" className="sr-only">Urgency Level</label>
                    <input 
                      id="urgency-slider"
                      type="range" 
                      min={1} 
                      max={3} 
                      value={urgency} 
                      onChange={(e) => setUrgency(Number(e.target.value))} 
                      className="w-full accent-red-500 dark:accent-red-400" 
                    />
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>(48h)</span>
                      <span>(24h)</span>
                      <span>(4-6h)</span>
                    </div>
                  </div>
                  <div className="w-28 text-right">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Selected</div>
                    <div className="mt-1 font-medium text-slate-800 dark:text-slate-200">{urgency === 1 ? "Normal" : urgency === 2 ? "Fast" : "Express"}</div>
                  </div>
                </div>
              </div>

                <div className="pt-2">
                {message && (
                  <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
                    {message}
                  </div>
                )}
                {serverErrors && (
                  <div className="mt-2 text-xs text-red-700 dark:text-red-400">
                    <div className="font-semibold">Server validation errors:</div>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(serverErrors, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </section>          <aside className="w-full md:w-1/3 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 md:p-8 border-l border-slate-100 dark:border-slate-700">
            <div className="sticky top-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Order Summary</h3>
              <div className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">Pickup Location</div>
                  <div className="mt-1 font-medium text-slate-800 dark:text-slate-100">{pickupBuilding || "—"}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">{pickupContact || "No contact provided"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">Dropoff Location</div>
                  <div className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                    {sameAsPickup ? "(Same as pickup)" : dropoffAddress || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">Selected Services</div>
                  <div className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                    {selectedServices.map(id => services.find(s => s.id === id)?.name).filter(Boolean).join(", ") || "No services selected"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">Delivery Speed</div>
                  <div className="mt-1 font-medium text-slate-800 dark:text-slate-100">{urgency === 1 ? "Normal (48h)" : urgency === 2 ? "Fast (24h)" : "Express (4-6h)"}</div>
                </div>
              </div>

              <div className="mt-6 text-xs text-slate-500 dark:text-slate-500">
                Save preferred addresses in your account for faster future orders.
              </div>
            </div>
          </aside>
        </div>

        <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sticky bottom-0">
          <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
            <button 
              onClick={() => {
                setPickupBuilding("");
                setPickupContact("");
                setSelectedServices([]);
                setDropoffAddress("");
                setSameAsPickup(false);
                setUrgency(2);
              }} 
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              Clear All
            </button>
            <button 
              onClick={handleSubmitOrder} 
              disabled={!canSubmitOrder || sending} 
              className="flex-1 max-w-md rounded-lg bg-red-600 text-white py-3 text-sm font-medium disabled:opacity-50 hover:bg-red-700 dark:hover:bg-red-500"
            >
              {sending ? "Processing..." : "Submit Order"}
            </button>
          </div>
        </footer>
      </div>
      </main>
    </RouteGuard>
  );
}
