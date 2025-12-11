'use client';

import React, { useState, useEffect } from "react";
import {
  SparklesIcon,
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
  icon?: React.ComponentType<{ className: string }>;
  image_url?: string | null;
  image?: string | null;
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

        const servicesList = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
        
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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Professional Cleaning Services
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            From laundry to fumigation, we've got you covered
          </p>
        </div>

        {/* Search */}
        <div className="mb-12 max-w-md mx-auto">
            <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                />
            </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          {!loading && filteredServices.map((service) => (
            <article
              key={service.id}
              className="group relative rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:border-red-300 dark:hover:border-red-700 transition-all duration-300"
            >
              {/* Icon/Image Area */}
              <div className="relative h-40 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 flex items-center justify-center overflow-hidden">
                {service.image_url ? (
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : service.icon ? (
                  <service.icon className="w-20 h-20 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-300" />
                ) : null}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {service.name}
                </h3>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                  {service.description}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    KSh {Number(service.price).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => handleAddToCart(service)}
                  className="w-full mt-4 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 active:scale-95 transition-all duration-150"
                >
                  Add to Cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
