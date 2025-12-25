"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { client } from "@/lib/api/client";
import RouteGuard from "../../components/RouteGuard";

type Order = {
  id: number;
  code: string;
  created_at: string;
  status: string;
  price: string | number;
  actual_price?: string | number;
  total_price?: string | number;
  services_list?: Array<{id: number; name: string; price: string | number}>;
};

type LoanRequest = {
  order_id: number;
  loan_amount: number;
  duration_days: number;
  purpose: string;
};

type Collateral = {
  id: string;
  type: string; // 'order', 'property', 'vehicle', 'equipment', 'other'
  description: string;
  estimatedValue: number;
};

type Guarantor = {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  relationship: string;
};

export default function BorrowPage(): React.JSX.Element {
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Wizard step state: 'choose-type' | 'select' | 'review-terms' | 'add-collateral' | 'add-guarantor' | 'loan-details' | 'review'
  const [wizardStep, setWizardStep] = useState<"choose-type" | "select" | "review-terms" | "add-collateral" | "add-guarantor" | "loan-details" | "review">("choose-type");
  const [borrowType, setBorrowType] = useState<"orders" | "collateral" | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [loanDuration, setLoanDuration] = useState<string>("1");
  const [loanPurpose, setLoanPurpose] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Additional Collateral State (for collateral tab)
  const [collateralItems, setCollateralItems] = useState<Collateral[]>([]);
  const [collateralType, setCollateralType] = useState<string>("property");
  const [collateralDescription, setCollateralDescription] = useState<string>("");
  const [collateralValue, setCollateralValue] = useState<string>("");
  const [collateralLoanAmount, setCollateralLoanAmount] = useState<string>("");
  const [collateralLoanDuration, setCollateralLoanDuration] = useState<string>("1");
  const [collateralLoanPurpose, setCollateralLoanPurpose] = useState<string>("");

  // Guarantor State
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [guarantorName, setGuarantorName] = useState<string>("");
  const [guarantorPhone, setGuarantorPhone] = useState<string>("");
  const [guarantorEmail, setGuarantorEmail] = useState<string>("");
  const [guarantorRelationship, setGuarantorRelationship] = useState<string>("friend");

  // Fetch user's orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await client.get("/orders/?page_size=100");
      const ordersList = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      // Filter to orders that haven't been delivered yet (excluding delivered and cancelled)
      const eligibleOrders = ordersList.filter((o: any) => {
        const status = o.status?.toLowerCase();
        return status && status !== "delivered" && status !== "cancelled";
      });
      setOrders(eligibleOrders);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && borrowType === "orders") {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders, borrowType]);

  // Helper function to get order value with proper fallback
  const getOrderValue = (order: Order) => {
    // Priority: total_price (from services) > actual_price > price > 0
    const value = order.total_price || order.actual_price || order.price || 0;
    return Number(value);
  };

  // Calculate loan details
  const maxLoanAmount = selectedOrder ? getOrderValue(selectedOrder) * 0.6 : 0;
  const interestRate = 0.02; // 2% daily
  const dailyInterest = maxLoanAmount * (interestRate / 100);
  const totalInterest = dailyInterest * Number(loanDuration);
  const totalRepayment = maxLoanAmount + totalInterest;

  // Calculate total collateral value for collateral tab
  const totalCollateralValueTab = collateralItems.reduce((sum, c) => sum + c.estimatedValue, 0);
  const maxLoanFromCollateral = totalCollateralValueTab * 0.6;
  const collateralDailyInterest = maxLoanFromCollateral * (interestRate / 100);
  const collateralTotalInterest = collateralDailyInterest * Number(collateralLoanDuration);
  const collateralTotalRepayment = maxLoanFromCollateral + collateralTotalInterest;

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setLoanAmount("");
    setError(null);
    setSuccess(null);
  };

  const handleAddCollateral = () => {
    if (!collateralType.trim()) {
      setError("Please select collateral type");
      return;
    }
    if (!collateralDescription.trim()) {
      setError("Please describe the collateral");
      return;
    }
    const collateralVal = Number(collateralValue);
    if (!collateralVal || collateralVal <= 0) {
      setError("Please enter a valid estimated value");
      return;
    }

    const newCollateral: Collateral = {
      id: Date.now().toString(),
      type: collateralType,
      description: collateralDescription,
      estimatedValue: collateralVal,
    };

    setCollateralItems([...collateralItems, newCollateral]);
    setCollateralType("property");
    setCollateralDescription("");
    setCollateralValue("");
    setError(null);
  };

  const handleRemoveCollateral = (id: string) => {
    setCollateralItems(collateralItems.filter((c) => c.id !== id));
  };

  const handleAddGuarantor = () => {
    if (!guarantorName.trim()) {
      setError("Please enter guarantor's name");
      return;
    }
    if (!guarantorPhone.trim()) {
      setError("Please enter guarantor's phone number");
      return;
    }
    if (!guarantorEmail.trim()) {
      setError("Please enter guarantor's email");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guarantorEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    // Basic phone validation
    if (!/^(\+\d{1,3}[- ]?)?\d{9,}$/.test(guarantorPhone.replace(/\s/g, ""))) {
      setError("Please enter a valid phone number");
      return;
    }

    const newGuarantor: Guarantor = {
      id: Date.now().toString(),
      name: guarantorName,
      phoneNumber: guarantorPhone,
      email: guarantorEmail,
      relationship: guarantorRelationship,
    };

    setGuarantors([...guarantors, newGuarantor]);
    setGuarantorName("");
    setGuarantorPhone("");
    setGuarantorEmail("");
    setGuarantorRelationship("friend");
    setError(null);
  };

  const handleRemoveGuarantor = (id: string) => {
    setGuarantors(guarantors.filter((g) => g.id !== id));
  };

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (borrowType === "orders") {
      // Orders tab validation
      if (!selectedOrder) {
        setError("Please select an order as collateral");
        return;
      }

      const loanAmt = Number(loanAmount);
      if (!loanAmt || loanAmt <= 0) {
        setError("Please enter a valid loan amount");
        return;
      }

      if (loanAmt > maxLoanAmount) {
        setError(`Loan amount cannot exceed KSh ${maxLoanAmount.toFixed(0)} (60% of order value)`);
        return;
      }

      if (!loanPurpose.trim()) {
        setError("Please specify the purpose of the loan");
        return;
      }

      if (guarantors.length === 0) {
        setError("Please add at least one guarantor");
        return;
      }

      try {
        setLoading(true);

        const loanRequestPayload = {
          loan_type: "order_collateral",
          order_id: selectedOrder.id,
          loan_amount: loanAmt,
          duration_days: Number(loanDuration),
          purpose: loanPurpose,
          collateral: {
            type: "order",
            primary_order_value: getOrderValue(selectedOrder),
          },
          guarantors: guarantors.map((g) => ({
            name: g.name,
            phone_number: g.phoneNumber,
            email: g.email,
            relationship: g.relationship,
          })),
        };

        const response = await client.post("/loans/request/", loanRequestPayload);

        setSuccess(
          `Loan request submitted successfully! Loan ID: ${response.id || "pending"}. You will receive KSh ${loanAmt.toFixed(0)} within 24 hours. Your order (${selectedOrder.code}) is held as collateral.`
        );

        setTimeout(() => {
          router.push("/loans");
        }, 2000);
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to submit loan request. Please try again."
        );
      } finally {
        setLoading(false);
      }
    } else {
      // Collateral tab validation
      if (collateralItems.length === 0) {
        setError("Please add at least one collateral item");
        return;
      }

      const loanAmt = Number(collateralLoanAmount);
      if (!loanAmt || loanAmt <= 0) {
        setError("Please enter a valid loan amount");
        return;
      }

      if (loanAmt > maxLoanFromCollateral) {
        setError(`Loan amount cannot exceed KSh ${maxLoanFromCollateral.toFixed(0)} (60% of collateral value)`);
        return;
      }

      if (!collateralLoanPurpose.trim()) {
        setError("Please specify the purpose of the loan");
        return;
      }

      if (guarantors.length === 0) {
        setError("Please add at least one guarantor");
        return;
      }

      try {
        setLoading(true);

        const loanRequestPayload = {
          loan_type: "collateral_only",
          loan_amount: loanAmt,
          duration_days: Number(collateralLoanDuration),
          purpose: collateralLoanPurpose,
          collateral: {
            type: "mixed",
            items: collateralItems.map((c) => ({
              type: c.type,
              description: c.description,
              estimated_value: c.estimatedValue,
            })),
            total_collateral_value: totalCollateralValueTab,
          },
          guarantors: guarantors.map((g) => ({
            name: g.name,
            phone_number: g.phoneNumber,
            email: g.email,
            relationship: g.relationship,
          })),
        };

        const response = await client.post("/loans/request/", loanRequestPayload);

        setSuccess(
          `Loan request submitted successfully! Loan ID: ${response.id || "pending"}. You will receive KSh ${loanAmt.toFixed(0)} within 24 hours.`
        );

        setTimeout(() => {
          router.push("/loans");
        }, 2000);
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to submit loan request. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (value: number) => {
    if (value === 0 || !value) return "KSh 0";
    return `KSh ${value.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
  };

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-extrabold mb-2">Get a Loan</h1>
              </div>
              <Link
                href="/loans"
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <span className="text-lg"></span>
                My Loans
              </Link>
            </div>

          </header>

          {/* Progress Indicator */}
          {wizardStep !== "choose-type" && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col items-center flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm mb-2 ${["select", "review-terms", "add-collateral", "add-guarantor", "loan-details", "review"].includes(wizardStep) ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
                    {["select", "review-terms", "add-collateral", "add-guarantor", "loan-details", "review"].includes(wizardStep) ? "✓" : "1"}
                  </div>
                  <span className="text-xs font-medium text-center">Select</span>
                </div>
                <div className={`flex-1 h-1 mx-1 ${["review-terms", "add-collateral", "add-guarantor", "loan-details", "review"].includes(wizardStep) ? "bg-green-600" : "bg-slate-200 dark:bg-slate-700"}`}></div>
                <div className="flex flex-col items-center flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm mb-2 ${["review-terms", "add-collateral", "add-guarantor", "loan-details", "review"].includes(wizardStep) ? wizardStep === "review-terms" ? "bg-red-600 text-white" : "bg-green-600 text-white" : "bg-slate-300 dark:bg-slate-600 text-slate-600"}`}>
                    {["review-terms", "add-collateral", "add-guarantor", "loan-details", "review"].includes(wizardStep) && wizardStep !== "review-terms" ? "✓" : "2"}
                  </div>
                  <span className="text-xs font-medium text-center">Terms</span>
                </div>
                <div className={`flex-1 h-1 mx-1 ${["add-collateral", "add-guarantor", "loan-details", "review"].includes(wizardStep) ? "bg-green-600" : "bg-slate-200 dark:bg-slate-700"}`}></div>
                <div className="flex flex-col items-center flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm mb-2 ${["add-collateral", "add-guarantor", "loan-details", "review"].includes(wizardStep) ? wizardStep === "add-collateral" ? "bg-red-600 text-white" : "bg-green-600 text-white" : "bg-slate-300 dark:bg-slate-600 text-slate-600"}`}>
                    {["add-collateral", "add-guarantor", "loan-details", "review"].includes(wizardStep) && wizardStep !== "add-collateral" ? "✓" : "3"}
                  </div>
                  <span className="text-xs font-medium text-center">Collateral</span>
                </div>
                <div className={`flex-1 h-1 mx-1 ${["add-guarantor", "loan-details", "review"].includes(wizardStep) ? "bg-green-600" : "bg-slate-200 dark:bg-slate-700"}`}></div>
                <div className="flex flex-col items-center flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm mb-2 ${["add-guarantor", "loan-details", "review"].includes(wizardStep) ? wizardStep === "add-guarantor" ? "bg-red-600 text-white" : "bg-green-600 text-white" : "bg-slate-300 dark:bg-slate-600 text-slate-600"}`}>
                    {["add-guarantor", "loan-details", "review"].includes(wizardStep) && wizardStep !== "add-guarantor" ? "✓" : "4"}
                  </div>
                  <span className="text-xs font-medium text-center">Guarantor</span>
                </div>
                <div className={`flex-1 h-1 mx-1 ${["loan-details", "review"].includes(wizardStep) ? "bg-green-600" : "bg-slate-200 dark:bg-slate-700"}`}></div>
                <div className="flex flex-col items-center flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm mb-2 ${["loan-details", "review"].includes(wizardStep) ? wizardStep === "loan-details" ? "bg-red-600 text-white" : "bg-green-600 text-white" : "bg-slate-300 dark:bg-slate-600 text-slate-600"}`}>
                    {["loan-details", "review"].includes(wizardStep) && wizardStep !== "loan-details" ? "✓" : "5"}
                  </div>
                  <span className="text-xs font-medium text-center">Details</span>
                </div>
                <div className={`flex-1 h-1 mx-1 ${wizardStep === "review" ? "bg-green-600" : "bg-slate-200 dark:bg-slate-700"}`}></div>
                <div className="flex flex-col items-center flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm mb-2 ${wizardStep === "review" ? "bg-red-600 text-white" : "bg-slate-300 dark:bg-slate-600 text-slate-600"}`}>
                    6
                  </div>
                  <span className="text-xs font-medium text-center">Review</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 0: Choose Borrow Type */}
          {wizardStep === "choose-type" && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold">How would you like to borrow?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Orders Option */}
                <button
                  onClick={() => {
                    setBorrowType("orders");
                    setWizardStep("select");
                    setError(null);
                  }}
                  className="p-6 rounded-2xl bg-white/80 dark:bg-white/5 border-2 border-slate-200 dark:border-slate-700 hover:border-red-600 hover:shadow-lg transition-all text-left">
                  <div className="text-4xl mb-3"></div>
                  <h3 className="text-xl font-bold mb-2">Use Your Orders</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Use pending orders as collateral to get a loan quickly
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <li>✓ Up to 60% of order value</li>
                    <li>✓ Quick approval (24h)</li>
                    <li>✓ Your order is held as security</li>
                  </ul>
                </button>

                {/* Collateral Option */}
                <button
                  onClick={() => {
                    setBorrowType("collateral");
                    setWizardStep("select");
                    setError(null);
                  }}
                  className="p-6 rounded-2xl bg-white/80 dark:bg-white/5 border-2 border-slate-200 dark:border-slate-700 hover:border-red-600 hover:shadow-lg transition-all text-left">
                  <div className="text-4xl mb-3"></div>
                  <h3 className="text-xl font-bold mb-2">Use Other Assets</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Use property, vehicles, or equipment as collateral
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <li>✓ Accept property, vehicles, equipment</li>
                    <li>✓ Up to 60% of asset value</li>
                    <li>✓ Requires guarantor</li>
                  </ul>
                </button>
              </div>

              {/* Rates & Terms */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
                  <div className="text-3xl font-bold text-red-600 mb-2">2%</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Daily Interest Rate</div>
                </div>
                <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
                  <div className="text-3xl font-bold text-red-600 mb-2">24h</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Approval & Funding Time</div>
                </div>
                <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
                  <div className="text-3xl font-bold text-red-600 mb-2">60%</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Up to 60% of collateral value</div>
                </div>
              </section>
            </section>
          )}

          {/* STEP 1: How It Works - Orders */}
          {wizardStep === "select" && borrowType === "orders" && (
            <section className="mb-8 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <h2 className="text-2xl font-bold mb-4">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">1</div>
                  <h3 className="font-semibold mb-2">Select Order</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Choose an active order</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">2</div>
                  <h3 className="font-semibold mb-2">Review Terms</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Accept loan terms</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">3</div>
                  <h3 className="font-semibold mb-2">Add Guarantor</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Provide guarantor details</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">4</div>
                  <h3 className="font-semibold mb-2">Request Loan</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Submit & get approval</p>
                </div>
              </div>
            </section>
          )}

          {/* STEP 1: How It Works - Collateral */}
          {wizardStep === "select" && borrowType === "collateral" && (
            <section className="mb-8 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <h2 className="text-2xl font-bold mb-4">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">1</div>
                  <h3 className="font-semibold mb-2">Review Terms</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Accept terms</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">2</div>
                  <h3 className="font-semibold mb-2">Add Collateral</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">List your assets</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">3</div>
                  <h3 className="font-semibold mb-2">Add Guarantor</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Provide guarantor</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg mb-3">4</div>
                  <h3 className="font-semibold mb-2">Request Loan</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Submit request</p>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setBorrowType(null);
                    setWizardStep("choose-type");
                  }}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                  Back
                </button>
                <button
                  onClick={() => setWizardStep("review-terms")}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all">
                  Continue
                </button>
              </div>
            </section>
          )}

          {/* STEP 2: Available Orders - Orders Tab Only */}
          {wizardStep === "select" && borrowType === "orders" && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-6">Select an Order</h2>
              
              {loading && !orders.length ? (
                <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow text-center text-slate-600">
                  Loading your orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow text-center">
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    You don't have any pending orders yet. Start an order first to use it as collateral.
                  </p>
                  <Link
                    href="/cart"
                    className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                    Book a Service
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => {
                        handleSelectOrder(order);
                      }}
                      className={`rounded-2xl p-4 shadow cursor-pointer transition-all hover:shadow-lg ${
                        selectedOrder?.id === order.id
                          ? "bg-red-600 text-white ring-2 ring-red-400"
                          : "bg-white/80 dark:bg-white/5"
                      }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-mono font-semibold">{order.code}</div>
                          <div className={`text-xs mt-1 ${selectedOrder?.id === order.id ? "opacity-90" : "text-slate-500"}`}>
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded text-xs font-semibold ${
                          selectedOrder?.id === order.id
                            ? "bg-white text-red-600"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}>
                          {order.status}
                        </div>
                      </div>
                      <div className={`text-sm mt-3 ${selectedOrder?.id === order.id ? "opacity-90" : ""}`}>
                        Order Value: <span className="font-semibold">{formatCurrency(getOrderValue(order))}</span>
                        {getOrderValue(order) === 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">⚠️ Price pending (contact support)</p>
                        )}
                      </div>
                      <div className={`text-sm ${selectedOrder?.id === order.id ? "opacity-90" : "text-slate-600 dark:text-slate-400"}`}>
                        Max Loan: <span className="font-semibold text-red-600">{formatCurrency(getOrderValue(order) * 0.6)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setBorrowType(null);
                    setWizardStep("choose-type");
                  }}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                  Back
                </button>
                <button
                  onClick={() => selectedOrder && setWizardStep("review-terms")}
                  disabled={!selectedOrder}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  Continue
                </button>
              </div>
            </section>
          )}

          {/* STEP 2: Review Terms & Loan Details */}
          {wizardStep === "review-terms" && (
            <section className="mb-10 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Review Loan Terms</h2>

              {borrowType === "orders" && selectedOrder && (
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-200">Your Selected Order</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Order Code:</span>
                        <span className="font-mono font-semibold">{selectedOrder.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Order Value:</span>
                        <span className="font-semibold">{formatCurrency(getOrderValue(selectedOrder))}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-700">
                        <span className="text-sm font-medium">Maximum Loan (60%):</span>
                        <span className="font-bold text-red-600">{formatCurrency(getOrderValue(selectedOrder) * 0.6)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Loan Terms */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h3 className="font-semibold mb-3 text-amber-900 dark:text-amber-200">Terms & Conditions</h3>
                    <ul className="space-y-2 text-sm text-amber-900 dark:text-amber-200">
                      <li>• <strong>Interest Rate:</strong> 2% per day</li>
                      <li>• <strong>Collateral:</strong> Your order will be held as security</li>
                      <li>• <strong>Approval:</strong> Within 24 hours</li>
                      <li>• <strong>Repayment:</strong> Flexible terms from 1 day to 1 month</li>
                      <li>• <strong>Default:</strong> If unpaid after due date, order will be forfeited</li>
                      <li>• <strong>Early Repayment:</strong> Allowed with no penalties</li>
                    </ul>
                  </div>

                  {/* Checkbox & Buttons */}
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-red-300" style={{borderColor: termsAccepted ? '#dc2626' : undefined}}>
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="w-5 h-5 cursor-pointer accent-red-600"
                      />
                      <span className="text-sm font-medium">I understand and accept the terms & conditions</span>
                    </label>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setWizardStep("select");
                          setTermsAccepted(false);
                        }}
                        className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                        Back
                      </button>
                      <button
                        onClick={() => setWizardStep("add-guarantor")}
                        disabled={!termsAccepted}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        Accept & Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {borrowType === "collateral" && (
                <div className="space-y-6">
                  {/* Loan Terms */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h3 className="font-semibold mb-3 text-amber-900 dark:text-amber-200">Terms & Conditions</h3>
                    <ul className="space-y-2 text-sm text-amber-900 dark:text-amber-200">
                      <li>• <strong>Interest Rate:</strong> 2% per day</li>
                      <li>• <strong>Collateral:</strong> Your assets will be held as security</li>
                      <li>• <strong>Approval:</strong> Within 24 hours</li>
                      <li>• <strong>Repayment:</strong> Flexible terms from 1 day to 1 month</li>
                      <li>• <strong>Default:</strong> If unpaid after due date, collateral may be liquidated</li>
                      <li>• <strong>Early Repayment:</strong> Allowed with no penalties</li>
                      <li>• <strong>Guarantor:</strong> At least one guarantor is required</li>
                    </ul>
                  </div>

                  {/* Checkbox & Buttons */}
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-red-300" style={{borderColor: termsAccepted ? '#dc2626' : undefined}}>
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="w-5 h-5 cursor-pointer accent-red-600"
                      />
                      <span className="text-sm font-medium">I understand and accept the terms & conditions</span>
                    </label>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setWizardStep("select");
                          setTermsAccepted(false);
                        }}
                        className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                        Back
                      </button>
                      <button
                        onClick={() => setWizardStep("add-collateral")}
                        disabled={!termsAccepted}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        Accept & Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {borrowType === "collateral" && collateralItems.length > 0 && (
                <div className="space-y-6">
                  {/* Collateral Summary - only show after collateral is added */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-200">Collateral Summary</h3>
                    <div className="space-y-2">
                      {collateralItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="capitalize">{item.type}: {item.description.substring(0, 30)}...</span>
                          <span className="font-semibold">{formatCurrency(item.estimatedValue)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-700">
                        <span className="font-medium">Total Value:</span>
                        <span className="font-bold">{formatCurrency(totalCollateralValueTab)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-700">
                        <span className="text-sm font-medium">Maximum Loan (60%):</span>
                        <span className="font-bold text-red-600">{formatCurrency(maxLoanFromCollateral)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* STEP 3: Add Collateral for Collateral Type */}
          {wizardStep === "add-collateral" && borrowType === "collateral" && (
            <section className="mb-10 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Manage Collateral</h2>

              {/* Add/Edit Collateral Form */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type of Collateral</label>
                    <select
                      value={collateralType}
                      onChange={(e) => setCollateralType(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all">
                      <option value="property">Property</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="equipment">Equipment</option>
                      <option value="jewelry">Jewelry/Gold</option>
                      <option value="electronics">Electronics</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Estimated Value (KSh)</label>
                    <input
                      type="number"
                      value={collateralValue}
                      onChange={(e) => setCollateralValue(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="1000"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={collateralDescription}
                    onChange={(e) => setCollateralDescription(e.target.value)}
                    placeholder="E.g., 4-bedroom house in Nairobi, 2018 Honda Civic, etc."
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddCollateral}
                  className="w-full px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium hover:bg-slate-400 dark:hover:bg-slate-600 transition-all">
                  + Add More Collateral
                </button>
              </div>

              {/* Current Collateral List */}
              {collateralItems.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h3 className="font-semibold text-sm">Your Collateral Items ({collateralItems.length})</h3>
                  {collateralItems.map((collateral) => (
                    <div
                      key={collateral.id}
                      className="flex justify-between items-start p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex-1">
                        <div className="font-medium text-sm capitalize">{collateral.type}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{collateral.description}</div>
                        <div className="text-sm font-semibold text-red-600 mt-2">
                          {formatCurrency(collateral.estimatedValue)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCollateral(collateral.id)}
                        className="ml-3 px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-all">
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">Total Collateral Value:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(totalCollateralValueTab)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                      <span className="font-medium text-sm">Max Loan Amount (60%):</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(maxLoanFromCollateral)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  onClick={() => setWizardStep("review-terms")}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                  Back
                </button>
                <button
                  onClick={() => setWizardStep("add-guarantor")}
                  disabled={collateralItems.length === 0}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  Continue
                </button>
              </div>
            </section>
          )}

          {/* STEP 3: Add Guarantor */}
          {wizardStep === "add-guarantor" && (
            <section className="mb-10 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Add Guarantor</h2>

              {/* Add Guarantor Form */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Guarantor's Full Name</label>
                    <input
                      type="text"
                      value={guarantorName}
                      onChange={(e) => setGuarantorName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={guarantorPhone}
                      onChange={(e) => setGuarantorPhone(e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={guarantorEmail}
                      onChange={(e) => setGuarantorEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Relationship</label>
                    <select
                      value={guarantorRelationship}
                      onChange={(e) => setGuarantorRelationship(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all">
                      <option value="friend">Friend</option>
                      <option value="family">Family Member</option>
                      <option value="employer">Employer</option>
                      <option value="colleague">Colleague</option>
                      <option value="business_partner">Business Partner</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddGuarantor}
                  className="w-full px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium hover:bg-slate-400 dark:hover:bg-slate-600 transition-all">
                  + Add Guarantor
                </button>
              </div>

              {/* Added Guarantors List */}
              {guarantors.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h3 className="font-semibold text-sm">Added Guarantors ({guarantors.length})</h3>
                  {guarantors.map((guarantor) => (
                    <div
                      key={guarantor.id}
                      className="flex justify-between items-start p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{guarantor.name}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          📞 {guarantor.phoneNumber}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          📧 {guarantor.email}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 capitalize">
                          Relationship: {guarantor.relationship}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuarantor(guarantor.id)}
                        className="ml-3 px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-all">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  onClick={() => setWizardStep(borrowType === "collateral" ? "add-collateral" : "review-terms")}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                  Back
                </button>
                <button
                  onClick={() => setWizardStep("loan-details")}
                  disabled={guarantors.length === 0}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  Continue
                </button>
              </div>
            </section>
          )}

          {/* STEP 4: Request Loan Details */}
          {wizardStep === "loan-details" && (
            <section className="mb-10 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Request Loan Amount</h2>

              {borrowType === "orders" && selectedOrder && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-200 mb-2">
                    <strong>Order:</strong> {selectedOrder.code} ({formatCurrency(getOrderValue(selectedOrder))})
                  </p>
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Max Loan:</strong> {formatCurrency(maxLoanAmount)}
                  </p>
                </div>
              )}

              {borrowType === "collateral" && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-200 mb-2">
                    <strong>Total Collateral:</strong> {formatCurrency(totalCollateralValueTab)}
                  </p>
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Max Loan (60%):</strong> {formatCurrency(maxLoanFromCollateral)}
                  </p>
                </div>
              )}

              <form onSubmit={handleRequestLoan} className="space-y-5">
                {/* Loan Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2">Loan Amount (KSh)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={borrowType === "orders" ? loanAmount : collateralLoanAmount}
                      onChange={(e) => borrowType === "orders" ? setLoanAmount(e.target.value) : setCollateralLoanAmount(e.target.value)}
                      placeholder={`0 - ${(borrowType === "orders" ? maxLoanAmount : maxLoanFromCollateral).toFixed(0)}`}
                      max={borrowType === "orders" ? maxLoanAmount : maxLoanFromCollateral}
                      min="0"
                      step="100"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                    />
                    <div className="absolute right-4 top-2.5 text-xs text-slate-500">
                      Max: {formatCurrency(borrowType === "orders" ? maxLoanAmount : maxLoanFromCollateral)}
                    </div>
                  </div>
                </div>

                {/* Loan Duration */}
                <div>
                  <label className="block text-sm font-medium mb-2">Repayment Period</label>
                  <select
                    value={borrowType === "orders" ? loanDuration : collateralLoanDuration}
                    onChange={(e) => borrowType === "orders" ? setLoanDuration(e.target.value) : setCollateralLoanDuration(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all">
                    <option value="1">24 hours</option>
                    <option value="2">48 hours</option>
                    <option value="7">7 days</option>
                    <option value="14">2 weeks</option>
                    <option value="30">1 month</option>
                  </select>
                </div>

                {/* Loan Purpose */}
                <div>
                  <label className="block text-sm font-medium mb-2">Purpose of Loan</label>
                  <textarea
                    value={borrowType === "orders" ? loanPurpose : collateralLoanPurpose}
                    onChange={(e) => borrowType === "orders" ? setLoanPurpose(e.target.value) : setCollateralLoanPurpose(e.target.value)}
                    placeholder="E.g., Business expansion, emergency expenses, etc."
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-transparent transition-all"
                  />
                </div>

                {/* Loan Summary */}
                {((borrowType === "orders" && loanAmount && Number(loanAmount) > 0) || (borrowType === "collateral" && collateralLoanAmount && Number(collateralLoanAmount) > 0)) && (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Loan Amount:</span>
                      <span className="font-semibold">{formatCurrency(Number(borrowType === "orders" ? loanAmount : collateralLoanAmount))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Daily Interest (2%):</span>
                      <span className="font-semibold">{formatCurrency((Number(borrowType === "orders" ? loanAmount : collateralLoanAmount) * 0.02))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Interest for {borrowType === "orders" ? loanDuration : collateralLoanDuration} days:</span>
                      <span className="font-semibold">{formatCurrency((Number(borrowType === "orders" ? loanAmount : collateralLoanAmount) * 0.02) * Number(borrowType === "orders" ? loanDuration : collateralLoanDuration))}</span>
                    </div>
                    <div className="border-t border-slate-300 dark:border-slate-600 pt-2 flex justify-between">
                      <span className="font-semibold">Total to Repay:</span>
                      <span className="font-bold text-lg text-red-600">{formatCurrency(Number(borrowType === "orders" ? loanAmount : collateralLoanAmount) + ((Number(borrowType === "orders" ? loanAmount : collateralLoanAmount) * 0.02) * Number(borrowType === "orders" ? loanDuration : collateralLoanDuration)))}</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setWizardStep("add-guarantor")}
                    className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep("review")}
                    disabled={borrowType === "orders" ? !loanAmount || !loanPurpose : !collateralLoanAmount || !collateralLoanPurpose}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    Review & Apply
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* STEP 5: Final Review & Submit */}
          {wizardStep === "review" && (
            <section className="mb-10 rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Review Your Application</h2>

              {/* Collateral Summary */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-200">Collateral</h3>
                {borrowType === "orders" && selectedOrder && (
                  <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p>Order: <strong>{selectedOrder.code}</strong></p>
                    <p>Value: <strong>{formatCurrency(getOrderValue(selectedOrder))}</strong></p>
                  </div>
                )}
                {borrowType === "collateral" && (
                  <div className="text-sm text-blue-900 dark:text-blue-200 space-y-1">
                    {collateralItems.map((item) => (
                      <p key={item.id}>{item.type}: <strong>{formatCurrency(item.estimatedValue)}</strong></p>
                    ))}
                    <p className="pt-2 border-t border-blue-300">Total: <strong>{formatCurrency(totalCollateralValueTab)}</strong></p>
                  </div>
                )}
              </div>

              {/* Guarantor Summary */}
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold mb-3 text-green-900 dark:text-green-200">Guarantor(s)</h3>
                <div className="space-y-2 text-sm text-green-900 dark:text-green-200">
                  {guarantors.map((g) => (
                    <p key={g.id}>{g.name} ({g.relationship})</p>
                  ))}
                </div>
              </div>

              {/* Loan Summary */}
              <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold mb-3 text-purple-900 dark:text-purple-200">Loan Details</h3>
                <div className="space-y-2 text-sm text-purple-900 dark:text-purple-200">
                  <p>Amount: <strong>{formatCurrency(Number(borrowType === "orders" ? loanAmount : collateralLoanAmount))}</strong></p>
                  <p>Duration: <strong>{borrowType === "orders" ? loanDuration : collateralLoanDuration} days</strong></p>
                  <p>Purpose: <strong>{borrowType === "orders" ? loanPurpose : collateralLoanPurpose}</strong></p>
                  <p className="pt-2 border-t border-purple-300">Total to Repay: <strong className="text-lg text-purple-600 dark:text-purple-400">{formatCurrency(Number(borrowType === "orders" ? loanAmount : collateralLoanAmount) + ((Number(borrowType === "orders" ? loanAmount : collateralLoanAmount) * 0.02) * Number(borrowType === "orders" ? loanDuration : collateralLoanDuration)))}</strong></p>
                </div>
              </div>

              {/* Error/Success Message */}
              {error && (
                <div className="mb-4 p-3 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 text-sm text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => setWizardStep("loan-details")}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                  Back
                </button>
                <button
                  onClick={handleRequestLoan}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {loading ? "Processing..." : "Submit Application"}
                </button>
              </div>
            </section>
          )}

        </div>
      </div>
    </RouteGuard>
  );
}
