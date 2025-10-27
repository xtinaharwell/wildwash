"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import RouteGuard from "@/components/RouteGuard";
import type { RootState } from "@/redux/store";
import { client } from "@/lib/api/client";

type UserProfile = {
  id: number;
  username: string;
  phone: string;
  first_name: string;
  last_name: string;
  location: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchProfile();
  }, [isAuthenticated, router]);

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
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
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
                      {saving ? "Saving..." : "Save Changes"}
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
        </div>
      </div>
    </RouteGuard>
  );
}