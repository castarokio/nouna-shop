// Nouna Shop - Secure Admin Dashboard Application Script

window.AdminPanel = {
  activeTab: 'dashboard',
  currentEditingProductId: null,

  setup() {
    this.checkSession();
    this.bindEvents();
  },

  checkSession() {
    const token = API.getToken();
    const loginCard = document.getElementById("admin-login-card");
    const consoleLayout = document.getElementById("admin-layout-console");
    const adminView = document.getElementById("admin-view");

    if (token) {
      loginCard.style.display = 'none';
      adminView.style.display = 'block';
      consoleLayout.style.display = 'grid';
      this.switchTab(this.activeTab);
    } else {
      loginCard.style.display = 'block';
      adminView.style.display = 'none';
      consoleLayout.style.display = 'none';
    }
  },

  bindEvents() {
    // Login Click Handler
    const loginBtn = document.getElementById("admin-login-submit-btn");
    const passwordInput = document.getElementById("admin-password-input");
    
    loginBtn.onclick = () => this.handleLogin();
    passwordInput.onkeypress = (e) => { if (e.key === 'Enter') this.handleLogin(); };

    // Logout Click Handler
    const logoutBtn = document.getElementById("admin-logout-btn");
    logoutBtn.onclick = () => {
      API.clearToken();
      this.checkSession();
    };

    // Tabs Selector Switchers
    const tabBtns = document.querySelectorAll(".admin-tab-btn[data-tab]");
    tabBtns.forEach(btn => {
      btn.onclick = () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.switchTab(btn.dataset.tab);
      };
    });

    // Product Catalog Editor Actions
    const addProductBtn = document.getElementById("add-product-btn-trigger");
    addProductBtn.onclick = () => this.openProductForm();

    const productFormClose = document.getElementById("product-form-close-btn");
    productFormClose.onclick = () => this.closeProductForm();

    const productFormCancel = document.getElementById("product-form-cancel");
    productFormCancel.onclick = () => this.closeProductForm();

    const productForm = document.getElementById("admin-product-form");
    productForm.onsubmit = (e) => this.handleProductSave(e);

    // Product Multi-Image Upload Bindings
    const uploadBtn = document.getElementById("product-images-upload-btn");
    const fileInput = document.getElementById("product-images-upload");
    if (uploadBtn && fileInput) {
      uploadBtn.onclick = () => fileInput.click();
      fileInput.onchange = (e) => this.handleImagesUpload(e);
    }

    // Category Editors Actions
    const addCategoryBtn = document.getElementById("new-category-add-btn");
    addCategoryBtn.onclick = () => this.handleAddCategory();

    // Data operations
    const exportBtn = document.getElementById("db-export-btn");
    exportBtn.onclick = () => this.exportDatabase();

    const importTriggerBtn = document.getElementById("db-import-btn-trigger");
    const importFileInput = document.getElementById("db-import-file-input");
    importTriggerBtn.onclick = () => importFileInput.click();
    importFileInput.onchange = (e) => this.importDatabase(e);

    const resetBtn = document.getElementById("db-reset-btn");
    resetBtn.onclick = () => this.factoryResetDatabase();
  },

  async handleLogin() {
    const passwordVal = document.getElementById("admin-password-input").value;
    
    try {
      await API.adminLogin(passwordVal);
      document.getElementById("admin-password-input").value = '';
      this.checkSession();
    } catch (err) {
      alert("⚠️ Access Denied: " + err.message);
    }
  },

  handleApiError(err) {
    console.error("API Call error:", err);
    if (err.message.includes("Unauthorized") || err.message.includes("Access denied")) {
      alert("⚠️ Your admin session has expired. Please log in again.");
      API.clearToken();
      this.checkSession();
    } else {
      alert("⚠️ Dashboard error: " + err.message);
    }
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    
    const panels = document.querySelectorAll(".admin-panel-tab-view");
    panels.forEach(p => p.style.display = 'none');

    const activePanel = document.getElementById(`tab-${tabName}`);
    if (activePanel) {
      activePanel.style.display = 'block';
    }

    if (tabName === 'dashboard') {
      this.loadDashboardData();
    } else if (tabName === 'orders') {
      this.loadOrdersList();
    } else if (tabName === 'products') {
      this.loadProductsList();
    } else if (tabName === 'categories') {
      this.loadCategoriesList();
    } else if (tabName === 'shipping') {
      this.loadShippingCosts();
    } else if (tabName === 'reviews') {
      this.loadPendingReviewsList();
    }
  },

  // ----------------------------------------------------
  // Loaders (API Integrated)
  // ----------------------------------------------------

  async loadDashboardData() {
    try {
      const orders = await API.adminGetOrders();
      
      const totalOrdersCount = orders.length;
      const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
      const totalRevenue = orders
        .filter(o => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + o.total, 0);

      document.getElementById("stat-revenue").textContent = `${totalRevenue} DA`;
      document.getElementById("stat-orders-count").textContent = totalOrdersCount;
      document.getElementById("stat-pending-orders").textContent = pendingOrdersCount;

      const recentTbody = document.getElementById("recent-orders-tbody");
      recentTbody.innerHTML = '';

      if (orders.length === 0) {
        recentTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No sales recorded yet.</td></tr>`;
        return;
      }

      orders.slice(0, 5).forEach(o => {
        recentTbody.innerHTML += `
          <tr>
            <td><strong>${o.customer.name}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${o.customer.phone}</span></td>
            <td>${o.customer.wilaya}</td>
            <td>${o.date.split(',')[0]}</td>
            <td style="font-weight:700; color:var(--primary);">${o.total} DA</td>
            <td><span class="status-badge ${o.status.toLowerCase()}">${o.status}</span></td>
          </tr>
        `;
      });
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async loadOrdersList() {
    try {
      const orders = await API.adminGetOrders();
      const tbody = document.getElementById("orders-list-tbody");
      tbody.innerHTML = '';

      if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; color: var(--text-muted);">No orders placed yet.</td></tr>`;
        return;
      }

      orders.forEach(o => {
        const itemsList = o.items.map(item => `${item.qty}x ${item.name} (${item.price} DA)`).join('<br>');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><code style="font-weight:700;">${o.id}</code><br><span style="font-size:0.75rem; color:var(--text-muted);">${o.date}</span></td>
          <td>
            <strong>${o.customer.name}</strong><br>
            <span style="color:var(--text-muted);"><i class="fa-solid fa-phone"></i> ${o.customer.phone}</span>
          </td>
          <td>${o.customer.wilaya}<br><span style="font-size:0.8rem; color:var(--text-muted);">${o.customer.baladia}</span></td>
          <td style="font-size: 0.85rem; max-width: 250px;">${itemsList}</td>
          <td>${o.deliveryFee} DA</td>
          <td style="font-weight:700; color:var(--primary);">${o.total} DA</td>
          <td>
            <select class="form-select status-select" style="padding: 6px; font-size: 0.8rem; font-weight:600;" onchange="AdminPanel.updateOrderStatus('${o.id}', this.value)">
              <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>
            <button class="admin-action-btn delete" onclick="AdminPanel.deleteOrder('${o.id}')" title="Delete Order">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async updateOrderStatus(orderId, newStatus) {
    try {
      await API.adminUpdateOrderStatus(orderId, newStatus);
      this.loadDashboardData();
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async deleteOrder(orderId) {
    if (!confirm(`Are you sure you want to permanently delete order ${orderId}?`)) return;
    
    try {
      await API.adminDeleteOrder(orderId);
      this.loadOrdersList();
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async loadProductsList() {
    try {
      const products = await API.getProducts();
      const tbody = document.getElementById("products-list-tbody");
      tbody.innerHTML = '';

      products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><img src="${p.image}" alt="" style="width:50px; height:50px; object-fit:cover; border-radius:8px;" onerror="this.src='https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&q=80'"></td>
          <td><strong>${p.name}</strong><br><span style="font-size:0.75rem; color:var(--text-muted); display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;">${p.description}</span></td>
          <td><span class="category-pill" style="padding:4px 12px; font-size:0.75rem; box-shadow:none; cursor:default;">${p.category}</span></td>
          <td style="font-weight:600;">${p.price} DA</td>
          <td style="color:var(--primary); font-weight:700;">${p.discountPrice ? `${p.discountPrice} DA` : '-'}</td>
          <td style="font-weight:600; color: ${p.stock <= 5 ? 'var(--danger)' : 'var(--text)'};">${p.stock} pcs</td>
          <td>
            <button class="admin-action-btn edit" onclick="AdminPanel.openProductForm('${p.id}')" title="Edit Product">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="admin-action-btn delete" onclick="AdminPanel.deleteProduct('${p.id}')" title="Delete Product">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async deleteProduct(productId) {
    if (!confirm("Are you sure you want to delete this product from your shop listing?")) return;
    
    try {
      await API.adminDeleteProduct(productId);
      this.loadProductsList();
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async openProductForm(productId = null) {
    const modal = document.getElementById("product-form-modal");
    const form = document.getElementById("admin-product-form");
    const title = document.getElementById("product-form-title");
    
    form.reset();
    this.currentEditingProductId = productId;
    this.formImagesArray = [];

    try {
      const categories = await API.getCategories();
      const select = document.getElementById("product-category");
      select.innerHTML = '';
      categories.filter(c => c !== "All").forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
      });

      if (productId) {
        title.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Product Details`;
        const products = await API.getProducts();
        const p = products.find(p => p.id === productId);
        if (p) {
          document.getElementById("product-form-id").value = p.id;
          document.getElementById("product-name").value = p.name;
          document.getElementById("product-category").value = p.category;
          document.getElementById("product-stock").value = p.stock;
          document.getElementById("product-price").value = p.price;
          document.getElementById("product-discount").value = p.discountPrice || '';
          document.getElementById("product-desc").value = p.description;
          document.getElementById("product-image").value = p.image || '';
          document.getElementById("product-how-to-use").value = p.howToUse || '';
          document.getElementById("product-ingredients").value = p.ingredients || '';
          this.formImagesArray = Array.isArray(p.images) ? [...p.images] : [p.image];
        }
      } else {
        title.innerHTML = `<i class="fa-solid fa-box-open"></i> Add New Product to Store`;
        document.getElementById("product-form-id").value = '';
        document.getElementById("product-image").value = '';
        document.getElementById("product-how-to-use").value = '';
        document.getElementById("product-ingredients").value = '';
        this.formImagesArray = [];
      }

      this.renderFormImages();
      modal.classList.add('active');
    } catch (err) {
      this.handleApiError(err);
    }
  },

  closeProductForm() {
    document.getElementById("product-form-modal").classList.remove('active');
    this.currentEditingProductId = null;
  },

  async handleImagesUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const statusSpan = document.getElementById("upload-status-text");
    statusSpan.textContent = `Uploading ${files.length} images...`;

    const mainImageInput = document.getElementById("product-image");

    for (let file of files) {
      try {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        const result = await API.adminUploadImage(file.name, base64Data);
        if (result.success && result.url) {
          this.formImagesArray.push(result.url);
          // If no main image is set yet, make this the main one
          if (!mainImageInput.value) {
            mainImageInput.value = result.url;
          }
          this.renderFormImages();
        }
      } catch (err) {
        alert(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    statusSpan.textContent = "Upload complete!";
    setTimeout(() => { statusSpan.textContent = ""; }, 3000);
    e.target.value = ""; // Clear file selector
  },

  renderFormImages() {
    const container = document.getElementById("product-images-preview-list");
    const mainImageVal = document.getElementById("product-image").value;

    container.innerHTML = "";

    if (this.formImagesArray.length === 0) {
      container.innerHTML = `<span style="font-size: 0.85rem; color: var(--text-muted); width: 100%; text-align: center;">No pictures uploaded. Upload images to begin.</span>`;
      return;
    }

    this.formImagesArray.forEach((imgUrl, idx) => {
      const isMain = imgUrl === mainImageVal;
      const card = document.createElement("div");
      card.className = "image-preview-card";
      card.style.cssText = `
        position: relative; 
        width: 80px; 
        height: 80px; 
        border-radius: 8px; 
        border: 2px solid ${isMain ? 'var(--primary)' : 'var(--border-color)'}; 
        overflow: hidden;
        background-color: var(--primary-light);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-sm);
      `;

      card.innerHTML = `
        <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&q=80'">
        
        <div style="position: absolute; bottom: 0; left: 0; width: 100%; display: flex; justify-content: space-between; padding: 2px; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);">
          ${isMain 
            ? `<span style="font-size: 0.65rem; color: #ffd43b; font-weight: 700; padding: 2px 4px;"><i class="fa-solid fa-star"></i> Main</span>`
            : `<button type="button" onclick="AdminPanel.setFormMainImage('${imgUrl}')" style="background: none; border: none; color: #fff; font-size: 0.65rem; cursor: pointer; font-weight: 600; padding: 2px 4px;">Set Main</button>`
          }
          <button type="button" onclick="AdminPanel.deleteFormImage('${imgUrl}')" style="background: none; border: none; color: #ff6b6b; font-size: 0.7rem; cursor: pointer; padding: 2px 4px;" title="Delete picture">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      container.appendChild(card);
    });
  },

  setFormMainImage(imgUrl) {
    document.getElementById("product-image").value = imgUrl;
    this.renderFormImages();
  },

  deleteFormImage(imgUrl) {
    this.formImagesArray = this.formImagesArray.filter(img => img !== imgUrl);
    const mainImageInput = document.getElementById("product-image");
    
    // If we deleted the main image, re-assign a new one
    if (mainImageInput.value === imgUrl) {
      mainImageInput.value = this.formImagesArray.length > 0 ? this.formImagesArray[0] : "";
    }
    
    this.renderFormImages();
  },

  async handleProductSave(e) {
    e.preventDefault();
    
    const idVal = document.getElementById("product-form-id").value;
    const nameVal = document.getElementById("product-name").value.trim();
    const categoryVal = document.getElementById("product-category").value;
    const stockVal = parseInt(document.getElementById("product-stock").value);
    const priceVal = parseInt(document.getElementById("product-price").value);
    const discountVal = parseInt(document.getElementById("product-discount").value) || null;
    const descVal = document.getElementById("product-desc").value.trim();
    const imageVal = document.getElementById("product-image").value.trim();
    const howToUseVal = document.getElementById("product-how-to-use").value.trim();
    const ingredientsVal = document.getElementById("product-ingredients").value.trim();

    if (discountVal && discountVal >= priceVal) {
      alert("Discount price must be lower than the original price.");
      return;
    }

    if (!imageVal) {
      alert("Please upload at least one image and select it as the Main picture.");
      return;
    }

    const payload = {
      name: nameVal,
      category: categoryVal,
      stock: stockVal,
      price: priceVal,
      discountPrice: discountVal,
      description: descVal,
      image: imageVal,
      images: this.formImagesArray,
      howToUse: howToUseVal,
      ingredients: ingredientsVal
    };

    try {
      if (idVal) {
        await API.adminUpdateProduct(idVal, payload);
      } else {
        await API.adminAddProduct(payload);
      }
      this.closeProductForm();
      this.loadProductsList();
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async loadCategoriesList() {
    try {
      const categories = await API.getCategories();
      const tbody = document.getElementById("categories-list-tbody");
      tbody.innerHTML = '';

      categories.filter(c => c !== "All").forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${cat}</strong></td>
          <td style="text-align: right;">
            <button class="admin-action-btn delete" onclick="AdminPanel.deleteCategory('${cat}')" title="Delete Category">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async handleAddCategory() {
    const input = document.getElementById("new-category-input");
    const newCat = input.value.trim();
    
    if (!newCat) return;

    try {
      await API.adminAddCategory(newCat);
      input.value = '';
      this.loadCategoriesList();
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async deleteCategory(catName) {
    if (!confirm(`Are you sure you want to delete the category "${catName}"? Product associations will remain but won't fit this filter.`)) return;

    try {
      await API.adminDeleteCategory(catName);
      this.loadCategoriesList();
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async loadShippingCosts() {
    try {
      const wilayas = await API.getWilayas();
      const container = document.getElementById("shipping-costs-grid-container");
      container.innerHTML = '';

      wilayas.forEach(w => {
        const card = document.createElement('div');
        card.className = 'shipping-card';
        card.innerHTML = `
          <span class="shipping-name">${w.name}</span>
          <div class="shipping-input-wrapper">
            <input type="number" min="0" value="${w.price}" onchange="AdminPanel.updateShippingPrice(${w.code}, this.value)">
            <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">DA</span>
          </div>
        `;
        container.appendChild(card);
      });
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async updateShippingPrice(wilayaCode, newPrice) {
    try {
      await API.adminUpdateShippingPrice(wilayaCode, newPrice);
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async loadPendingReviewsList() {
    try {
      const pendingReviews = await API.adminGetPendingReviews();
      const products = await API.getProducts();
      
      const tbody = document.getElementById("reviews-list-tbody");
      tbody.innerHTML = '';

      if (pendingReviews.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-circle-check" style="font-size:2rem; display:block; margin-bottom:8px; color:var(--success);"></i>No pending reviews to moderate. All clear!</td></tr>`;
        return;
      }

      pendingReviews.forEach(rev => {
        const product = products.find(p => p.id === rev.productId);
        const productName = product ? product.name : `Product ID: ${rev.productId}`;
        
        let stars = '';
        for (let i = 0; i < 5; i++) {
          if (i < rev.rating) {
            stars += `<i class="fa-solid fa-star" style="color:var(--warning); font-size:0.8rem;"></i>`;
          } else {
            stars += `<i class="fa-regular fa-star" style="color:#ccc; font-size:0.8rem;"></i>`;
          }
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${productName}</strong></td>
          <td><strong>${rev.name}</strong></td>
          <td>${stars}</td>
          <td style="max-width: 250px; font-style: italic;">"${rev.text}"</td>
          <td>${rev.date}</td>
          <td>
            <button class="admin-action-btn edit" onclick="AdminPanel.approveReview('${rev.id}')" title="Approve Review" style="color:var(--success); margin-right:8px;">
              <i class="fa-solid fa-circle-check" style="font-size:1.15rem;"></i>
            </button>
            <button class="admin-action-btn delete" onclick="AdminPanel.declineReview('${rev.id}')" title="Decline Review" style="color:var(--danger);">
              <i class="fa-solid fa-circle-xmark" style="font-size:1.15rem;"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async approveReview(reviewId) {
    try {
      await API.adminApproveReview(reviewId);
      this.loadPendingReviewsList();
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async declineReview(reviewId) {
    if (!confirm("Are you sure you want to decline and permanently delete this review?")) return;
    try {
      await API.adminDeclineReview(reviewId);
      this.loadPendingReviewsList();
    } catch (err) {
      this.handleApiError(err);
    }
  },

  // ----------------------------------------------------
  // Database Operations
  // ----------------------------------------------------

  async exportDatabase() {
    try {
      const databaseDump = await API.adminExportDb();
      const strDump = JSON.stringify(databaseDump, null, 2);
      const blob = new Blob([strDump], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `nouna_shop_fullstack_db_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      this.handleApiError(err);
    }
  },

  async importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        await API.adminImportDb(data);
        alert("🎉 Full-Stack Database imported successfully! The page will now reload.");
        window.location.reload();
      } catch (err) {
        alert("⚠️ Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
  },

  async factoryResetDatabase() {
    if (!confirm("⚠️ WARNING: This will delete ALL custom products, categories, orders, and reset the admin console configuration back to default seeds. Are you absolutely sure?")) return;

    try {
      await API.adminResetDb();
      alert("🔄 Database successfully reset. The console will now reload.");
      window.location.reload();
    } catch (err) {
      this.handleApiError(err);
    }
  }
};

// Initialize Admin setup
document.addEventListener("DOMContentLoaded", () => {
  window.AdminPanel.setup();
});
