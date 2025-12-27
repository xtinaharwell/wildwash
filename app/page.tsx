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
  SparklesIcon,
  ArrowTrendingUpIcon,
  Squares2X2Icon,
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
      return SparklesIcon;
  }
}

export default function HomePage() {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedItem, setAddedItem] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {/* Search Section with floating effect */}
        <div className={`sticky top-24 z-10 mb-10 transition-all duration-300 ${
          isScrolled ? 'scale-[0.98] opacity-95' : 'scale-100 opacity-100'
        }`}>
          <div className="max-w-xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-500 rounded-full blur opacity-20 group-hover:opacity-30 transition duration-500" />
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-base border-0 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories - Minimal horizontal scroll */}
        <div className="mb-12">
          <h2 className="text-xl font-light text-slate-900 dark:text-slate-100 mb-4">
            Categories
          </h2>
          
          <div className="flex space-x-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-300 ${
                selectedCategory === null
                  ? "bg-gradient-to-br from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/40"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:shadow-md border border-slate-200 dark:border-slate-700"
              }`}
              title="View all services"
            >
              <Squares2X2Icon className={`w-5 h-5 mb-1 ${
                selectedCategory === null ? "text-white" : "text-red-500 dark:text-red-400"
              }`} />
              <span className="text-xs font-medium whitespace-nowrap">
                All
              </span>
            </button>
            {categories.map((cat) => {
              const Icon = getIconForCategory(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-300 ${
                    selectedCategory === cat
                      ? "bg-gradient-to-br from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/40"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:shadow-md border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${
                    selectedCategory === cat ? "text-white" : "text-red-500 dark:text-red-400"
                  }`} />
                  <span className="text-xs font-medium text-center">
                    {categoryLabels[cat]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Services Grid */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100">
              Services
              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                ({filteredServices.length})
              </span>
            </h2>
            
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
              >
                Clear filter
                <ArrowTrendingUpIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-900/50 animate-pulse"
                >
                  <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-t-2xl" />
                  <div className="p-6">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full mb-3" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full mb-2" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full mb-4" />
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 flex items-center justify-center">
                <MagnifyingGlassIcon className="w-12 h-12 text-red-400 dark:text-red-500" />
              </div>
              <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-2">
                No services found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {searchTerm 
                  ? `No matches for "${searchTerm}". Try a different search term.`
                  : "No services available at the moment."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="group relative"
                >
                  {/* Background glow effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-red-600 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
                  
                  <div className="relative rounded-2xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    {/* Image/Icon Header */}
                    <div className="relative h-32 sm:h-40 lg:h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {service.icon ? (
                            <service.icon className="w-20 h-20 text-red-500 dark:text-red-400 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                          ) : (
                            <SparklesIcon className="w-20 h-20 text-red-500 dark:text-red-400 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                          )}
                        </div>
                      )}

                      {/* Category badge */}
                      {service.category && (
                        <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4">
                          <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-red-700 dark:text-red-300 shadow-sm">
                            {categoryLabels[service.category] || service.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4 lg:p-6">
                      <h3 className="text-sm sm:text-base lg:text-lg font-medium text-slate-900 dark:text-slate-100 mb-2 line-clamp-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {service.name}
                      </h3>
                      
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div>
                          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400">
                            KSh {Number(service.price).toLocaleString()}
                          </div>
                        </div>
                        

                      </div>

                      <button
                        onClick={() => handleAddToCart(service)}
                        className={`w-full py-2 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 ${
                          addedItem === service.id
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg animate-pulse"
                            : "bg-gradient-to-r from-red-600 to-orange-500 text-white hover:shadow-lg hover:shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98]"
                        }`}
                      >
                        {addedItem === service.id ? "✓ Added to Cart" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

