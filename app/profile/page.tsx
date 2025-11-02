"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import RouteGuard from "@/components/RouteGuard";
import type { RootState } from "@/redux/store";
import { client } from "@/lib/api/client";
import { Spinner } from "@/components";

type UserProfile = {
  id: number;
  username: string;
  phone: string;
  first_name: string;
  last_name: string;
  location: string;
}

type Offer = {
  id: number;
  title: string;
  description: string;
  discount_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

type UserOffer = {
  id: number;
  offer: Offer;
  claimed_at: string;
  is_used: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [userOffers, setUserOffers] = useState<UserOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);
  
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchProfile();
    fetchUserOffers();
  }, [isAuthenticated, router]);

  const fetchUserOffers = async () => {
    setLoadingOffers(true);
    setOffersError(null);
    try {
      const data = await client.get('/offers/user-offers');
      setUserOffers(data);
    } catch (err: any) {
      setOffersError(err.message || "Failed to load offers");
    } finally {
      setLoadingOffers(false);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.get('/users/me/');
      setProfile(data);
      setFormData(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const data = await client.patch('/users/me/', formData);
      setProfile(data);
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
        <div className="max-w-2xl mx-auto px-4 flex justify-center">
          <Spinner className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold">Your Profile</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Manage your personal information and preferences.
            </p>
          </header>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="w-full rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="w-full rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="w-full rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="w-full rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="w-full rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-slate-800">
                {editMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(profile || {});
                        setEditMode(false);
                      }}
                      disabled={saving}
                      className="px-4 py-2 text-sm rounded-md border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <span className="inline-flex items-center">
                          <Spinner className="h-4 w-4 text-white -ml-1 mr-2" />
                          Saving...
                        </span>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-500"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="mt-8">
            <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Your Claimed Offers</h2>
                <button
                  onClick={fetchUserOffers}
                  disabled={loadingOffers}
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  {loadingOffers ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {offersError && (
                <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                  {offersError}
                </div>
              )}

              {loadingOffers ? (
                <div className="flex justify-center py-8">
                  <Spinner className="w-6 h-6" />
                </div>
              ) : userOffers.length > 0 ? (
                <div className="space-y-3">
                  {userOffers.map((userOffer) => (
                    <div
                      key={userOffer.id}
                      className="p-4 rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{userOffer.offer.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {userOffer.offer.description}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Claimed on: {new Date(userOffer.claimed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-bold text-red-600">
                            {userOffer.offer.discount_amount}% OFF
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full mt-1 ${
                            userOffer.is_used
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          }`}>
                            {userOffer.is_used ? 'Used' : 'Available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <p>You haven't claimed any offers yet.</p>
                  <a
                    href="/offers"
                    className="inline-block mt-2 text-sm text-red-600 hover:text-red-500"
                  >
                    Browse Available Offers
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <BNPLManager />
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}

import BNPLManager from '@/components/BNPLManager';