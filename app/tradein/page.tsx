'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Recycle, Plus, AlertCircle, Loader2, Check, Clock, XCircle } from 'lucide-react';

interface TradeIn {
  id: number;
  description: string;
  estimated_price: string | number;
  contact_phone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  description: string;
  estimated_price: string;
  contact_phone: string;
}

export default function TradeInPage() {
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [loadingTradeIns, setLoadingTradeIns] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [userPhone, setUserPhone] = useState('');

  const [formData, setFormData] = useState<FormData>({
    description: '',
    estimated_price: '',
    contact_phone: '',
  });

  // Fetch user phone on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let token = null;
        if (typeof window !== 'undefined') {
          const authState = localStorage.getItem('wildwash_auth_state');
          if (authState) {
            try {
              const parsed = JSON.parse(authState);
              token = parsed.token;
            } catch (e) {
              console.error('Error parsing auth state:', e);
            }
          }
        }

        const apiBase = process.env.NEXT_PUBLIC_API_BASE;
        if (!apiBase) {
          throw new Error('API endpoint not configured');
        }

        const response = await axios.get(`${apiBase}/users/me/`, {
          headers: {
            ...(token && { 'Authorization': `Token ${token}` }),
          },
        });

        setUserPhone(response.data.phone || '');
        setFormData(prev => ({
          ...prev,
          contact_phone: response.data.phone || '',
        }));
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, []);

  // Fetch trade-ins
  useEffect(() => {
    const fetchTradeIns = async () => {
      setLoadingTradeIns(true);
      setError('');
      try {
        let token = null;
        if (typeof window !== 'undefined') {
          const authState = localStorage.getItem('wildwash_auth_state');
          if (authState) {
            try {
              const parsed = JSON.parse(authState);
              token = parsed.token;
            } catch (e) {
              console.error('Error parsing auth state:', e);
            }
          }
        }

        const apiBase = process.env.NEXT_PUBLIC_API_BASE;
        if (!apiBase) {
          throw new Error('API endpoint not configured');
        }

        const response = await axios.get(`${apiBase}/payments/tradein/`, {
          headers: {
            ...(token && { 'Authorization': `Token ${token}` }),
          },
        });

        const list = Array.isArray(response.data) ? response.data : response.data.results || [];
        setTradeIns(list);
      } catch (err: any) {
        console.error('Error fetching trade-ins:', err);
        setError(err?.response?.data?.detail || 'Failed to load trade-ins');
      } finally {
        setLoadingTradeIns(false);
      }
    };

    fetchTradeIns();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingForm(true);

    try {
      if (!formData.description || !formData.estimated_price || !formData.contact_phone) {
        setError('Please fill in all fields');
        setLoadingForm(false);
        return;
      }

      let token = null;
      if (typeof window !== 'undefined') {
        const authState = localStorage.getItem('wildwash_auth_state');
        if (authState) {
          try {
            const parsed = JSON.parse(authState);
            token = parsed.token;
          } catch (e) {
            console.error('Error parsing auth state:', e);
          }
        }
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE;
      if (!apiBase) {
        throw new Error('API endpoint not configured');
      }

      const response = await axios.post(
        `${apiBase}/payments/tradein/`,
        {
          description: formData.description,
          estimated_price: parseFloat(formData.estimated_price),
          contact_phone: formData.contact_phone,
        },
        {
          headers: {
            ...(token && { 'Authorization': `Token ${token}` }),
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setSuccess('Trade-in submitted successfully! Our team will contact you soon.');
        setFormData({
          description: '',
          estimated_price: '',
          contact_phone: userPhone,
        });
        setShowForm(false);

        // Refresh trade-ins list
        const updatedResponse = await axios.get(`${apiBase}/payments/tradein/`, {
          headers: {
            ...(token && { 'Authorization': `Token ${token}` }),
          },
        });
        const list = Array.isArray(updatedResponse.data) ? updatedResponse.data : updatedResponse.data.results || [];
        setTradeIns(list);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to submit trade-in. Please try again.';
      setError(errorMessage);
    } finally {
      setLoadingForm(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending Review
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-medium">
            <Check className="w-3 h-3" />
            Approved
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Rejected
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400 rounded-full text-xs font-medium">
            {status}
          </div>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Recycle className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold">Trade-In Management</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-full transition-all"
          >
            <Plus className="w-5 h-5" />
            New Trade-In
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 dark:text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* New Trade-In Form */}
        {showForm && (
          <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
            <h2 className="text-xl font-bold mb-6">Submit a New Trade-In</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Item Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the item you want to trade in (brand, model, condition, defects, etc.)"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                  rows={4}
                  disabled={loadingForm}
                />
              </div>

              {/* Estimated Price */}
              <div>
                <label htmlFor="estimated_price" className="block text-sm font-medium mb-2">
                  Estimated Price (KES) *
                </label>
                <input
                  type="number"
                  id="estimated_price"
                  name="estimated_price"
                  value={formData.estimated_price}
                  onChange={handleInputChange}
                  placeholder="e.g., 5000"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                  disabled={loadingForm}
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  id="contact_phone"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  placeholder="e.g., 254712345678 or 0712345678"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                  disabled={loadingForm}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loadingForm}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2"
                >
                  {loadingForm ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Recycle className="w-5 h-5" />
                      Submit Trade-In
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={loadingForm}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-semibold py-3 px-4 rounded-full transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Trade-Ins List */}
        <div>
          <h2 className="text-xl font-bold mb-6">Your Trade-Ins</h2>

          {loadingTradeIns ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : tradeIns.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
              <Recycle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No trade-ins yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Start by submitting your first trade-in to get credit towards your next purchase.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-full transition-all"
              >
                <Plus className="w-5 h-5" />
                Submit Trade-In
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tradeIns.map((tradeIn) => (
                <div
                  key={tradeIn.id}
                  className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-shadow"
                >
                  {/* Header with Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        Trade-In #{tradeIn.id}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Submitted: {formatDate(tradeIn.created_at)}
                      </p>
                    </div>
                    {getStatusBadge(tradeIn.status)}
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {tradeIn.description}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Estimated Price
                      </p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        KES {parseFloat(String(tradeIn.estimated_price)).toLocaleString('en-KE')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Contact
                      </p>
                      <p className="text-sm text-slate-900 dark:text-slate-100">
                        {tradeIn.contact_phone}
                      </p>
                    </div>
                  </div>

                  {/* Last Updated */}
                  {tradeIn.updated_at !== tradeIn.created_at && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Last updated: {formatDate(tradeIn.updated_at)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-12 p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
            How Trade-In Works
          </h3>
          <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-2">
            <li>✓ Submit details of the item you want to trade in</li>
            <li>✓ Our team will review and contact you for inspection</li>
            <li>✓ Once approved, you'll get credit towards your next purchase</li>
            <li>✓ The credit can be used immediately or saved for later</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
