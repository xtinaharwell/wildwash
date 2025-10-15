"use client"

import React, { useState } from "react";
import { ChevronDownIcon, BellIcon } from "@heroicons/react/24/outline";

export default function ServicesPage() {
  const [open, setOpen] = useState<string | null>(null);
  const [notif, setNotif] = useState({ push: true, sms: false, email: false });
  const [sent, setSent] = useState<string | null>(null);

  const toggle = (id: string) => setOpen((o) => (o === id ? null : id));

  const packages: Record<string, Array<{ id: string; title: string; price: string; features: string[] }>> = {
    laundry: [
      { id: "laundry-basic", title: "Basic (Quick Wash)", price: "KSh 250/kg", features: ["Wash & dry", "Light press", "48h turnaround"] },
      { id: "laundry-standard", title: "Standard (Wash + Fold)", price: "KSh 400/kg", features: ["Gentle detergent", "Folded neatly", "24h turnaround"] },
      { id: "laundry-premium", title: "Premium (Delicate & Care)", price: "KSh 700/kg", features: ["Hand-wash option", "Stain treatment", "Priority handling"] },
    ],

    duvet: [
      { id: "duvet-basic", title: "Duvet Refresh", price: "KSh 1,800", features: ["Shallow wash", "Quick dry", "Antibacterial rinse"] },
      { id: "duvet-deep", title: "Deep Duvet Clean", price: "KSh 3,200", features: ["Deep cleaning", "Steam sanitise", "Restorative care"] },
    ],

    carpet: [
      { id: "carpet-spot", title: "Spot Clean", price: "From KSh 600/room", features: ["Targeted stain removal", "Fast dry"] },
      { id: "carpet-deep", title: "Deep Steam Clean", price: "From KSh 1,500/room", features: ["Hot water extraction", "Odour removal", "Mould prevention"] },
    ],

    house: [
      { id: "house-standard", title: "Standard House Clean", price: "From KSh 2,500", features: ["Dusting & sweeping", "Kitchen & bathroom", "2 cleaners - 3hrs"] },
      { id: "house-deep", title: "Deep Clean", price: "From KSh 5,500", features: ["Under-furniture clean", "Carpet/chip cleaning", "Sanitisation"] },
    ],

    fumigation: [
      { id: "fumig-basic", title: "Home Treatment", price: "From KSh 2,000", features: ["Safe pesticides", "Follow-up visit option"] },
      { id: "fumig-pro", title: "Certified Fumigation", price: "From KSh 6,000", features: ["Commercial grade", "Certification & report"] },
    ],

    misc: [
      { id: "tv-mount-std", title: "TV Mounting", price: "From KSh 1,200", features: ["Secure mount", "Cable concealment", "Wall suitability check"] },
      { id: "hotshower-install", title: "Hot Shower Installation", price: "From KSh 3,500", features: ["Electric/gas options", "Safety check", "Testing & demo"] },
    ],
  };

  function simulateNotify() {
    setSent(null);
    // pseudo send
    setTimeout(() => setSent(`Rider notified via: ${Object.entries(notif)
      .filter(([,v]) => v)
      .map(([k]) => k.toUpperCase())
      .join(", ") || "none"}`), 700);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 p-6 md:p-12 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold">Services — What we offer</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Choose a service category to see our packages and typical pricing. Tap a package to expand details and request it from the booking flow.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Service list */}
          {Object.entries(packages).map(([key, list]) => (
            <section key={key} className="rounded-2xl bg-white/70 dark:bg-white/5 p-4 shadow">
              <h2 className="text-xl font-semibold capitalize">{key === 'misc' ? 'TV & Install' : key}</h2>
              <p className="text-sm text-slate-500 mt-1">{getBlurb(key)}</p>

              <div className="mt-4 space-y-3">
                {list.map((p) => (
                  <article key={p.id} className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                    <button
                      aria-expanded={open === p.id}
                      onClick={() => toggle(p.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    >
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-sm text-slate-500 mt-1">{p.price}</div>
                      </div>
                      <ChevronDownIcon className={`w-5 h-5 transition-transform ${open === p.id ? 'rotate-180' : 'rotate-0'}`} />
                    </button>

                    <div className={`${open === p.id ? 'max-h-96 p-4' : 'max-h-0 p-0'} transition-[max-height,padding] duration-300 overflow-hidden bg-white/50 dark:bg-white/3`}> 
                      <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300">
                        {p.features.map((f, i) => (<li key={i}>{f}</li>))}
                      </ul>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-slate-600">Estimated time: <span className="font-semibold">{getETA(key)}</span></div>
                        <a href="/book" className="ml-3 inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-md text-sm font-medium">Request</a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Outputs & Rider notifications */}
        <section className="mt-8 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
          <h3 className="text-xl font-semibold flex items-center gap-2"><BellIcon className="w-5 h-5 text-emerald-600"/> Rider notifications & outputs</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">When a pickup or delivery is requested, Wild Wash generates the following outputs and notifies the rider with the selected channels.</p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold">Outputs</h4>
              <ul className="mt-2 list-disc list-inside text-sm text-slate-700 dark:text-slate-300">
                <li>Order receipt (PDF) with itemised pricing</li>
                <li>Unique tracking code (e.g. WW-12345)</li>
                <li>Estimated pickup/delivery ETA</li>
                <li>Item-level photos & audit log</li>
                <li>Service certificate (for fumigation)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Notify rider via</h4>
              <div className="mt-2 flex flex-col gap-2">
                <label className="inline-flex items-center gap-3">
                  <input type="checkbox" checked={notif.push} onChange={() => setNotif((s) => ({ ...s, push: !s.push }))} className="w-4 h-4" />
                  <span className="text-sm">Push notification (app)</span>
                </label>

                <label className="inline-flex items-center gap-3">
                  <input type="checkbox" checked={notif.sms} onChange={() => setNotif((s) => ({ ...s, sms: !s.sms }))} className="w-4 h-4" />
                  <span className="text-sm">SMS message</span>
                </label>

                <label className="inline-flex items-center gap-3">
                  <input type="checkbox" checked={notif.email} onChange={() => setNotif((s) => ({ ...s, email: !s.email }))} className="w-4 h-4" />
                  <span className="text-sm">Email</span>
                </label>

                <div className="mt-3 flex items-center gap-3">
                  <button onClick={simulateNotify} className="rounded-md bg-emerald-600 text-white px-4 py-2">Simulate notify</button>
                  {sent && <div className="text-sm text-slate-600">{sent}</div>}
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-8 text-sm text-slate-600 dark:text-slate-400">Tip: Use the Request button on any package to start a booking — it will prefill the service and package in the booking flow.</footer>
      </div>
    </div>
  );
}

/* --- Helpers --- */
function getBlurb(key: string){
  switch(key){
    case 'laundry': return 'Wash, dry, fold and special-care options for everyday clothes and delicate items.';
    case 'duvet': return 'Specialised cleaning for duvets, blankets and larger bedding items with careful drying.';
    case 'carpet': return 'Carpet and rug cleaning — from spot treatment to full steam extraction.';
    case 'house': return 'House cleaning packages: standard, deep and move-in/move-out options.';
    case 'fumigation': return 'Certified fumigation services for homes and businesses.';
    case 'misc': return 'TV mounting and hot-shower installation done by trained technicians.';
    default: return '';
  }
}

function getETA(key: string){
  switch(key){
    case 'laundry': return '24–48h';
    case 'duvet': return '48–72h';
    case 'carpet': return '24–48h (room dependent)';
    case 'house': return '2–4 hrs';
    case 'fumigation': return 'Same-day / scheduled';
    case 'misc': return 'Same-day / next-day';
    default: return 'Varies';
  }
}
