# Integration Guide - Adding Checkout to Existing Pages

This guide shows how to integrate the M-Pesa checkout functionality into your existing order and product pages.

## 1. Add Checkout Button to Order Details Page

### In your existing order detail page (e.g., `app/orders/[id]/page.tsx`)

```typescript
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OrderDetailsPage({ params }) {
  const router = useRouter();
  const orderId = params.id;
  
  // Your existing order data
  const order = {
    id: orderId,
    total: 500,
    items: [...],
    status: 'pending'
  };

  const handleCheckout = () => {
    // Navigate to checkout with order details
    router.push(
      `/checkout?order_id=${orderId}&amount=${order.total}`
    );
  };

  return (
    <div className="order-container">
      {/* Existing order details */}
      <div className="order-summary">
        <h1>Order {orderId}</h1>
        <p className="order-total">Total: KES {order.total}</p>
        <p className="order-status">Status: {order.status}</p>
      </div>

      {/* Add this checkout button */}
      {order.status === 'pending' && (
        <button
          onClick={handleCheckout}
          className="btn btn-primary mt-6"
        >
          Proceed to Payment
        </button>
      )}

      {/* Link to check payment status */}
      <Link href={`/orders/${orderId}/payment-status`}>
        <a className="btn btn-secondary mt-3">Check Payment Status</a>
      </Link>
    </div>
  );
}
```

## 2. Add Quick Checkout from Cart

### In your cart page (e.g., `app/cart/page.tsx`)

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CartPage() {
  const router = useRouter();
  const [cartItems] = useState([/* ... */]);
  
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleMpesaCheckout = async () => {
    try {
      // Create order via API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cartItems,
            total: cartTotal,
          }),
        }
      );

      const order = await response.json();

      // Navigate to checkout with new order
      router.push(
        `/checkout?order_id=${order.id}&amount=${cartTotal}`
      );
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  return (
    <div className="cart-container">
      {/* Cart items list */}
      <div className="cart-items">
        {cartItems.map(item => (
          <div key={item.id} className="cart-item">
            <h3>{item.name}</h3>
            <p>KES {item.price} x {item.qty}</p>
          </div>
        ))}
      </div>

      {/* Cart summary and checkout */}
      <div className="cart-summary">
        <h2>Cart Total: KES {cartTotal}</h2>
        
        {/* M-Pesa Payment */}
        <button
          onClick={handleMpesaCheckout}
          className="btn btn-primary w-full mb-3"
        >
          Pay with M-Pesa
        </button>

        {/* Alternative payment methods */}
        <button className="btn btn-secondary w-full mb-3">
          Pay with Card
        </button>
      </div>
    </div>
  );
}
```

## 3. Add Payment Status Widget

### Create a reusable payment status component

```typescript
// components/PaymentStatusWidget.tsx
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface PaymentWidgetProps {
  orderId: string;
  autoRefresh?: boolean;
}

export function PaymentStatusWidget({ 
  orderId, 
  autoRefresh = true 
}: PaymentWidgetProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/payment-status/`,
          {
            headers: {
              'Authorization': `Token ${localStorage.getItem('token')}`,
            },
          }
        );
        setStatus(response.data.status);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch status:', error);
      }
    };

    checkStatus();

    if (autoRefresh) {
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [orderId, autoRefresh]);

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  const statusConfig = {
    pending: {
      color: 'yellow',
      icon: '⏳',
      text: 'Payment Pending',
    },
    initiated: {
      color: 'blue',
      icon: '📱',
      text: 'Check Your Phone',
    },
    success: {
      color: 'green',
      icon: '✓',
      text: 'Payment Successful',
    },
    failed: {
      color: 'red',
      icon: '✗',
      text: 'Payment Failed',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  return (
    <div className={`payment-status status-${config.color}`}>
      <span className="status-icon">{config.icon}</span>
      <span className="status-text">{config.text}</span>
      <Link href={`/orders/${orderId}/payment-status`}>
        <a className="status-link">View Details</a>
      </Link>
    </div>
  );
}

// Usage in any page:
// <PaymentStatusWidget orderId="ORD-2025-001" autoRefresh={true} />
```

## 4. Add to Dashboard

### Show recent payments in user dashboard

```typescript
// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payments/?limit=5`,
          {
            headers: {
              'Authorization': `Token ${localStorage.getItem('token')}`,
            },
          }
        );
        setPayments(response.data.results);
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      }
    };

    fetchPayments();
  }, []);

  return (
    <div className="dashboard">
      <h1>My Dashboard</h1>
      
      {/* Recent Payments Section */}
      <section className="recent-payments mt-8">
        <h2>Recent Payments</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td>{payment.order_id}</td>
                <td>KES {payment.amount}</td>
                <td>
                  <span className={`badge badge-${payment.status}`}>
                    {payment.status}
                  </span>
                </td>
                <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                <td>
                  <a href={`/orders/${payment.order_id}`}>
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

## 5. Pre-fill Checkout Form

### Pass order details via URL params

```typescript
// In your checkout page - already handles this!
// URL: /checkout?order_id=ORD-2025-001&amount=500

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id');
  const amount = params.get('amount');

  if (orderId && amount) {
    setFormData(prev => ({
      ...prev,
      order_id: orderId,
      amount: amount,
    }));
  }
}, []);
```

## 6. Add Success Callback

### Handle post-payment actions

```typescript
// After successful payment, in status page:

useEffect(() => {
  if (paymentStatus?.status === 'success') {
    // Option 1: Auto-update order status
    updateOrderStatus(orderId, 'paid');

    // Option 2: Send confirmation email
    sendConfirmationEmail(paymentStatus);

    // Option 3: Trigger fulfillment
    triggerOrderFulfillment(orderId);

    // Option 4: Redirect to order tracking
    setTimeout(() => {
      router.push(`/orders/${orderId}/track`);
    }, 2000);
  }
}, [paymentStatus?.status]);
```

## 7. Add Payment Method Selection

### Let users choose payment method

```typescript
// components/PaymentMethodSelector.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentMethodSelectorProps {
  orderId: string;
  amount: number;
}

export function PaymentMethodSelector({
  orderId,
  amount,
}: PaymentMethodSelectorProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState('mpesa');

  const handleProceed = () => {
    switch (selectedMethod) {
      case 'mpesa':
        router.push(`/checkout?order_id=${orderId}&amount=${amount}`);
        break;
      case 'card':
        router.push(`/checkout-card?order_id=${orderId}&amount=${amount}`);
        break;
      case 'bank':
        router.push(`/checkout-bank?order_id=${orderId}&amount=${amount}`);
        break;
      default:
        alert('Payment method not available');
    }
  };

  return (
    <div className="payment-methods">
      <h3>Select Payment Method</h3>
      
      <div className="method-grid">
        <label className="method-option">
          <input
            type="radio"
            name="method"
            value="mpesa"
            checked={selectedMethod === 'mpesa'}
            onChange={(e) => setSelectedMethod(e.target.value)}
          />
          <span className="method-icon">📱</span>
          <span className="method-name">M-Pesa</span>
        </label>

        <label className="method-option">
          <input
            type="radio"
            name="method"
            value="card"
            checked={selectedMethod === 'card'}
            onChange={(e) => setSelectedMethod(e.target.value)}
          />
          <span className="method-icon">💳</span>
          <span className="method-name">Credit Card</span>
        </label>

        <label className="method-option">
          <input
            type="radio"
            name="method"
            value="bank"
            checked={selectedMethod === 'bank'}
            onChange={(e) => setSelectedMethod(e.target.value)}
          />
          <span className="method-icon">🏦</span>
          <span className="method-name">Bank Transfer</span>
        </label>
      </div>

      <button onClick={handleProceed} className="btn btn-primary mt-4">
        Continue to Payment
      </button>
    </div>
  );
}
```

## 8. CSS Styling (Optional)

### Add to your global styles

```css
/* Payment button styles */
.payment-button {
  @apply inline-flex items-center justify-center px-6 py-3 
         border border-transparent text-base font-medium rounded-md 
         shadow-md text-white bg-indigo-600 hover:bg-indigo-700 
         focus:outline-none focus:ring-2 focus:ring-indigo-500;
  transition: all 0.3s ease;
}

.payment-button:disabled {
  @apply bg-gray-400 cursor-not-allowed;
}

.payment-status {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium;
}

.payment-status.status-green {
  @apply bg-green-100 text-green-800;
}

.payment-status.status-red {
  @apply bg-red-100 text-red-800;
}

.payment-status.status-yellow {
  @apply bg-yellow-100 text-yellow-800;
}

.payment-status.status-blue {
  @apply bg-blue-100 text-blue-800;
}

/* Form styles */
.payment-form input,
.payment-form textarea,
.payment-form select {
  @apply w-full px-4 py-2 border border-gray-300 rounded-lg 
         focus:ring-indigo-500 focus:border-indigo-500;
}

.payment-form label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.payment-form .form-group {
  @apply mb-6;
}
```

## Summary

You can integrate the M-Pesa checkout in multiple ways:

1. ✅ Order details page → Checkout button
2. ✅ Cart page → Quick checkout
3. ✅ Dashboard → Recent payments
4. ✅ Payment status widget → Reusable component
5. ✅ Payment method selector → Multiple options
6. ✅ Success callbacks → Post-payment actions
7. ✅ Pre-filled forms → Better UX
8. ✅ Styling → Polished appearance

All integration examples follow the existing checkout implementation and maintain consistency with your application's design patterns.
