'use client';

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckBadgeIcon,
  SparklesIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch } from "@/redux/hooks";
import { addToCart } from "@/redux/features/cartSlice";

interface Service {
  id: number;
  name: string;
  category?: string;
  price: number | string;
  description?: string;
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

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/services/${serviceId}/`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Service not found`);
        const data = await response.json();
        // Add image URL if available
        const serviceWithImage = {
          ...data,
          image_url: getImageForService(data.name) ? `/images/${getImageForService(data.name)}` : (data.image_url || null),
        };
        setService(serviceWithImage);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load service");
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [serviceId]);

  const handleAddToCart = () => {
    if (!service) return;
    
    dispatch(
      addToCart({
        id: service.id,
        name: service.name,
        price: String(service.price),
        category: service.category || "other",
        description: service.description || "",
      })
    );
    
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-50">
        <div className="max-w-2xl mx-auto px-5 pt-6 pb-24">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>
          <div className="space-y-4">
            <div className="h-[500px] bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
            <div className="h-6 bg-slate-100 dark:bg-slate-900 rounded-lg animate-pulse w-3/4" />
            <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-lg animate-pulse" />
            <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-lg animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-50">
        <div className="max-w-2xl mx-auto px-5 pt-6 pb-24">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>
          <div className="text-center py-20">
            <h2 className="text-2xl font-600 text-slate-900 dark:text-slate-100 mb-3">
              Service not found
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {error || "The service you're looking for doesn't exist."}
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-red-600 text-white px-6 py-2 rounded-full font-500 hover:bg-red-700 transition-colors"
            >
              Return to Services
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-50">
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-24">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition-colors mb-8"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </button>

        {/* Service image/icon */}
        <div className="w-full h-[500px] bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-950 rounded-2xl flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-800 overflow-hidden">
          {service.image_url ? (
            <img
              src={service.image_url}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center">
              <SparklesIcon className="w-24 h-24 text-slate-400 dark:text-slate-600 mb-3" />
              <span className="text-slate-500 dark:text-slate-500 text-sm font-500">
                {service.category || "Service"}
              </span>
            </div>
          )}
        </div>

        {/* Service details */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-700 text-slate-900 dark:text-slate-50 mb-2">
                {service.name}
              </h1>
              {service.category && (
                <span className="inline-block px-3 py-1 text-xs font-500 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  {service.category}
                </span>
              )}
            </div>
            <div className="text-2xl font-700 text-red-600 dark:text-red-500 whitespace-nowrap">
              KSh {Number(service.price).toLocaleString()}
            </div>
          </div>

          {service.description && (
            <div className="mt-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {service.description}
              </p>
            </div>
          )}

          {/* Features */}
          <div className="mb-6">
            <h2 className="text-base font-600 text-slate-900 dark:text-slate-100 mb-3">
              What's included
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckBadgeIcon className="w-4 h-4 text-red-600 dark:text-red-500 flex-shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Professional service
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckBadgeIcon className="w-4 h-4 text-red-600 dark:text-red-500 flex-shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Quality guaranteed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckBadgeIcon className="w-4 h-4 text-red-600 dark:text-red-500 flex-shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Fast delivery
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          className={`w-full py-4 px-6 rounded-full font-600 text-base transition-all flex items-center justify-center gap-2 ${
            addedToCart
              ? "bg-green-500 text-white"
              : "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]"
          }`}
        >
          <ShoppingCartIcon className="w-5 h-5" />
          {addedToCart ? "Added to cart" : "Add to cart"}
        </button>

        {/* Back to services link */}
        <button
          onClick={() => router.push("/")}
          className="w-full mt-3 py-3 px-6 rounded-full font-500 text-base text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-slate-200 dark:border-slate-800"
        >
          Continue shopping
        </button>
      </div>
    </div>
  );
}
