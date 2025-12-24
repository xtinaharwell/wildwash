// lib/api/orders.ts
export async function createOrder(orderData: any) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/orders/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add token if auth is needed:
        // "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });
  
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to create order");
    }
    return await res.json();
  }
  