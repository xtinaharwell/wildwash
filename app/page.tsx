'use client';

import React, { useState, useEffect } from "react";
import {
  SparklesIcon,
  CubeTransparentIcon,
  HomeModernIcon,
  BugAntIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch } from "@/redux/hooks";
import { addToCart } from "@/redux/features/cartSlice";

interface Service {
  id: number;
  name: string;
  category?: string;
  price: number | string;
  description?: string;
  icon?: React.ComponentType<{ className: string }>;
  image_url?: string | null;
  image?: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

const fallbackServices: Service[] = [];

function getIconForCategory(category: string) {
    switch (category) {
        case "laundry":
            return SparklesIcon;
        case "duvet":
            return CubeTransparentIcon;
        case "carpet":
        case "house":
            return HomeModernIcon;
        case "fumigation":
            return BugAntIcon;
        default:
            return CubeTransparentIcon; // A sensible default
    }
}

export default function HomePage() {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/services/`, { 
          credentials: "include",
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load services: ${response.status}`);
        }

        const data = await response.json();
        
        if (!mounted) return;

        // Handle both array and paginated response
        const servicesList = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
        
        if (servicesList.length === 0) {
          console.warn("No services returned from backend");
          setServices([]);
          return;
        }

        const fetchedServices = servicesList.map((s: any) => ({
          id: Number(s.id),
          name: s.name || '',
          category: s.category || 'other',
          price: s.price || 0,
          description: s.description || '',
          icon: getIconForCategory(s.category || 'other'),
          image_url: s.image_url || null,
          image: s.image || null
        }));

        setServices(fetchedServices);
      } catch (err) {
        console.error("Error fetching services:", err);
        setServices([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchServices();
    return () => { mounted = false; };
  }, []);

  const handleAddToCart = (service: Service) => {
    // Convert price to string and ensure description is defined for cart
    // Remove icon (React component) before storing in Redux
    const { icon, ...cartService } = service;
    const finalCartService = {
      ...cartService,
      price: String(cartService.price),
      description: cartService.description || ''
    };
    dispatch(addToCart(finalCartService));
    console.log(`${service.name} added to cart`);
  };

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grouped = groupByCategory(filteredServices);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


        <div className="mb-12 max-w-lg mx-auto">
            <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search for laundry, cleaning, fumigation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-transparent rounded-full bg-white/70 dark:bg-slate-800/50 shadow-md focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none transition-all duration-300"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {loading && (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">Loading services...</p>
            </div>
          )}
          {!loading && filteredServices.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                {searchTerm ? "No services match your search" : "No services available"}
              </p>
            </div>
          )}
          {!loading && Object.entries(grouped).map(([category, list]) => (
            <section
              key={category}
              className="rounded-3xl bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl shadow-xl border border-white/20 dark:border-slate-800/50 overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 capitalize">
                  {categoryLabel(category)}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                  {getBlurb(category)}
                </p>

                <div className="mt-6 space-y-4">
                  {list.map((s) => (
                    <article
                      key={s.id}
                      className="rounded-2xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                    >
                      {s.image_url && (
                        <div className="relative w-full h-40 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
                          <img
                            src={s.image_url}
                            alt={s.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-5">
                          <div className="flex items-start gap-4">
                              {!s.image_url && s.icon && (
                                <div className="flex-shrink-0">
                                    <s.icon className="w-12 h-12 text-red-500" />
                                </div>
                              )}
                              <div className="flex-1">
                                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{s.name}</h3>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                      <span className="font-semibold text-red-600 dark:text-red-400">KSh {s.price}</span>
                                      <span className="mx-2">·</span>
                                      <span>ETA: {getETA(s.category)}</span>
                                  </p>
                              </div>
                          </div>
                          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{s.description}</p>
                          <div className="mt-5 text-center">
                              <button
                                  onClick={() => handleAddToCart(s)}
                                  className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 active:scale-95 transition-all duration-150"
                              >
                                  Add to Cart
                              </button>
                          </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Helpers --- */
function groupByCategory(services: Service[]) {
  return services.reduce((acc, s) => {
    const category = s.category || 'other';
    acc[category] = acc[category] || [];
    acc[category].push(s);
    return acc;
  }, {} as Record<string, Service[]>);
}

function categoryLabel(key: string | undefined) {
  switch (key) {
    case "laundry":
      return "Laundry";
    case "duvet":
      return "Duvet Cleaning";
    case "carpet":
      return "Carpet Cleaning";
    case "house":
      return "House Cleaning";
    case "fumigation":
      return "Fumigation";
    case "installation":
      return "TV Mounting & Hot Shower Installation";
    default:
      return key || "Other";
  }
}

function getBlurb(key: string | undefined) {
  switch (key) {
    case "laundry":
      return "Wash, dry, fold, and special-care options for everyday clothes.";
    case "duvet":
      return "Cleaning for duvets, blankets, and bedding.";
    case "carpet":
      return "Spot or full carpet cleaning with steam options.";
    case "house":
      return "Standard and deep cleaning for homes.";
    case "fumigation":
      return "Certified pest control and sanitisation.";
    case "installation":
      return "Mounting and installation services.";
    default:
      return "";
  }
}

function getETA(key: string | undefined) {
  switch (key) {
    case "laundry":
      return "24–48h";
    case "duvet":
      return "48–72h";
    case "carpet":
      return "24–48h";
    case "house":
      return "2–4 hrs";
    case "fumigation":
      return "Same-day";
    case "installation":
      return "Same-day / next-day";
    default:
      return "Varies";
  }
}
