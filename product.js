// Nouna Shop - Dedicated Product Detail Page Controller Script

// Global Cache State (Fetched from Server)
let currentProduct = null;
let storeCategories = [];
let storeWilayas = [];
let productReviews = [];

// Global Cart State (Stored in LocalStorage to sync across tabs/pages)
let cart = [];

// DOM Elements mapping
const elements = {
  announcementBar: document.getElementById('announcement-bar'),
  flashSaleTimer: document.getElementById('flash-sale-timer'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
  sidebarToggleBtn: document.getElementById('sidebar-toggle-btn'),
  sidebarCloseBtn: document.getElementById('sidebar-close-btn'),
  sidebarCategoriesList: document.getElementById('sidebar-categories-list'),
  
  // Navigation Logo
  logoNavLink: document.getElementById('logo-nav-link'),
  searchToggleBtn: document.getElementById('search-toggle-btn'),
  headerSearchBar: document.getElementById('header-search-bar'),
  desktopHeaderNav: document.getElementById('desktop-header-nav'),
  searchInput: document.getElementById('search-input'),
  searchBtn: document.getElementById('search-btn'),
  
  // Cart Trigger Badge
  cartDrawerBtn: document.getElementById('cart-drawer-btn'),
  cartBadgeCount: document.getElementById('cart-badge-count'),
  
  // Cart Drawer
  cartDrawerOverlay: document.getElementById('cart-drawer-overlay'),
  cartDrawer: document.getElementById('cart-drawer'),
  cartDrawerCloseBtn: document.getElementById('cart-drawer-close-btn'),
  cartDrawerBody: document.getElementById('cart-drawer-body'),
  cartDrawerFooter: document.getElementById('cart-drawer-footer'),
  cartSubtotalPrice: document.getElementById('cart-subtotal-price'),
  cartEstimatedTotal: document.getElementById('cart-estimated-total'),
  cartEstimatedShipping: document.getElementById('cart-estimated-shipping'),
  cartCheckoutBtnTrigger: document.getElementById('cart-checkout-btn-trigger'),
  
  // Breadcrumbs
  breadcrumbCategory: document.getElementById('breadcrumb-category'),
  breadcrumbName: document.getElementById('breadcrumb-name'),
  
  // Gallery elements
  galleryMainImg: document.getElementById('product-gallery-main-img'),
  galleryThumbnails: document.getElementById('product-gallery-thumbnails'),
  detailDiscount: document.getElementById('product-detail-discount'),
  detailViews: document.getElementById('product-detail-views'),
  
  // Product details
  detailCategory: document.getElementById('product-detail-category'),
  detailName: document.getElementById('product-detail-name'),
  detailStars: document.getElementById('product-detail-stars'),
  detailReviewCount: document.getElementById('product-detail-review-count'),
  detailPrice: document.getElementById('product-detail-price'),
  detailOldPrice: document.getElementById('product-detail-old-price'),
  detailUrgency: document.getElementById('product-detail-urgency'),
  detailStockCount: document.getElementById('product-detail-stock-count'),
  detailStockUrgency: document.getElementById('product-detail-stock-urgency'),
  detailStockProgress: document.getElementById('product-detail-stock-progress'),
  
  // Quantity adjusters
  qtyMinus: document.getElementById('qty-minus'),
  qtyPlus: document.getElementById('qty-plus'),
  qtyValue: document.getElementById('qty-value'),
  buyNowBtn: document.getElementById('product-buy-now-btn'),
  
  // Tab panels
  detailDesc: document.getElementById('product-detail-desc'),
  detailHowToUse: document.getElementById('product-detail-howtouse'),
  detailIngredients: document.getElementById('product-detail-ingredients'),
  reviewsContainer: document.getElementById('product-reviews-container'),
  tabReviewCount: document.getElementById('tab-review-count'),
  
  // Checkout Modal
  checkoutFormModal: document.getElementById('checkout-form-modal'),
  checkoutModalCloseBtn: document.getElementById('checkout-modal-close-btn'),
  checkoutOrderForm: document.getElementById('checkout-order-form'),
  checkoutName: document.getElementById('checkout-name'),
  checkoutPhone: document.getElementById('checkout-phone'),
  checkoutWilaya: document.getElementById('checkout-wilaya'),
  checkoutBaladia: document.getElementById('checkout-baladia'),
  checkoutBreakdownSubtotal: document.getElementById('checkout-breakdown-subtotal'),
  checkoutBreakdownShipping: document.getElementById('checkout-breakdown-shipping'),
  checkoutBreakdownTotal: document.getElementById('checkout-breakdown-total'),
  
  // Success Congrats Modal
  successModal: document.getElementById('checkout-success-modal'),
  successClientName: document.getElementById('success-client-name'),
  successOrderCode: document.getElementById('success-order-code'),
  successOrderAddress: document.getElementById('success-order-address'),
  successOrderPhone: document.getElementById('success-order-phone'),
  successOrderTotal: document.getElementById('success-order-total'),
  successCloseBtn: document.getElementById('success-close-btn'),
  
  // Canvas
  confettiCanvas: document.getElementById('confetti-canvas')
};

// ----------------------------------------------------
// 1. Initializers
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  initProductPage();
  setupEventListeners();
  startUrgencyTriggers();
});

function loadCartFromStorage() {
  const saved = localStorage.getItem("nouna_shop_cart");
  if (saved) {
    try {
      cart = JSON.parse(saved);
    } catch(e) {
      cart = [];
    }
  }
}

function saveCartToStorage() {
  localStorage.setItem("nouna_shop_cart", JSON.stringify(cart));
}

async function initProductPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    window.location.href = 'index.html';
    return;
  }

  try {
    // Load lists from REST API
    const products = await API.getProducts();
    currentProduct = products.find(p => p.id === productId);
    
    if (!currentProduct) {
      window.location.href = 'index.html';
      return;
    }

    storeWilayas = await API.getWilayas();
    productReviews = await API.getProductReviews(productId);
    try {
      storeCategories = await API.getCategories();
      renderSidebarCategories();
    } catch (catErr) {
      console.warn("Could not load sidebar categories:", catErr);
    }

    // Populate dropdowns & totals
    populateWilayasDropdown();
    updateCartBadge();
    
    // Render details
    renderProductDetails();
  } catch (err) {
    console.error("Product initialization failed:", err);
    document.querySelector('.store-view-container').innerHTML = `
      <div style="text-align: center; padding: 100px 40px; color: var(--danger);">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; margin-bottom: 12px;"></i>
        <p style="font-weight: 700; font-size:1.2rem;">Could not connect to Nouna Shop Server.</p>
        <p style="font-size:0.9rem; color:var(--text-muted); margin-top:5px;">Please make sure the server script is running (node server.js).</p>
        <a href="index.html" class="btn-primary" style="margin-top:20px; display:inline-block; text-decoration:none;">Go back to home</a>
      </div>
    `;
  }
}

function setupEventListeners() {
  // Sidebar navigation
  elements.sidebarToggleBtn.addEventListener('click', toggleSidebar);
  elements.sidebarCloseBtn.addEventListener('click', toggleSidebar);
  elements.sidebarOverlay.addEventListener('click', toggleSidebar);

  // Cart Drawer
  elements.cartDrawerBtn.addEventListener('click', toggleCartDrawer);
  elements.cartDrawerCloseBtn.addEventListener('click', toggleCartDrawer);
  elements.cartDrawerOverlay.addEventListener('click', toggleCartDrawer);
  elements.cartCheckoutBtnTrigger.addEventListener('click', openCheckoutModal);

  // Search Toggle Bar
  if (elements.searchToggleBtn) {
    elements.searchToggleBtn.addEventListener('click', () => {
      elements.headerSearchBar.classList.toggle('active');
      if (elements.headerSearchBar.classList.contains('active')) {
        elements.searchInput.focus();
      }
    });
  }

  // Search Submission Redirects
  if (elements.searchBtn) {
    elements.searchBtn.addEventListener('click', handleSearchRedirect);
  }
  if (elements.searchInput) {
    elements.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSearchRedirect();
    });
  }

  // Quantity adjustments
  elements.qtyMinus.addEventListener('click', () => adjustQty(-1));
  elements.qtyPlus.addEventListener('click', () => adjustQty(1));
  elements.buyNowBtn.addEventListener('click', handleBuyNow);

  // Checkout modal
  elements.checkoutModalCloseBtn.addEventListener('click', closeCheckoutModal);
  elements.checkoutWilaya.addEventListener('change', updateCheckoutCosts);
  elements.checkoutOrderForm.addEventListener('submit', handleCheckoutSubmit);
  elements.successCloseBtn.addEventListener('click', () => elements.successModal.classList.remove('active'));

  // Reviews stars rating hover/selection
  setupReviewsForm();

  // Tabs switching logic
  const tabButtons = document.querySelectorAll('.product-tab-btn[data-tab]');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchTabPanel(btn.dataset.tab);
    });
  });

  // Jump to reviews link
  elements.detailReviewCount.addEventListener('click', () => {
    const reviewsTabBtn = document.querySelector('.product-tab-btn[data-tab="reviews"]');
    if (reviewsTabBtn) {
      reviewsTabBtn.click();
      reviewsTabBtn.scrollIntoView({ behavior: 'smooth' });
    }
  });
  
  setupPolicyModal();
}

function toggleSidebar() {
  elements.sidebar.classList.toggle('active');
  elements.sidebarOverlay.classList.toggle('active');
}

function toggleCartDrawer() {
  elements.cartDrawer.classList.toggle('active');
  elements.cartDrawerOverlay.classList.toggle('active');
  if (elements.cartDrawer.classList.contains('active')) {
    renderCart();
  }
}

// ----------------------------------------------------
// 2. Rendering Product Details & Images Gallery
// ----------------------------------------------------

function renderProductDetails() {
  const p = currentProduct;

  // Title / Breadcrumbs
  document.title = `${p.name} - Nouna Shop`;
  elements.breadcrumbCategory.textContent = p.category;
  elements.breadcrumbName.textContent = p.name;
  elements.detailCategory.textContent = p.category;
  elements.detailName.textContent = p.name;

  // Price calculations
  elements.detailPrice.textContent = `${p.discountPrice || p.price} DA`;
  if (p.discountPrice) {
    elements.detailOldPrice.textContent = `${p.price} DA`;
    elements.detailOldPrice.style.display = 'inline';
    const pct = Math.round(((p.price - p.discountPrice) / p.price) * 100);
    elements.detailDiscount.textContent = `-${pct}% OFF`;
    elements.detailDiscount.style.display = 'block';
  } else {
    elements.detailOldPrice.style.display = 'none';
    elements.detailDiscount.style.display = 'none';
  }

  // Gallery main image
  elements.galleryMainImg.src = p.image;
  elements.galleryMainImg.onerror = function() {
    this.src = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80';
  };

  // Gallery thumbnails list rendering
  renderGalleryThumbnails();

  // Ratings
  renderProductAverageRating();

  // UrgencyVisitor FOMO numbers
  const visitors = Math.floor(Math.random() * 25) + 12;
  elements.detailUrgency.innerHTML = `<i class="fa-solid fa-fire"></i> <span><strong>${visitors} users</strong> are looking at this item! Only <strong>${p.stock} left</strong>.</span>`;
  elements.detailViews.innerHTML = `<i class="fa-solid fa-eye"></i> ${visitors} viewing`;

  // Stock details
  elements.detailStockCount.textContent = p.stock;
  const maxStock = 20;
  const stockPct = Math.round((p.stock / maxStock) * 100);
  elements.detailStockProgress.style.width = `${p.stock <= 0 ? 0 : Math.max(15, stockPct)}%`;
  
  if (p.stock <= 0) {
    elements.detailStockUrgency.textContent = 'Out of Stock';
    elements.detailStockUrgency.style.color = 'var(--danger)';
    elements.buyNowBtn.disabled = true;
    elements.buyNowBtn.innerHTML = '<i class="fa-solid fa-hourglass"></i> Out of Stock';
    elements.buyNowBtn.style.backgroundColor = '#ccc';
  } else if (p.stock <= 5) {
    elements.detailStockUrgency.textContent = `Only ${p.stock} left - order fast!`;
    elements.detailStockUrgency.style.color = 'var(--danger)';
    elements.buyNowBtn.disabled = false;
  } else {
    elements.detailStockUrgency.textContent = `Sold: ${p.sales || 0}`;
    elements.detailStockUrgency.style.color = 'var(--success)';
    elements.buyNowBtn.disabled = false;
  }

  // Tabs descriptions
  elements.detailDesc.textContent = p.description;
  elements.detailHowToUse.textContent = p.howToUse || "Apply daily for best results.";
  elements.detailIngredients.textContent = p.ingredients || "Formulated with premium beauty components.";

  // Render Reviews tab panel
  renderReviewsList();
}

function renderGalleryThumbnails() {
  const p = currentProduct;
  elements.galleryThumbnails.innerHTML = '';
  
  // Use array of images or fallback to the main image
  const imagesList = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image];

  imagesList.forEach((imgUrl, index) => {
    const thumb = document.createElement('div');
    thumb.className = `gallery-thumbnail-card ${imgUrl === elements.galleryMainImg.src ? 'active' : ''}`;
    thumb.innerHTML = `<img src="${imgUrl}" onerror="this.src='https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&q=80'">`;
    
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.gallery-thumbnail-card').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      
      // Fade swap main image
      elements.galleryMainImg.style.opacity = '0.3';
      setTimeout(() => {
        elements.galleryMainImg.src = imgUrl;
        elements.galleryMainImg.style.opacity = '1';
      }, 150);
    });

    elements.galleryThumbnails.appendChild(thumb);
  });
}

function renderProductAverageRating() {
  const count = productReviews.length;
  elements.detailReviewCount.textContent = `(${count} verified customer reviews)`;
  elements.tabReviewCount.textContent = count;

  elements.detailStars.innerHTML = '';
  if (count > 0) {
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Math.round(sum / count);
    for (let i = 0; i < 5; i++) {
      if (i < avg) {
        elements.detailStars.innerHTML += `<i class="fa-solid fa-star"></i>`;
      } else {
        elements.detailStars.innerHTML += `<i class="fa-regular fa-star" style="color: #ccc;"></i>`;
      }
    }
  } else {
    for (let i = 0; i < 5; i++) {
      elements.detailStars.innerHTML += `<i class="fa-regular fa-star" style="color: #ccc;"></i>`;
    }
  }
}

function switchTabPanel(tabName) {
  const panels = document.querySelectorAll('.product-tab-panel');
  panels.forEach(p => p.style.display = 'none');
  
  const target = document.getElementById(`panel-${tabName}`);
  if (target) {
    target.style.display = 'block';
  }
}

// ----------------------------------------------------
// 3. Purchase Quantity & Fly-to-Cart Animation
// ----------------------------------------------------

function adjustQty(val) {
  let curr = parseInt(elements.qtyValue.textContent);
  curr += val;
  if (curr < 1) curr = 1;
  if (currentProduct && curr > currentProduct.stock) {
    alert(`Only ${currentProduct.stock} items in stock right now.`);
    curr = currentProduct.stock;
  }
  elements.qtyValue.textContent = curr;
}

function handleBuyNow() {
  if (!currentProduct || currentProduct.stock <= 0) return;
  const qty = parseInt(elements.qtyValue.textContent);

  addToCart(currentProduct, qty);

  // Trigger Fly-to-Cart Animation
  const imgEl = elements.galleryMainImg;
  if (imgEl) {
    animateFlyToCart(imgEl);
    setTimeout(() => {
      toggleCartDrawer();
    }, 700);
  } else {
    toggleCartDrawer();
  }
}

function animateFlyToCart(sourceImg) {
  if (!sourceImg) return;
  
  const clone = sourceImg.cloneNode(true);
  clone.className = 'flying-cart-thumbnail';
  
  const rect = sourceImg.getBoundingClientRect();
  clone.style.top = `${rect.top}px`;
  clone.style.left = `${rect.left}px`;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.borderRadius = sourceImg.style.borderRadius || '8px';
  
  document.body.appendChild(clone);
  
  const cartBtn = elements.cartDrawerBtn;
  const cartRect = cartBtn.getBoundingClientRect();
  
  // Force a reflow
  clone.offsetWidth;
  
  clone.style.top = `${cartRect.top + 5}px`;
  clone.style.left = `${cartRect.left + 5}px`;
  clone.style.width = '20px';
  clone.style.height = '20px';
  clone.style.opacity = '0.1';
  clone.style.transform = 'rotate(720deg)';
  
  setTimeout(() => {
    clone.remove();
    cartBtn.style.animation = 'heartbeat 0.6s ease';
    setTimeout(() => { cartBtn.style.animation = ''; }, 600);
  }, 800);
}

// ----------------------------------------------------
// 4. Cart Logic & Synchronization
// ----------------------------------------------------

function addToCart(product, qty) {
  const existing = cart.find(item => item.id === product.id);
  
  if (existing) {
    if (existing.qty + qty > product.stock) {
      alert(`Sorry! We only have ${product.stock} items of this product left in stock.`);
      existing.qty = product.stock;
    } else {
      existing.qty += qty;
    }
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.discountPrice || product.price,
      image: product.image,
      maxStock: product.stock,
      qty: Math.min(qty, product.stock)
    });
  }
  
  saveCartToStorage();
  updateCartBadge();
}

function updateCartBadge() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  elements.cartBadgeCount.textContent = count;
  elements.cartBadgeCount.style.display = count > 0 ? 'flex' : 'none';
}

function renderCart() {
  elements.cartDrawerBody.innerHTML = '';
  
  if (cart.length === 0) {
    elements.cartDrawerBody.innerHTML = `
      <div class="empty-cart-view">
        <div class="empty-cart-icon"><i class="fa-solid fa-basket-shopping"></i></div>
        <p class="empty-cart-text">Your cart is currently empty</p>
        <p style="font-size: 0.9rem; margin-bottom: 20px;">Add some beautiful pink cosmetics to get started!</p>
        <button class="btn-primary" onclick="toggleCartDrawer()">Start Shopping</button>
      </div>
    `;
    elements.cartDrawerFooter.style.display = 'none';
    return;
  }
  
  elements.cartDrawerFooter.style.display = 'block';
  
  cart.forEach(item => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80'">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.name}</h4>
        <div class="cart-item-pricing">
          <span class="cart-item-price">${item.price} DA</span>
          <div class="qty-selector" style="padding: 2px;">
            <button class="qty-btn" onclick="updateCartItemQty('${item.id}', -1)" style="width: 24px; height: 24px; font-size: 0.8rem;"><i class="fa-solid fa-minus"></i></button>
            <span class="qty-value" style="width: 26px; font-size: 0.85rem;">${item.qty}</span>
            <button class="qty-btn" onclick="updateCartItemQty('${item.id}', 1)" style="width: 24px; height: 24px; font-size: 0.8rem;"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>
      </div>
      <button class="cart-item-remove-btn" onclick="removeCartItem('${item.id}')" aria-label="Remove item">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;
    elements.cartDrawerBody.appendChild(el);
  });
  
  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  elements.cartSubtotalPrice.textContent = `${subtotal} DA`;
  elements.cartEstimatedTotal.textContent = `${subtotal} DA`;
  
  const selectedWilayaVal = elements.checkoutWilaya.value;
  if (selectedWilayaVal) {
    const wl = storeWilayas.find(w => w.name === selectedWilayaVal);
    const shippingPrice = wl ? wl.price : 400;
    elements.cartEstimatedShipping.textContent = `${shippingPrice} DA`;
    elements.cartEstimatedTotal.textContent = `${subtotal + shippingPrice} DA`;
  } else {
    elements.cartEstimatedShipping.textContent = 'Calculated at checkout';
  }
}

window.updateCartItemQty = function(itemId, val) {
  const item = cart.find(item => item.id === itemId);
  if (!item) return;
  
  item.qty += val;
  if (item.qty <= 0) {
    removeCartItem(itemId);
    return;
  }
  
  if (item.qty > item.maxStock) {
    alert(`We only have ${item.maxStock} items of this product left in stock.`);
    item.qty = item.maxStock;
  }
  
  saveCartToStorage();
  updateCartBadge();
  renderCart();
};

window.removeCartItem = function(itemId) {
  cart = cart.filter(item => item.id !== itemId);
  saveCartToStorage();
  updateCartBadge();
  renderCart();
};

function populateWilayasDropdown() {
  elements.checkoutWilaya.innerHTML = '<option value="" disabled selected>-- Select your Wilaya (58 Provinces) --</option>';
  
  storeWilayas.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w.name;
    opt.textContent = `${w.name} (+${w.price} DA Delivery)`;
    opt.dataset.price = w.price;
    elements.checkoutWilaya.appendChild(opt);
  });
}

// ----------------------------------------------------
// 5. Checkout & Algerian Shipping Form Actions
// ----------------------------------------------------

function openCheckoutModal() {
  if (cart.length === 0) return;
  toggleCartDrawer();
  updateCheckoutCosts();
  elements.checkoutFormModal.classList.add('active');
}

function closeCheckoutModal() {
  elements.checkoutFormModal.classList.remove('active');
}

function updateCheckoutCosts() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  elements.checkoutBreakdownSubtotal.textContent = `${subtotal} DA`;
  
  const select = elements.checkoutWilaya;
  const selectedOption = select.options[select.selectedIndex];
  
  let deliveryCost = 0;
  if (selectedOption && !selectedOption.disabled) {
    deliveryCost = parseInt(selectedOption.dataset.price) || 0;
    elements.checkoutBreakdownShipping.textContent = `${deliveryCost} DA`;
  } else {
    elements.checkoutBreakdownShipping.textContent = 'Select Wilaya';
  }
  
  elements.checkoutBreakdownTotal.textContent = `${subtotal + deliveryCost} DA`;
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  
  if (cart.length === 0) return;
  
  const nameVal = elements.checkoutName.value.trim();
  const phoneVal = elements.checkoutPhone.value.trim();
  const wilayaVal = elements.checkoutWilaya.value;
  const baladiaVal = elements.checkoutBaladia.value.trim();
  
  // Validations
  if (nameVal.length < 3) {
    alert("Please enter a valid full name (minimum 3 characters).");
    return;
  }
  const phoneRegex = /^(0)(5|6|7|2)[0-9]{8}$/;
  if (!phoneRegex.test(phoneVal)) {
    alert("Please enter a valid Algerian phone number starting with 05, 06, 07, or 02 (e.g. 0550123456).");
    return;
  }
  if (!wilayaVal) {
    alert("Please select a Wilaya for shipping computations.");
    return;
  }
  if (baladiaVal.length < 2) {
    alert("Please enter your municipality (Baladia).");
    return;
  }

  const submitBtn = document.getElementById("place-order-submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Processing Checkout...";
  
  try {
    const orderPayload = {
      name: nameVal,
      phone: phoneVal,
      wilaya: wilayaVal,
      baladia: baladiaVal,
      items: cart.map(item => ({
        id: item.id,
        qty: item.qty
      }))
    };
    
    const response = await API.createOrder(orderPayload);
    const newOrder = response.order;
    
    // Clear cart and UI update
    cart = [];
    saveCartToStorage();
    updateCartBadge();
    closeCheckoutModal();
    
    // Success triggers: CONFETTI + beautiful custom congrats overlay modal
    fireConfetti();
    
    // Populate custom Congratulations UI details
    elements.successClientName.textContent = nameVal;
    elements.successOrderCode.textContent = newOrder.id;
    elements.successOrderAddress.textContent = `${newOrder.customer.baladia}, ${newOrder.customer.wilaya}`;
    elements.successOrderPhone.textContent = phoneVal;
    elements.successOrderTotal.textContent = `${newOrder.total} DA`;
    
    // Display Success Congrats Modal
    elements.successModal.classList.add('active');
    
    // Reload local product details because stock has decreased
    initProductPage();
    elements.checkoutOrderForm.reset();
  } catch (err) {
    alert("⚠️ checkout error: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirm Order (Cash on Delivery)";
  }
}

// ----------------------------------------------------
// 6. Interactive Customer Reviews Form
// ----------------------------------------------------

function setupReviewsForm() {
  const writeReviewToggle = document.getElementById('write-review-toggle');
  const writeReviewFormContainer = document.getElementById('write-review-form-container');
  const reviewStarsSelector = document.getElementById('review-stars-selector');
  const reviewRatingValue = document.getElementById('review-rating-value');
  const submitReviewForm = document.getElementById('submit-review-form');
  const reviewSuccessBanner = document.getElementById('review-success-banner');

  if (writeReviewToggle) {
    writeReviewToggle.addEventListener('click', () => {
      const isCollapsed = writeReviewFormContainer.style.maxHeight === '0px' || !writeReviewFormContainer.style.maxHeight;
      if (isCollapsed) {
        writeReviewFormContainer.style.maxHeight = '450px';
        writeReviewFormContainer.style.border = '1px solid var(--border-color)';
        writeReviewFormContainer.style.marginTop = '15px';
        writeReviewToggle.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancel';
      } else {
        closeReviewForm();
      }
    });
  }

  function closeReviewForm() {
    if (writeReviewFormContainer) {
      writeReviewFormContainer.style.maxHeight = '0px';
      writeReviewFormContainer.style.border = '1px solid transparent';
      writeReviewFormContainer.style.marginTop = '0px';
    }
    if (writeReviewToggle) {
      writeReviewToggle.innerHTML = '<i class="fa-solid fa-pen"></i> Write a Review';
    }
    if (submitReviewForm) {
      submitReviewForm.reset();
    }
    resetStarsSelector();
  }

  function resetStarsSelector() {
    if (reviewRatingValue) reviewRatingValue.value = '5';
    if (reviewStarsSelector) {
      const stars = reviewStarsSelector.querySelectorAll('.selector-star');
      stars.forEach(star => {
        star.style.color = '#ffd43b'; // Default to 5 stars highlighted
        star.className = 'fa-solid fa-star selector-star';
      });
    }
  }

  // Interactive Stars Selector logic
  if (reviewStarsSelector) {
    const stars = reviewStarsSelector.querySelectorAll('.selector-star');
    
    const colorStars = (rating) => {
      stars.forEach((star, idx) => {
        const starRating = idx + 1;
        if (starRating <= rating) {
          star.style.color = '#ffd43b'; // Gold
          star.className = 'fa-solid fa-star selector-star';
        } else {
          star.style.color = '#ccc'; // Gray
          star.className = 'fa-regular fa-star selector-star';
        }
      });
    };

    // Color default (5 stars)
    colorStars(5);

    stars.forEach(star => {
      star.addEventListener('mouseover', () => {
        const hoverVal = parseInt(star.dataset.rating);
        colorStars(hoverVal);
      });

      star.addEventListener('mouseout', () => {
        const activeVal = parseInt(reviewRatingValue.value) || 5;
        colorStars(activeVal);
      });

      star.addEventListener('click', () => {
        const selectVal = parseInt(star.dataset.rating);
        reviewRatingValue.value = selectVal.toString();
        colorStars(selectVal);
      });
    });
  }

  // Submit Review form logic
  if (submitReviewForm) {
    submitReviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentProduct) return;

      const nameVal = document.getElementById('review-author-name').value.trim();
      const ratingVal = parseInt(reviewRatingValue.value) || 5;
      const textVal = document.getElementById('review-comment-text').value.trim();

      const submitBtn = submitReviewForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Submitting Review...';

      try {
        await API.submitReview({
          productId: currentProduct.id,
          name: nameVal,
          rating: ratingVal,
          text: textVal
        });

        // Close form
        closeReviewForm();

        // Show success banner
        if (reviewSuccessBanner) {
          reviewSuccessBanner.style.display = 'block';
          setTimeout(() => {
            reviewSuccessBanner.style.display = 'none';
          }, 6000);
        }
      } catch (err) {
        alert("⚠️ Review error: " + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit For Admin Approval <i class="fa-solid fa-paper-plane" style="margin-left: 6px;"></i>';
      }
    });
  }
}

function renderReviewsList() {
  const container = elements.reviewsContainer;
  container.innerHTML = '';

  if (productReviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--text-muted); background: var(--bg-light); border-radius: var(--border-radius-md);">
        <i class="fa-regular fa-comments" style="font-size: 2rem; color: var(--secondary); margin-bottom: 8px; display: block;"></i>
        No reviews yet. Be the first to share your experience with this beauty product!
      </div>
    `;
    return;
  }

  productReviews.forEach(rev => {
    const item = document.createElement('div');
    item.className = 'review-item';
    
    let reviewStars = '';
    for (let i = 0; i < 5; i++) {
      if (i < rev.rating) {
        reviewStars += `<i class="fa-solid fa-star"></i>`;
      } else {
        reviewStars += `<i class="fa-regular fa-star" style="color: #ccc;"></i>`;
      }
    }
    
    item.innerHTML = `
      <div class="review-item-header">
        <span class="review-user">${rev.name} <span style="color: var(--success); font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> Verified Buyer</span></span>
        <span class="review-date">${rev.date}</span>
      </div>
      <div class="stars" style="margin-bottom: 8px; font-size: 0.75rem;">${reviewStars}</div>
      <p class="review-text">"${rev.text}"</p>
    `;
    container.appendChild(item);
  });
}

// ----------------------------------------------------
// 7. Looping urgency timers
// ----------------------------------------------------

function startUrgencyTriggers() {
  let timeInSeconds = 15 * 60;
  setInterval(() => {
    timeInSeconds--;
    if (timeInSeconds < 0) {
      timeInSeconds = 15 * 60;
    }
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    elements.flashSaleTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

// ----------------------------------------------------
// 8. Confetti Physics Canvas
// ----------------------------------------------------

function fireConfetti() {
  const canvas = elements.confettiCanvas;
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const colors = ['#ff4d80', '#ff85a2', '#ffd3e0', '#ffd43b', '#2ecc71', '#ffffff'];
  const particles = [];
  const particleCount = 150;
  
  class Confetti {
    constructor() {
      this.x = canvas.width / 2;
      this.y = canvas.height / 2;
      this.radius = Math.random() * 6 + 4;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.speedX = Math.random() * 12 - 6;
      this.speedY = Math.random() * -15 - 5;
      this.gravity = 0.4;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 6 - 3;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.speedY += this.gravity;
      this.rotation += this.rotationSpeed;
    }
    
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation * Math.PI / 180);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius);
      ctx.restore();
    }
  }
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Confetti());
  }
  
  let animationId;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let active = false;
    particles.forEach(p => {
      p.update();
      p.draw();
      if (p.y < canvas.height) active = true;
    });
    
    if (active) {
      animationId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationId);
    }
  }
  
  animate();
  
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

function handleSearchRedirect() {
  const query = elements.searchInput.value.trim();
  if (query) {
    window.location.href = `index.html?search=${encodeURIComponent(query)}`;
  } else {
    window.location.href = `index.html`;
  }
}

function renderSidebarCategories() {
  if (!elements.sidebarCategoriesList) return;
  elements.sidebarCategoriesList.innerHTML = '';
  
  storeCategories.filter(c => c !== "All").forEach(cat => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `index.html?category=${encodeURIComponent(cat)}`;
    link.className = 'sidebar-link';
    link.innerHTML = `<i class="fa-solid fa-angle-right"></i> ${cat}`;
    li.appendChild(link);
    elements.sidebarCategoriesList.appendChild(li);
  });
}

function setupPolicyModal() {
  const policyBtns = document.querySelectorAll('[data-policy]');
  const policyModal = document.getElementById('policy-modal');
  const policyTitle = document.getElementById('policy-modal-title');
  const policyContent = document.getElementById('policy-modal-content');
  const policyCloseBtn = document.getElementById('policy-modal-close-btn');

  const policies = {
    payment: {
      title: "💰 Payment Methods (Cash on Delivery)",
      content: `
        <p style="margin-bottom: 12px;"><strong>Cash on Delivery (COD)</strong> is our exclusive payment method to ensure 100% security for all beauty lovers in Algeria.</p>
        <p style="margin-bottom: 12px;">Here is how it works:</p>
        <ul style="margin-left: 20px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px;">
          <li>🛒 Browse our store, add items to your cart, and enter your shipping details at checkout.</li>
          <li>📞 Our support team will call you within 24 hours to confirm your order details and delivery address.</li>
          <li>🚚 The package is dispatched and shipped directly to your house or office.</li>
          <li>💵 You pay the delivery agent in cash only when you receive and inspect your parcel!</li>
        </ul>
        <p>No credit card, CIB card, or BaridiMob transfer is needed. Shop with absolute safety and peace of mind!</p>
      `
    },
    shipping: {
      title: "🚚 Shipping & Delivery Policy",
      content: `
        <p style="margin-bottom: 12px;">We ship premium cosmetics directly to your doorstep across all <strong>58 Wilayas of Algeria</strong>!</p>
        <ul style="margin-left: 20px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px;">
          <li>⏱️ <strong>Delivery Time</strong>: 2 to 5 business days depending on your province's distance.</li>
          <li>📦 <strong>Courier Call</strong>: The delivery driver will phone you on the day of delivery to coordinate the exact drop-off time. Please keep your phone nearby!</li>
          <li>📍 <strong>Coverage</strong>: Home delivery is available for all major municipalities and cities.</li>
        </ul>
        <p>Shipping rates are automatically computed at checkout based on your selected Wilaya. We work with Algeria's leading logistics networks to guarantee fast, safe transit of your cosmetics.</p>
      `
    },
    terms: {
      title: "📋 Terms & Conditions",
      content: `
        <p style="margin-bottom: 12px;">Welcome to Nouna Shop. By placing an order, you agree to the following terms:</p>
        <ul style="margin-left: 20px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px;">
          <li>📞 <strong>Order Confirmation</strong>: Every order requires a phone confirmation. We will call the phone number you provided. If we cannot reach you after multiple attempts, the order will be cancelled.</li>
          <li>💄 <strong>Hygiene Policy</strong>: Due to the nature of cosmetics and personal hygiene products, opened or used makeup, lipsticks, and skincare items cannot be returned or refunded.</li>
          <li>⚠️ <strong>Incorrect Details</strong>: Please ensure your phone number and Wilaya are correct. Orders with fake numbers will be automatically deleted by our system.</li>
        </ul>
      `
    },
    security: {
      title: "🔒 100% Security Guarantee",
      content: `
        <p style="margin-bottom: 12px;">Your privacy and shopping security are our top priorities at Nouna Shop.</p>
        <ul style="margin-left: 20px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px;">
          <li>🛡️ <strong>Zero Financial Risk</strong>: Since we operate 100% on Cash on Delivery, you never enter credit card numbers, passwords, or bank logins. Online fraud is impossible.</li>
          <li>👤 <strong>Data Privacy</strong>: Your name, phone number, and address are encrypted in our databases. We only share them with the delivery dispatchers to ship your order. We never sell or share your data with third parties.</li>
          <li>✅ <strong>Genuine Products</strong>: All products on our storefront are authentic, dermatologically tested, and sourced from certified partners.</li>
        </ul>
      `
    }
  };

  if (policyBtns && policyModal) {
    policyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const type = btn.dataset.policy;
        if (policies[type]) {
          policyTitle.innerHTML = policies[type].title;
          policyContent.innerHTML = policies[type].content;
          policyModal.classList.add('active');
        }
      });
    });

    if (policyCloseBtn) {
      policyCloseBtn.addEventListener('click', () => {
        policyModal.classList.remove('active');
      });
    }

    policyModal.addEventListener('click', (e) => {
      if (e.target === policyModal) {
        policyModal.classList.remove('active');
      }
    });
  }
}
