// lib/api/orders.ts
export async function createOrder(orderData: any) {
    const res = await fetch("https://8000-firebase-wild-wash-apigit-1760697854679.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev/orders/", {
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
  