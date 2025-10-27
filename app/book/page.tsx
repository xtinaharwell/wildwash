"use client";
import React, { useEffect, useState } from "react";

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
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

// near top of file
const PACKAGE_MAP: Record<string, number> = {
  basic: 1,
  standard: 2,
  premium: 3,
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ""; // empty = same origin

import RouteGuard from "../../components/RouteGuard";

export default function Page() {
  const [pickupBuilding, setPickupBuilding] = useState("");
  const [pickupContact, setPickupContact] = useState("");
  // serviceId is number | null
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [services, setServices] = useState<Array<{ id: number; name: string }>>([]);
  const [dropoffAddress, setDropoffAddress] = useState("");

  const [packageType, setPackageType] = useState("standard");
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
          const norm = data.map((s) => ({ ...s, id: Number(s.id) }));
          setServices(norm);
          // set default service id only if not already set
          setServiceId((prev) => {
            if (prev != null) return prev;
            if (norm.length) {
              const v = Number(norm[0].id);
              return Number.isFinite(v) ? v : null;
            }
            return null;
          });
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

  const canRequestPickup = !!pickupBuilding.trim() && !!pickupContact.trim() && serviceId != null;
  const canRequestDropoff = !!dropoffAddress.trim() && serviceId != null;

  async function postOrder(payload: Record<string, any>) {
    resetMessage();
    setSending(true);
    setProgress(10);
    try {
      console.log("Posting order payload:", payload);
      await new Promise((r) => setTimeout(r, 250));
      setProgress(40);

      const csrf = getCookie("csrftoken");

      const res = await fetch(`${API_BASE}/orders/`, {
        method: "POST",
        mode: "cors",
        credentials: "include", // send cookies (sessionid, csrftoken)
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRFToken": csrf } : {}),
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

  async function handleRequestPickup() {
    if (!canRequestPickup) {
      setMessage("Please fill pickup building, contact and choose a service.");
      return;
    }

    const payload = {
      service: Number(serviceId),
      pickup_address: pickupBuilding + (pickupContact ? ` (contact: ${pickupContact})` : ""),
      dropoff_address: dropoffAddress || null,
      urgency: Number(urgency),
      items: 1,
      package: PACKAGE_MAP[packageType], // <-- send integer here
      weight_kg: null,
      price: null,
      estimated_delivery: null,
    };

    await postOrder(payload);
  }

  async function handleRequestDropoff() {
    if (!canRequestDropoff) {
      setMessage("Please add a dropoff address before checking out.");
      return;
    }

    const payload = {
      service: Number(serviceId),
      pickup_address: pickupBuilding || null,
      dropoff_address: dropoffAddress,
      urgency: Number(urgency),
      items: 1,
      package: packageType,
      weight_kg: null,
      price: null,
      estimated_delivery: null,
    };

    await postOrder(payload);
  }

  return (
    <RouteGuard>
      <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white/90 shadow-xl overflow-hidden">
        <div className="md:flex">
          <section className="w-full md:w-2/3 p-6 md:p-8">
            <header className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800">Wild Wash</h1>
                <p className="mt-1 text-sm text-slate-500">Laundry & Cleaning — Pickup and Dropoff</p>
              </div>
              <div className="hidden md:block text-right">
                <div className="text-xs text-slate-500">Progress</div>
                <div className="mt-2 w-40">
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">{progress}%</div>
              </div>
            </header>

            <form className="mt-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-700">Pickup Address</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Building / Street</label>
                    <input value={pickupBuilding} onChange={(e) => setPickupBuilding(e.target.value)} placeholder="e.g. Olive Towers, 4th floor" className="w-full rounded-lg border border-slate-200 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Contact (phone)</label>
                    <input value={pickupContact} onChange={(e) => setPickupContact(e.target.value)} placeholder="e.g. +254 7xx xxx xxx" className="w-full rounded-lg border border-slate-200 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Service</label>
                  {services.length ? (
                    <select
                      value={serviceId ?? ""}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setServiceId(Number.isFinite(n) ? n : null);
                      }}
                      className="w-full rounded-lg border border-slate-200 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      // ensure we never hand NaN to `value`
                      value={Number.isFinite(serviceId as number) ? String(serviceId) : ""}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (raw === "") {
                          setServiceId(null);
                          return;
                        }
                        const n = Number(raw);
                        setServiceId(Number.isFinite(n) ? n : null);
                      }}
                      placeholder="Service ID (e.g. 1)"
                      className="w-full rounded-lg border border-slate-200 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                    />
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRequestPickup}
                    disabled={!canRequestPickup || sending}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-shadow disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
                      canRequestPickup && !sending ? "bg-emerald-500 text-white hover:brightness-95" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Request Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickupBuilding("");
                      setPickupContact("");
                      setServiceId(services.length ? Number(services[0].id) : null);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-slate-50 border border-slate-200 text-slate-700"
                  >
                    Clear
                  </button>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-700">Dropoff Address</legend>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Dropoff address</label>
                  <input value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} placeholder="e.g. Home / Office address for dropoff" className="w-full rounded-lg border border-slate-200 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRequestDropoff}
                    disabled={!canRequestDropoff || sending}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-shadow disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
                      canRequestDropoff && !sending ? "bg-sky-600 text-white hover:brightness-95" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Request Dropoff / Checkout
                  </button>
                  <button type="button" onClick={() => setDropoffAddress("")} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-slate-50 border border-slate-200 text-slate-700">
                    Clear
                  </button>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-700">Pick Package</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[{ id: "basic", title: "Basic", price: "KSh 300" }, { id: "standard", title: "Standard", price: "KSh 500" }, { id: "premium", title: "Premium", price: "KSh 900" }].map((p) => (
                    <label key={p.id} className={`group block cursor-pointer rounded-xl border p-3 text-sm shadow-sm transition-transform hover:-translate-y-0.5 ${packageType === p.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                      <input type="radio" name="package" value={p.id} checked={packageType === p.id} onChange={() => setPackageType(p.id)} className="hidden" />
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">{p.title}</div>
                          <div className="text-xs text-slate-500 mt-1">{p.id === "basic" ? "Quick wash" : p.id === "standard" ? "Wash + Dry" : "Priority handling"}</div>
                        </div>
                        <div className="text-sm font-semibold">{p.price}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-700">Urgency</legend>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input type="range" min={1} max={3} value={urgency} onChange={(e) => setUrgency(Number(e.target.value))} className="w-full" />
                    <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                      <span>Normal (48h)</span>
                      <span>Fast (24h)</span>
                      <span>Express (4-6h)</span>
                    </div>
                  </div>
                  <div className="w-28 text-right">
                    <div className="text-xs text-slate-500">Selected</div>
                    <div className="mt-1 font-medium text-slate-800">{urgency === 1 ? "Normal" : urgency === 2 ? "Fast" : "Express"}</div>
                  </div>
                </div>
              </fieldset>

              <div className="pt-2">
                {message && <div className="rounded-md bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800">{message}</div>}
                {serverErrors && (
                  <div className="mt-2 text-xs text-red-700">
                    <div className="font-semibold">Server validation errors:</div>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(serverErrors, null, 2)}</pre>
                  </div>
                )}
              </div>
            </form>
          </section>

          <aside className="w-full md:w-1/3 bg-gradient-to-b from-sky-50 to-white p-6 md:p-8 border-l border-slate-100">
            <div className="sticky top-6">
              <h3 className="text-sm font-semibold text-slate-700">Summary</h3>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <div>
                  <div className="text-xs text-slate-500">Pickup</div>
                  <div className="mt-1 font-medium text-slate-800">{pickupBuilding || "—"}</div>
                  <div className="text-xs text-slate-500">{pickupContact || "no contact"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Dropoff</div>
                  <div className="mt-1 font-medium text-slate-800">{dropoffAddress || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Package</div>
                  <div className="mt-1 font-medium text-slate-800">{packageType}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Urgency</div>
                  <div className="mt-1 font-medium text-slate-800">{urgency === 1 ? "Normal" : urgency === 2 ? "Fast" : "Express"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Service</div>
                  <div className="mt-1 font-medium text-slate-800">{services.find((s) => s.id === serviceId)?.name ?? (serviceId ? `ID ${serviceId}` : "—")}</div>
                </div>
              </div>

              <div className="mt-6 text-xs text-slate-400">Tip: Save preferred addresses in your account for faster bookings.</div>
            </div>
          </aside>
        </div>

        <footer className="md:hidden border-t bg-white p-3 sticky bottom-0">
          <div className="flex gap-2">
            <button onClick={handleRequestPickup} disabled={!canRequestPickup || sending} className="flex-1 rounded-lg bg-emerald-500 text-white py-2 text-sm font-medium disabled:opacity-50">
              Request Pickup
            </button>
            <button onClick={handleRequestDropoff} disabled={!canRequestDropoff || sending} className="flex-1 rounded-lg bg-sky-600 text-white py-2 text-sm font-medium disabled:opacity-50">
              Request Dropoff
            </button>
          </div>
        </footer>
      </div>
      </main>
    </RouteGuard>
  );
}
