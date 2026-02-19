'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CubeTransparentIcon,
  HomeModernIcon,
  BugAntIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  TrashIcon,
  WrenchIcon,
  SparklesIcon,
  XMarkIcon,
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

// Map service names to image files with intelligent fallback
const serviceImageMap: Record<string, string> = {
  "Standard Wash": "Standard Wash.png",
  "Express Wash": "Express Wash.png",
  "Dry Cleaning": "Dry Cleaning.png",
  "Duvet Cleaning": "Duvet Cleaning.png",
  "Carpet Cleaning": "Carpet Cleaning.png",
  "Ironing Service": "Ironing Service.png",
  "Bedsitter Fumigation": "Bedsitter Fumigation.png",
};

function getImageForService(serviceName: string): string {
  // First, try exact match
  if (serviceImageMap[serviceName]) {
    return serviceImageMap[serviceName];
  }

  // If no exact match, find closest match by keyword
  const nameLower = serviceName.toLowerCase();
  
  if (nameLower.includes("fumigation") || nameLower.includes("bedsitter")) {
    return "Bedsitter Fumigation.png";
  }
  if (nameLower.includes("carpet")) {
    return "Carpet Cleaning.png";
  }
  if (nameLower.includes("duvet")) {
    return "Duvet Cleaning.png";
  }
  if (nameLower.includes("iron")) {
    return "Ironing Service.png";
  }
  if (nameLower.includes("dry") || nameLower.includes("dryclean")) {
    return "Dry Cleaning.png";
  }
  if (nameLower.includes("express")) {
    return "Express Wash.png";
  }
  if (nameLower.includes("wash") || nameLower.includes("laundry")) {
    return "Standard Wash.png";
  }
  
  return "Standard Wash.png";
}

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
          image_url: getImageForService(s.name) ? `/images/${getImageForService(s.name)}` : (s.image_url || null),
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
    setTimeout(() => setAddedItem(null), 800);
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
    house: "Cleaning",
    fumigation: "Fumigation",
    installation: "Install",
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-50">
      <div className="max-w-6xl mx-auto px-5 pt-6 pb-24">
        
        {/* Search bar */}
        <div className="mb-12 flex justify-center">
          <div className="relative w-full max-w-md">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search services"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-base border border-slate-200 dark:border-slate-800 rounded-full bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-red-600 transition-ring"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-10">
          <div className="flex items-center gap-2 overflow-x-auto py-2 -mx-5 px-5 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-500 transition-all whitespace-nowrap ${
                selectedCategory === null
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-500 transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-red-600 text-white"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-lg font-600 text-slate-900 dark:text-slate-50">
            {selectedCategory ? categoryLabels[selectedCategory] : "All Services"}
            <span className="text-slate-500 dark:text-slate-400 font-400 ml-2">
              {filteredServices.length}
            </span>
          </h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Services grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-100 dark:bg-slate-900 rounded-2xl h-56 animate-pulse"
              />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              <MagnifyingGlassIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-600 text-slate-900 dark:text-slate-100 mb-2">
              No services found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm 
                ? `Try a different search term.`
                : "Check back soon."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.id}`}
                className="group"
              >
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full flex flex-col cursor-pointer">
                  {/* Image/Icon area */}
                  <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-950 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 rounded-t-2xl">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        {service.icon ? (
                          <service.icon className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-1" />
                        ) : (
                          <SparklesIcon className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-1" />
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-500 font-500">
                          {categoryLabels[service.category || ""] || service.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-600 text-slate-900 dark:text-slate-100 mb-1 line-clamp-2">
                      {service.name}
                    </h3>
                    
                    {service.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-500 mb-3 line-clamp-1">
                        {service.description}
                      </p>
                    )}

                    <div className="flex items-baseline justify-between mb-3 mt-auto">
                      <div className="text-base font-600 text-slate-900 dark:text-slate-100">
                        KSh {Number(service.price).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCart(service);
                      }}
                      className={`w-full py-2 rounded-lg font-500 text-sm transition-all ${
                        addedItem === service.id
                          ? "bg-green-500 text-white"
                          : "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]"
                      }`}
                    >
                      {addedItem === service.id ? "Added" : "Add"}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

