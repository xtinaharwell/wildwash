'use client';

import React, { useState, useEffect } from "react";
import {
  CubeTransparentIcon,
  HomeModernIcon,
  BugAntIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  TrashIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch } from "@/redux/hooks";
import { addToCart } from "@/redux/features/cartSlice";

interface Service {
  id: number;
  name: string;
  category?: string;
  price: number | string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  image_url?: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

function getIconForCategory(category: string) {
  switch (category) {
    case "laundry":
      return CheckBadgeIcon;
    case "duvet":
      return CubeTransparentIcon;
    case "carpet":
      return TrashIcon;
    case "house":
      return HomeModernIcon;
    case "fumigation":
      return BugAntIcon;
    case "installation":
      return WrenchIcon;
    default:
      return CubeTransparentIcon;
  }
}

export default function HomePage() {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedItem, setAddedItem] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/services/`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Failed to load services: ${response.status}`);
        const data = await response.json();
        if (!mounted) return;
        const servicesList = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        const fetched = servicesList.map((s: any) => ({
          id: Number(s.id),
          name: s.name || "",
          category: s.category || "other",
          price: s.price || 0,
          description: s.description || "",
          icon: getIconForCategory(s.category || "other"),
          image_url: s.image_url || null,
        }));
        setServices(fetched);
      } catch (err) {
        console.error("Error fetching services:", err);
        setServices([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchServices();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddToCart = (service: Service) => {
    const { icon, ...cartService } = service as any;
    const finalCartService = { ...cartService, price: String(cartService.price), description: cartService.description || "" };
    dispatch(addToCart(finalCartService));
    
    setAddedItem(service.id);
    setTimeout(() => setAddedItem(null), 600);
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ["laundry", "duvet", "carpet", "house", "fumigation", "installation"];
  const categoryLabels: Record<string, string> = {
    laundry: "Laundry",
    duvet: "Duvet",
    carpet: "Carpet",
    house: "House Cleaning",
    fumigation: "Fumigation",
    installation: "Installation",
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Search */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null
                ? "bg-red-600 text-white shadow-md"
                : "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            All Services
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-red-600 text-white shadow-md"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Spacious grid: 2 columns on mobile, 3 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && (
            <div className="col-span-full text-center py-8">
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading services...</p>
            </div>
          )}

          {!loading && filteredServices.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-sm text-slate-500 dark:text-slate-400">{searchTerm ? "No matches" : "No services"}</p>
            </div>
          )}

          {!loading &&
            filteredServices.map((service) => (
              <article
                key={service.id}
                className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
              >
                {/* Icon/Image */}
                <div className="h-32 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 flex items-center justify-center">
                  {service.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                  ) : service.icon ? (
                    <service.icon className="w-16 h-16 text-red-600 dark:text-red-400" />
                  ) : (
                    <CubeTransparentIcon className="w-16 h-16 text-red-600 dark:text-red-400" />
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 line-clamp-2">{service.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 flex-1">{service.description}</p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      KSh {Number(service.price).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(service)}
                    className={`w-full mt-4 font-medium text-sm rounded-lg transition-all duration-300 transform py-2 ${
                      addedItem === service.id
                        ? "bg-green-500 text-white shadow-lg animate-pulse-bounce"
                        : "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:scale-105 active:scale-95"
                    }`}
                  >
                    {addedItem === service.id ? "✓ Added!" : "Add to Cart"}
                  </button>
                </div>
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}
