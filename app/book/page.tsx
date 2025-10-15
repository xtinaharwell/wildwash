"use client";
import React, { useState } from "react";


export default function Page() {
  const [pickupBuilding, setPickupBuilding] = useState("");
  const [pickupContact, setPickupContact] = useState("");
  const [pickupService, setPickupService] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");

  const [packageType, setPackageType] = useState("standard");
  const [urgency, setUrgency] = useState(2); // 1 = Normal, 2 = Fast, 3 = Express
  const [progress, setProgress] = useState(0); // 0..100
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function resetMessage() {
    setMessage(null);
  }

  const canRequestPickup = pickupBuilding.trim() && pickupContact.trim() && pickupService.trim();
  const canRequestDropoff = dropoffAddress.trim();

  async function handleRequestPickup() {
    resetMessage();
    if (!canRequestPickup) {
      setMessage("Please fill pickup building, contact and service requested.");
      return;
    }
    setSending(true);
    setProgress(20);
    try {
      // simulate progress
      await new Promise((r) => setTimeout(r, 400));
      setProgress(50);

      // replace with your backend endpoint
      await fetch("/api/wild-wash/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "pickup",
          building: pickupBuilding,
          contact: pickupContact,
          service: pickupService,
          package: packageType,
          urgency,
        }),
      });

      setProgress(100);
      setMessage("Pickup requested — driver will contact the pickup contact soon.");
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong — try again.");
    } finally {
      setSending(false);
      setTimeout(() => setProgress(0), 800);
    }
  }

  async function handleRequestDropoff() {
    resetMessage();
    if (!canRequestDropoff) {
      setMessage("Please add a dropoff address before checking out.");
      return;
    }
    setSending(true);
    setProgress(20);
    try {
      await new Promise((r) => setTimeout(r, 400));
      setProgress(50);
      await fetch("/api/wild-wash/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "dropoff",
          address: dropoffAddress,
          package: packageType,
          urgency,
        }),
      });

      setProgress(100);
      setMessage("Dropoff/Checkout requested — thank you for choosing Wild Wash!");
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong during checkout — try again.");
    } finally {
      setSending(false);
      setTimeout(() => setProgress(0), 800);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white/90 shadow-xl overflow-hidden">
        <div className="md:flex">
          {/* Left panel - form */}
          <section className="w-full md:w-2/3 p-6 md:p-8">
            <header className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800">
                  Wild Wash
                </h1>
                <p className="mt-1 text-sm text-slate-500">Laundry & Cleaning — Pickup and Dropoff</p>
              </div>
              <div className="hidden md:block text-right">
                <div className="text-xs text-slate-500">Progress</div>
                <div className="mt-2 w-40">
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
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
                    <input
                      value={pickupBuilding}
                      onChange={(e) => setPickupBuilding(e.target.value)}
                      placeholder="e.g. Olive Towers, 4th floor"
                      className="w-full rounded-lg border border-slate-200 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Contact (phone)</label>
                    <input
                      value={pickupContact}
                      onChange={(e) => setPickupContact(e.target.value)}
                      placeholder="e.g. +254 7xx xxx xxx"
                      className="w-full rounded-lg border border-slate-200 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Service Requested</label>
                  <input
                    value={pickupService}
                    onChange={(e) => setPickupService(e.target.value)}
                    placeholder="e.g. Wash & Fold, Dry Clean, Sofa cleaning"
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRequestPickup}
                    disabled={!canRequestPickup || sending}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-shadow disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
                      canRequestPickup && !sending
                        ? "bg-emerald-500 text-white hover:brightness-95"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Request Pickup
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPickupBuilding("");
                      setPickupContact("");
                      setPickupService("");
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
                  <input
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    placeholder="e.g. Home / Office address for dropoff"
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRequestDropoff}
                    disabled={!canRequestDropoff || sending}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-shadow disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
                      canRequestDropoff && !sending
                        ? "bg-sky-600 text-white hover:brightness-95"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Request Dropoff / Checkout
                  </button>

                  <button
                    type="button"
                    onClick={() => setDropoffAddress("")}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-slate-50 border border-slate-200 text-slate-700"
                  >
                    Clear
                  </button>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-700">Pick Packages</legend>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "basic", title: "Basic", price: "KSh 300" },
                    { id: "standard", title: "Standard", price: "KSh 500" },
                    { id: "premium", title: "Premium", price: "KSh 900" },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`group block cursor-pointer rounded-xl border p-3 text-sm shadow-sm transition-transform hover:-translate-y-0.5 ${
                        packageType === p.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="package"
                        value={p.id}
                        checked={packageType === p.id}
                        onChange={() => setPackageType(p.id)}
                        className="hidden"
                      />
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
                    <input
                      type="range"
                      min={1}
                      max={3}
                      value={urgency}
                      onChange={(e) => setUrgency(Number(e.target.value))}
                      className="w-full"
                    />
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
                {message && (
                  <div className="rounded-md bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800">{message}</div>
                )}
              </div>
            </form>
          </section>

          {/* Right panel - summary / progress / mobile-only header */}
          <aside className="w-full md:w-1/3 bg-gradient-to-b from-sky-50 to-white p-6 md:p-8 border-l border-slate-100">
            <div className="md:hidden mb-4">
              {/* Mobile progress */}
              <div className="text-xs text-slate-500">Progress</div>
              <div className="mt-2 w-full">
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

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
              </div>

              <div className="mt-6">
                <div className="text-xs text-slate-500">Quick actions</div>
                <div className="mt-3 flex flex-col gap-3">
                  <button
                    onClick={() => setProgress((p) => Math.min(100, p + 10))}
                    className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-medium shadow-sm"
                  >
                    + Advance progress
                  </button>

                  <button
                    onClick={() => {
                      setPickupBuilding("");
                      setPickupContact("");
                      setPickupService("");
                      setDropoffAddress("");
                      setPackageType("standard");
                      setUrgency(2);
                      setMessage("Form reset");
                      setTimeout(() => setMessage(null), 1400);
                    }}
                    className="w-full rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-medium shadow-sm"
                  >
                    Reset form
                  </button>
                </div>
              </div>

              <div className="mt-6 text-xs text-slate-400">Tip: Save preferred addresses in your account for faster bookings.</div>
            </div>
          </aside>
        </div>

        {/* Mobile bottom bar */}
        <footer className="md:hidden border-t bg-white p-3 sticky bottom-0">
          <div className="flex gap-2">
            <button
              onClick={handleRequestPickup}
              disabled={!canRequestPickup || sending}
              className="flex-1 rounded-lg bg-emerald-500 text-white py-2 text-sm font-medium disabled:opacity-50"
            >
              Request Pickup
            </button>

            <button
              onClick={handleRequestDropoff}
              disabled={!canRequestDropoff || sending}
              className="flex-1 rounded-lg bg-sky-600 text-white py-2 text-sm font-medium disabled:opacity-50"
            >
              Request Dropoff
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
