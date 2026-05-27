// Nouna Shop - Client-Side Storefront Application Script

// Global Cache State (Fetched from Server)
let storeProducts = [];
let storeCategories = [];
let storeWilayas = [];
let storeReviews = [];

// Global Cart State
let cart = [];
let selectedProductForModal = null;

// DOM Elements
const elements = {
  announcementBar: document.getElementById('announcement-bar'),
  flashSaleTimer: document.getElementById('flash-sale-timer'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
  sidebarToggleBtn: document.getElementById('sidebar-toggle-btn'),
  sidebarCloseBtn: document.getElementById('sidebar-close-btn'),
  sidebarCategoriesList: document.getElementById('sidebar-categories-list'),
  sidebarHomeLink: document.getElementById('sidebar-home-link'),
  sidebarAdminLink: document.getElementById('sidebar-admin-link'),
  logoNavLink: document.getElementById('logo-nav-link'),
  searchToggleBtn: document.getElementById('search-toggle-btn'),
  headerSearchBar: document.getElementById('header-search-bar'),
  desktopHeaderNav: document.getElementById('desktop-header-nav'),
  searchBtn: document.getElementById('search-btn'),
  searchInput: document.getElementById('search-input'),
  cartDrawerBtn: document.getElementById('cart-drawer-btn'),
  cartBadgeCount: document.getElementById('cart-badge-count'),
  cartDrawerOverlay: document.getElementById('cart-drawer-overlay'),
  cartDrawer: document.getElementById('cart-drawer'),
  cartDrawerCloseBtn: document.getElementById('cart-drawer-close-btn'),
  cartDrawerBody: document.getElementById('cart-drawer-body'),
  cartDrawerFooter: document.getElementById('cart-drawer-footer'),
  cartSubtotalPrice: document.getElementById('cart-subtotal-price'),
  cartEstimatedTotal: document.getElementById('cart-estimated-total'),
  cartEstimatedShipping: document.getElementById('cart-estimated-shipping'),
  cartCheckoutBtnTrigger: document.getElementById('cart-checkout-btn-trigger'),
  categoryPillsList: document.getElementById('category-pills-list'),
  productsGridContainer: document.getElementById('products-grid-container'),
  gridSectionTitle: document.getElementById('grid-section-title'),
  
  // Details Modal
  productDetailsModal: document.getElementById('product-details-modal'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalProductImage: document.getElementById('modal-product-image'),
  modalProductDiscount: document.getElementById('modal-product-discount'),
  modalProductCategory: document.getElementById('modal-product-category'),
  modalProductName: document.getElementById('modal-product-name'),
  modalProductStars: document.getElementById('modal-product-stars'),
  modalProductReviewCount: document.getElementById('modal-product-review-count'),
  modalProductPrice: document.getElementById('modal-product-price'),
  modalProductOldPrice: document.getElementById('modal-product-old-price'),
  modalUrgencyText: document.getElementById('modal-urgency-text'),
  modalProductDesc: document.getElementById('modal-product-desc'),
  modalQtyMinus: document.getElementById('modal-qty-minus'),
  modalQtyPlus: document.getElementById('modal-qty-plus'),
  modalQtyValue: document.getElementById('modal-qty-value'),
  modalBuyNowBtn: document.getElementById('modal-buy-now-btn'),
  modalReviewsContainer: document.getElementById('modal-reviews-container'),

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
  
  // Hero Section
  heroCtaBtn: document.getElementById('hero-cta-btn'),
  
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
  initApp();
  setupEventListeners();
  startUrgencyTriggers();
});

async function initApp() {
  try {
    // Load storefront catalog and routing data from Server API
    storeProducts = await API.getProducts();
    storeCategories = await API.getCategories();
    storeWilayas = await API.getWilayas();
    storeReviews = await API.getReviews();

    renderCategoryPills();
    renderSidebarCategories();
    renderProducts();
    populateWilayasDropdown();
    updateCartBadge();

    // Parse URL query parameters for deep linking
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    const searchParam = urlParams.get('search');

    if (categoryParam) {
      const targetCategory = categoryParam === "All" ? "All" : categoryParam;
      // Sync storefront category pills
      const pills = document.querySelectorAll('.category-pill');
      pills.forEach(p => {
        if ((p.dataset.category || '').toLowerCase() === targetCategory.toLowerCase()) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
      filterProducts(targetCategory);
    } else if (searchParam) {
      elements.searchInput.value = searchParam;
      if (elements.headerSearchBar) {
        elements.headerSearchBar.classList.add('active');
      }
      handleSearch();
    }
  } catch (err) {
    console.error("Store initialization failed:", err);
    elements.productsGridContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--danger);">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; margin-bottom: 12px;"></i>
        <p style="font-weight: 700;">Could not connect to Nouna Shop Server.</p>
        <p style="font-size:0.9rem; color:var(--text-muted);">Please make sure the server script is running (node server.js).</p>
      </div>
    `;
  }
}

function setupEventListeners() {
  // Navigation / Sidebar Links
  elements.sidebarToggleBtn.addEventListener('click', toggleSidebar);
  elements.sidebarCloseBtn.addEventListener('click', toggleSidebar);
  elements.sidebarOverlay.addEventListener('click', toggleSidebar);
  elements.sidebarHomeLink.addEventListener('click', (e) => { e.preventDefault(); filterProducts("All"); toggleSidebar(); });
  elements.logoNavLink.addEventListener('click', (e) => { e.preventDefault(); filterProducts("All"); });

  // Desktop Header Nav Category Clicks
  if (elements.desktopHeaderNav) {
    const navLinks = elements.desktopHeaderNav.querySelectorAll('.header-nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = link.dataset.category || "All";
        filterProducts(cat);
        
        // Sync storefront category pills active class
        const pills = document.querySelectorAll('.category-pill');
        pills.forEach(p => {
          if ((p.dataset.category || '').toLowerCase() === cat.toLowerCase()) {
            p.classList.add('active');
          } else {
            p.classList.remove('active');
          }
        });
      });
    });
  }

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

  // Search
  elements.searchBtn.addEventListener('click', handleSearch);
  elements.searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });

  // Details Modal Quantity Selectors
  elements.modalQtyMinus.addEventListener('click', () => adjustModalQty(-1));
  elements.modalQtyPlus.addEventListener('click', () => adjustModalQty(1));
  elements.modalCloseBtn.addEventListener('click', closeProductModal);
  elements.modalBuyNowBtn.addEventListener('click', handleModalBuyNow);

  // Checkout Form
  elements.checkoutModalCloseBtn.addEventListener('click', closeCheckoutModal);
  elements.checkoutWilaya.addEventListener('change', updateCheckoutCosts);
  elements.checkoutOrderForm.addEventListener('submit', handleCheckoutSubmit);
  elements.successCloseBtn.addEventListener('click', () => elements.successModal.classList.remove('active'));

  // Hero CTA
  elements.heroCtaBtn.addEventListener('click', () => {
    elements.productsGridContainer.scrollIntoView({ behavior: 'smooth' });
  });

  // Review Form Toggling & Submission Event Handlers
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
      if (!selectedProductForModal) return;

      const nameVal = document.getElementById('review-author-name').value.trim();
      const ratingVal = parseInt(reviewRatingValue.value) || 5;
      const textVal = document.getElementById('review-comment-text').value.trim();

      const submitBtn = submitReviewForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Submitting Review...';

      try {
        await API.submitReview({
          productId: selectedProductForModal.id,
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
// 2. Rendering Products & Category Pills
// ----------------------------------------------------

function renderCategoryPills() {
  elements.categoryPillsList.innerHTML = '';
  
  storeCategories.forEach((cat, index) => {
    const pill = document.createElement('button');
    pill.className = `category-pill ${index === 0 ? 'active' : ''}`;
    pill.textContent = cat;
    pill.dataset.category = cat;
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filterProducts(cat);
    });
    elements.categoryPillsList.appendChild(pill);
  });
}

function renderSidebarCategories() {
  elements.sidebarCategoriesList.innerHTML = '';
  
  // Skip "All" for sidebar, just actual categories
  storeCategories.filter(c => c !== "All").forEach(cat => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'sidebar-link';
    link.innerHTML = `<i class="fa-solid fa-angle-right"></i> ${cat}`;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      filterProducts(cat);
      toggleSidebar();
      
      // Update corresponding storefront active pill
      document.querySelectorAll('.category-pill').forEach(p => {
        if (p.dataset.category === cat) p.classList.add('active');
        else p.classList.remove('active');
      });
    });
    li.appendChild(link);
    elements.sidebarCategoriesList.appendChild(li);
  });
}

function renderProducts(productsToRender = null) {
  const products = productsToRender || storeProducts;
  elements.productsGridContainer.innerHTML = '';
  
  if (products.length === 0) {
    elements.productsGridContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fa-regular fa-face-frown" style="font-size: 3rem; margin-bottom: 12px; color: var(--secondary)"></i>
        <p style="font-weight: 600;">No products found matches your search or category.</p>
      </div>
    `;
    return;
  }
  
  products.forEach(p => {
    const pct = p.discountPrice ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0;
    const liveViewCount = Math.floor(Math.random() * 20) + 12;
    const maxStock = 20;
    const stockPct = Math.round((p.stock / maxStock) * 100);
    const lowStockWarning = p.stock <= 5;
    const isOutOfStock = p.stock <= 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      ${pct > 0 ? `<span class="product-badge-discount">-${pct}% OFF</span>` : ''}
      <span class="product-badge-views"><i class="fa-solid fa-eye"></i> ${liveViewCount} viewing</span>
      
      <div class="product-image-wrapper" onclick="window.location.href='product.html?id=${p.id}'">
        <img src="${p.image}" alt="${p.name}" class="product-card-img" onerror="this.src='https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80'">
      </div>
      
      <div class="product-info-wrapper">
        <span class="product-card-category">${p.category}</span>
        <h3 class="product-card-title" onclick="window.location.href='product.html?id=${p.id}'">${p.name}</h3>
        
        <div class="product-rating">
          <div class="stars">
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star${p.views % 2 === 0 ? '-half-stroke' : ''}"></i>
          </div>
          <span class="review-count">(${p.sales ? Math.floor(p.sales / 12) + 5 : 12} reviews)</span>
        </div>
        
        <div class="product-pricing">
          <span class="current-price">${p.discountPrice ? p.discountPrice : p.price} DA</span>
          ${p.discountPrice ? `<span class="old-price">${p.price} DA</span>` : ''}
        </div>
        
        <div class="stock-status-bar">
          <div class="stock-status-text">
            <span>In stock: <strong>${p.stock}</strong></span>
            ${isOutOfStock ? `<span class="stock-text-urgency" style="animation:none;">Out of stock</span>` : 
              (lowStockWarning ? `<span class="stock-text-urgency"><i class="fa-solid fa-triangle-exclamation"></i> Only ${p.stock} left!</span>` : `<span>Sold: ${p.sales}</span>`)}
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${isOutOfStock ? 0 : Math.max(15, stockPct)}%"></div>
          </div>
        </div>
        
        <button class="add-to-cart-btn ${lowStockWarning && !isOutOfStock ? 'pulsing' : ''}" 
                onclick="quickAddToCart('${p.id}', event)" 
                ${isOutOfStock ? 'disabled style="background-color:#ccc;color:#777;border-color:#ccc;cursor:not-allowed;"' : ''}>
          <i class="fa-solid ${isOutOfStock ? 'fa-hourglass' : 'fa-cart-plus'}"></i> ${isOutOfStock ? 'Sold Out' : 'Buy Now (COD)'}
        </button>
      </div>
    `;
    elements.productsGridContainer.appendChild(card);
  });
}

function filterProducts(category) {
  elements.gridSectionTitle.textContent = category === "All" ? "All Products" : `Best of ${category}`;
  
  // Sync desktop header nav active states
  if (elements.desktopHeaderNav) {
    const navLinks = elements.desktopHeaderNav.querySelectorAll('.header-nav-link');
    navLinks.forEach(l => {
      if ((l.dataset.category || "All").toLowerCase() === category.toLowerCase()) {
        l.classList.add('active');
      } else {
        l.classList.remove('active');
      }
    });
  }

  if (category === "All") {
    renderProducts(storeProducts);
  } else {
    const filtered = storeProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
    renderProducts(filtered);
  }
}

function handleSearch() {
  const query = elements.searchInput.value.trim().toLowerCase();
  
  if (!query) {
    renderProducts(storeProducts);
    elements.gridSectionTitle.textContent = "All Products";
    return;
  }
  
  const filtered = storeProducts.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.description.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query)
  );
  
  elements.gridSectionTitle.textContent = `Search results for: "${elements.searchInput.value}"`;
  renderProducts(filtered);
  elements.productsGridContainer.scrollIntoView({ behavior: 'smooth' });
}

// ----------------------------------------------------
// 3. Product Details Modal & Instant Cart Checkouts
// ----------------------------------------------------

window.openProductModal = function(productId) {
  const product = storeProducts.find(p => p.id === productId);
  if (!product) return;
  
  selectedProductForModal = product;
  elements.modalProductImage.src = product.image;
  elements.modalProductImage.onerror = function() {
    this.src = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80';
  };
  
  const pct = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  if (pct > 0) {
    elements.modalProductDiscount.textContent = `-${pct}% OFF`;
    elements.modalProductDiscount.style.display = 'block';
  } else {
    elements.modalProductDiscount.style.display = 'none';
  }
  
  elements.modalProductCategory.textContent = product.category;
  elements.modalProductName.textContent = product.name;
  elements.modalProductPrice.textContent = `${product.discountPrice || product.price} DA`;
  elements.modalProductOldPrice.textContent = product.discountPrice ? `${product.price} DA` : '';
  elements.modalProductDesc.textContent = product.description;
  elements.modalQtyValue.textContent = "1";
  
  // Set random visitors lookups (FOMO)
  const visitors = Math.floor(Math.random() * 25) + 10;
  elements.modalUrgencyText.innerHTML = `🔥 <strong>${visitors} users</strong> are looking at this item. Only <strong>${product.stock} items left</strong> in stock!`;
  
  // Ratings and reviews count
  const salesCount = product.sales || 142;
  const reviewCountVal = Math.floor(salesCount / 12) + 5;
  elements.modalProductReviewCount.textContent = `(${reviewCountVal} verified customer reviews)`;
  
  elements.modalProductStars.innerHTML = '';
  for(let i=0; i<5; i++) {
    elements.modalProductStars.innerHTML += `<i class="fa-solid fa-star"></i>`;
  }
  
  renderModalReviews(product.id);
  
  // Manage stock restrictions on Buy button
  if (product.stock <= 0) {
    elements.modalBuyNowBtn.disabled = true;
    elements.modalBuyNowBtn.innerHTML = '<i class="fa-solid fa-hourglass"></i> Out of Stock';
    elements.modalBuyNowBtn.style.backgroundColor = '#ccc';
  } else {
    elements.modalBuyNowBtn.disabled = false;
    elements.modalBuyNowBtn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Instant Buy (Cash On Delivery)';
    elements.modalBuyNowBtn.style.backgroundColor = '';
  }
  
  elements.productDetailsModal.classList.add('active');
};

function closeProductModal() {
  elements.productDetailsModal.classList.remove('active');
  selectedProductForModal = null;
  
  // Reset review form when modal closes
  const writeReviewFormContainer = document.getElementById('write-review-form-container');
  if (writeReviewFormContainer) {
    writeReviewFormContainer.style.maxHeight = '0px';
    writeReviewFormContainer.style.border = '1px solid transparent';
  }
  const writeReviewToggle = document.getElementById('write-review-toggle');
  if (writeReviewToggle) {
    writeReviewToggle.innerHTML = '<i class="fa-solid fa-pen"></i> Write a Review';
  }
  const reviewSuccessBanner = document.getElementById('review-success-banner');
  if (reviewSuccessBanner) {
    reviewSuccessBanner.style.display = 'none';
  }
}

function adjustModalQty(val) {
  let curr = parseInt(elements.modalQtyValue.textContent);
  curr += val;
  if (curr < 1) curr = 1;
  if (selectedProductForModal && curr > selectedProductForModal.stock) {
    alert(`Only ${selectedProductForModal.stock} items in stock right now.`);
    curr = selectedProductForModal.stock;
  }
  elements.modalQtyValue.textContent = curr;
}

async function renderModalReviews(productId) {
  elements.modalReviewsContainer.innerHTML = '';
  
  try {
    const reviews = await API.getProductReviews(productId);
    
    // Update review counts & stars in the details modal dynamically
    elements.modalProductReviewCount.textContent = `(${reviews.length} verified reviews)`;
    
    if (reviews.length > 0) {
      // Calculate average rating
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = Math.round(sum / reviews.length);
      elements.modalProductStars.innerHTML = '';
      for (let i = 0; i < 5; i++) {
        if (i < avg) {
          elements.modalProductStars.innerHTML += `<i class="fa-solid fa-star"></i>`;
        } else {
          elements.modalProductStars.innerHTML += `<i class="fa-regular fa-star" style="color: #ccc;"></i>`;
        }
      }
    } else {
      elements.modalProductStars.innerHTML = `<i class="fa-regular fa-star" style="color: #ccc;"></i><i class="fa-regular fa-star" style="color: #ccc;"></i><i class="fa-regular fa-star" style="color: #ccc;"></i><i class="fa-regular fa-star" style="color: #ccc;"></i><i class="fa-regular fa-star" style="color: #ccc;"></i>`;
      elements.modalReviewsContainer.innerHTML = `
        <div style="text-align: center; padding: 20px 10px; color: var(--text-muted); font-size: 0.85rem; background: var(--bg-light); border-radius: var(--border-radius-md);">
          <i class="fa-regular fa-comments" style="font-size: 1.8rem; margin-bottom: 8px; display: block; color: var(--secondary);"></i>
          No reviews yet. Be the first to share your experience!
        </div>
      `;
      return;
    }

    reviews.forEach(rev => {
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
        <div class="stars" style="margin-bottom: 6px; font-size: 0.75rem;">${reviewStars}</div>
        <p class="review-text">"${rev.text}"</p>
      `;
      elements.modalReviewsContainer.appendChild(item);
    });
  } catch (err) {
    console.error("Failed to load reviews:", err);
    elements.modalReviewsContainer.innerHTML = `<p style="font-size: 0.8rem; color: var(--danger); text-align: center; padding: 10px;">Failed to fetch customer reviews.</p>`;
  }
}

// Fly-to-cart animation helper
function animateFlyToCart(sourceImg) {
  if (!sourceImg) return;
  
  const clone = sourceImg.cloneNode(true);
  clone.classList.add('flying-cart-thumbnail');
  
  const rect = sourceImg.getBoundingClientRect();
  clone.style.top = `${rect.top}px`;
  clone.style.left = `${rect.left}px`;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.borderRadius = sourceImg.style.borderRadius || '8px';
  
  document.body.appendChild(clone);
  
  const cartBtn = elements.cartDrawerBtn;
  const cartRect = cartBtn.getBoundingClientRect();
  
  // Force browser layout reflow
  clone.offsetWidth;
  
  // Animate thumbnail transition to cart bag coordinates
  clone.style.top = `${cartRect.top + 5}px`;
  clone.style.left = `${cartRect.left + 5}px`;
  clone.style.width = '20px';
  clone.style.height = '20px';
  clone.style.opacity = '0.1';
  clone.style.transform = 'rotate(720deg)';
  
  setTimeout(() => {
    clone.remove();
    // Bounce the cart icon on arrival
    cartBtn.style.animation = 'heartbeat 0.6s ease';
    setTimeout(() => { cartBtn.style.animation = ''; }, 600);
  }, 800);
}

// Quick Add to Cart
window.quickAddToCart = function(productId, event) {
  if (event) event.stopPropagation();
  
  const product = storeProducts.find(p => p.id === productId);
  if (!product || product.stock <= 0) return;
  
  let imgEl = null;
  if (event && event.target) {
    const card = event.target.closest('.product-card');
    if (card) {
      imgEl = card.querySelector('.product-card-img');
    }
  }
  
  addToCart(product, 1);
  
  if (imgEl) {
    animateFlyToCart(imgEl);
    // Delay cart opening slightly to let user watch the animation
    setTimeout(() => {
      toggleCartDrawer();
    }, 700);
  } else {
    toggleCartDrawer();
  }
};

function handleModalBuyNow() {
  if (!selectedProductForModal || selectedProductForModal.stock <= 0) return;
  const qty = parseInt(elements.modalQtyValue.textContent);
  
  const imgEl = elements.modalProductImage;
  
  addToCart(selectedProductForModal, qty);
  closeProductModal();
  
  if (imgEl) {
    animateFlyToCart(imgEl);
    setTimeout(() => {
      toggleCartDrawer();
    }, 700);
  } else {
    toggleCartDrawer();
  }
}

// ----------------------------------------------------
// 4. Cart Logic & Calculations
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
  
  // Calculate Totals
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
  
  updateCartBadge();
  renderCart();
};

window.removeCartItem = function(itemId) {
  cart = cart.filter(item => item.id !== itemId);
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
// 5. Checkout & Purchases Calculator (Algeria Shipping Fees)
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
  
  // Frontend Validations
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

  // Disable button to prevent double-submit clicking
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
    
    // Submit order payload directly to server backend Express API
    const response = await API.createOrder(orderPayload);
    const newOrder = response.order;
    
    // Clear cart and UI update
    cart = [];
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
    
    // Reload server catalog data (due to stock updates)
    storeProducts = await API.getProducts();
    renderProducts();
    
    elements.checkoutOrderForm.reset();
  } catch (err) {
    alert("⚠️ checkout error: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirm Order (Cash on Delivery)";
  }
}

// ----------------------------------------------------
// 6. Urgency Cycles (FOMO & Live triggers)
// ----------------------------------------------------

function startUrgencyTriggers() {
  // Flash Sale Timer Cycle (15 minutes looping)
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
// 7. Confetti Canvas Physics Engine
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
