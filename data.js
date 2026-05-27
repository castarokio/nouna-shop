// Nouna Shop - Client-Side API Helper Layer

// Redirect API calls to local server when hosted on GitHub Pages
const BASE_URL = window.location.hostname.includes('github.io') ? 'http://localhost:3000' : '';
if (BASE_URL) {
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = BASE_URL + input;
    }
    return originalFetch(input, init);
  };
}

const API = {
  // Session Token Handlers (Secure Authentication)
  getToken() {
    return sessionStorage.getItem("nouna_admin_token");
  },
  setToken(token) {
    sessionStorage.setItem("nouna_admin_token", token);
  },
  clearToken() {
    sessionStorage.removeItem("nouna_admin_token");
  },
  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // ----------------------------------------------------
  // Public Storefront Endpoints
  // ----------------------------------------------------
  
  async getProducts() {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error("Failed to load products.");
    return res.json();
  },
  
  async getCategories() {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error("Failed to load categories.");
    return res.json();
  },
  
  async getWilayas() {
    const res = await fetch('/api/wilayas');
    if (!res.ok) throw new Error("Failed to load shipping costs.");
    return res.json();
  },
  
  async getReviews() {
    const res = await fetch('/api/reviews');
    if (!res.ok) return []; // Fallback empty
    return res.json();
  },
  
  async createOrder(orderData) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Checkout failed. Please verify your inputs.");
    }
    return data;
  },

  // ----------------------------------------------------
  // Admin Login Endpoints
  // ----------------------------------------------------
  
  async adminLogin(password) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Access Denied.");
    }
    if (data.success && data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  // ----------------------------------------------------
  // Protected Admin Management Endpoints
  // ----------------------------------------------------
  
  async adminGetOrders() {
    const res = await fetch('/api/admin/orders', { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Unauthorized admin access.");
    return res.json();
  },
  
  async adminUpdateOrderStatus(orderId, status) {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error("Failed to update status.");
    return res.json();
  },
  
  async adminDeleteOrder(orderId) {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete order.");
    return res.json();
  },
  
  async adminAddProduct(productData) {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(productData)
    });
    if (!res.ok) throw new Error("Failed to add product.");
    return res.json();
  },
  
  async adminUpdateProduct(productId, productData) {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(productData)
    });
    if (!res.ok) throw new Error("Failed to update product details.");
    return res.json();
  },
  
  async adminDeleteProduct(productId) {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete product.");
    return res.json();
  },
  
  async adminAddCategory(name) {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to add category.");
    }
    return data;
  },
  
  async adminDeleteCategory(name) {
    const res = await fetch(`/api/admin/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete category.");
    return res.json();
  },
  
  async adminUpdateShippingPrice(code, price) {
    const res = await fetch('/api/admin/wilayas', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ code, price })
    });
    if (!res.ok) throw new Error("Failed to update shipping price.");
    return res.json();
  },
  
  async adminExportDb() {
    const res = await fetch('/api/admin/db/export', { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Database export failed.");
    return res.json();
  },
  
  async adminImportDb(dbData) {
    const res = await fetch('/api/admin/db/import', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(dbData)
    });
    if (!res.ok) throw new Error("Database import failed.");
    return res.json();
  },
  
  async adminResetDb() {
    const res = await fetch('/api/admin/db/reset', {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error("Database reset failed.");
    return res.json();
  },

  // ----------------------------------------------------
  // Product Reviews APIs
  // ----------------------------------------------------
  async getProductReviews(productId) {
    const res = await fetch(`/api/products/${productId}/reviews`);
    if (!res.ok) throw new Error("Failed to load reviews for this product.");
    return res.json();
  },

  async submitReview(reviewData) {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit review.");
    return data;
  },

  async adminGetPendingReviews() {
    const res = await fetch('/api/admin/reviews/pending', { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Failed to load pending reviews.");
    return res.json();
  },

  async adminApproveReview(reviewId) {
    const res = await fetch(`/api/admin/reviews/${reviewId}/approve`, {
      method: 'PUT',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error("Failed to approve review.");
    return res.json();
  },

  async adminDeclineReview(reviewId) {
    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error("Failed to decline review.");
    return res.json();
  },

  async adminUploadImage(filename, base64Data) {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ filename, base64Data })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to upload image.");
    return data;
  }
};
