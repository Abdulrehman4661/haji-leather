/**
 * HAJI LEATHER — E-COMMERCE JAVASCRIPT ENGINE
 * Modeled after Luxwearz (luxwearz.com)
 * Handles Catalog Filtering, Cart, Checkout with Stripe & Payment Methods,
 * Dynamic Quick View, Wishlist, WhatsApp Integration & Mobile Drawer
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Data Store Initialization
  const rawProducts = window.HAJI_PRODUCTS || [];
  let currentCategory = 'all';
  let searchQuery = '';
  let currentSort = 'featured';
  let activeCoupon = null; // { code: 'WELCOME15', percent: 15 }

  // Load Cart & Wishlist from localStorage
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem('hl_cart') || '[]');
  } catch (e) {
    cart = [];
  }

  let wishlist = [];
  try {
    wishlist = JSON.parse(localStorage.getItem('hl_wishlist') || '[]');
  } catch (e) {
    wishlist = [];
  }

  // 2. DOM Elements
  const productsGrid = document.getElementById('products-grid');
  const visibleCountEl = document.getElementById('visible-count');
  const noProductsEl = document.getElementById('no-products');
  const categoryTabs = document.getElementById('category-tabs');
  const sortSelect = document.getElementById('sort-select');

  // Search
  const headerSearchInput = document.getElementById('header-search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const mobileSearchBar = document.getElementById('mobile-search-bar');
  const mobileSearchToggle = document.getElementById('mobile-search-toggle');
  const mobileBarSearch = document.getElementById('mobile-bar-search');

  // Mobile Drawer
  const mobileMenuOpenBtn = document.getElementById('mobile-menu-open');
  const mobileMenuCloseBtn = document.getElementById('mobile-menu-close');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');

  // Cart Drawer
  const cartDrawer = document.getElementById('cart-drawer');
  const cartBackdrop = document.getElementById('cart-backdrop');
  const cartDrawerOpenBtn = document.getElementById('cart-drawer-open');
  const mobileBarCartBtn = document.getElementById('mobile-bar-cart');
  const cartDrawerCloseBtn = document.getElementById('cart-drawer-close');
  const cartItemsWrap = document.getElementById('cart-items-wrap');
  const emptyCartState = document.getElementById('empty-cart-state');
  const cartDrawerFooter = document.getElementById('cart-drawer-footer');
  const cartCountBadges = document.querySelectorAll('#cart-count, .mobile-cart-count, #cart-drawer-count');
  const cartTotalHeader = document.getElementById('cart-total-header');

  // Cart Pricing & Free Shipping Meter
  const shippingMeterText = document.getElementById('shipping-meter-text');
  const shippingMeterFill = document.getElementById('shipping-meter-fill');
  const couponInput = document.getElementById('coupon-input');
  const applyCouponBtn = document.getElementById('apply-coupon-btn');
  const couponFeedback = document.getElementById('coupon-feedback');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const discountRow = document.getElementById('discount-row');
  const cartDiscountEl = document.getElementById('cart-discount');
  const cartShippingEl = document.getElementById('cart-shipping');
  const cartTotalEl = document.getElementById('cart-total');

  // Wishlist
  const wishlistDrawer = document.getElementById('wishlist-drawer');
  const wishlistBackdrop = document.getElementById('wishlist-backdrop');
  const wishlistOpenBtn = document.getElementById('wishlist-drawer-open');
  const wishlistCloseBtn = document.getElementById('wishlist-drawer-close');
  const wishlistItemsWrap = document.getElementById('wishlist-items-wrap');
  const wishlistCountBadge = document.getElementById('wishlist-count');
  const wishlistDrawerCount = document.getElementById('wishlist-drawer-count');
  const emptyWishlistState = document.getElementById('empty-wishlist-state');

  // Checkout Modal
  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutBackdrop = document.getElementById('checkout-backdrop');
  const openCheckoutModalBtn = document.getElementById('open-checkout-modal-btn');
  const checkoutModalCloseBtn = document.getElementById('checkout-modal-close');
  const checkoutForm = document.getElementById('checkout-form');
  const stripeCardFields = document.getElementById('stripe-card-fields');
  const orderSuccessState = document.getElementById('order-success-state');
  const successCloseBtn = document.getElementById('success-close-btn');

  // Product Modal (Quick View)
  const productModal = document.getElementById('product-modal');
  const productModalBackdrop = document.getElementById('product-modal-backdrop');
  const productModalCloseBtn = document.getElementById('product-modal-close');

  // Size Guide Modal
  const sizeGuideModal = document.getElementById('size-guide-modal');
  const sizeGuideBackdrop = document.getElementById('size-guide-backdrop');
  const sizeGuideCloseBtn = document.getElementById('size-guide-close');

  // Toast
  const toastNotification = document.getElementById('toast-notification');

  // ==========================================================================
  // 3. TOAST HELPER
  // ==========================================================================
  function showToast(message) {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 2800);
  }

  // Copy coupon helper
  const copyWelcomeBtn = document.getElementById('copy-welcome-btn');
  if (copyWelcomeBtn) {
    copyWelcomeBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('WELCOME15').then(() => {
        showToast('Coupon WELCOME15 copied! Use at checkout for 15% OFF.');
      }).catch(() => {
        showToast('Coupon code: WELCOME15 (15% OFF)');
      });
    });
  }

  // ==========================================================================
  // 4. HERO SLIDER AUTO-PLAY & CONTROLS
  // ==========================================================================
  const heroSlides = document.querySelectorAll('.hero-slide');
  const sliderDots = document.querySelectorAll('.slider-dot');
  let currentSlide = 0;
  let slideInterval = null;

  function showSlide(index) {
    heroSlides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    sliderDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    currentSlide = index;
  }

  function nextSlide() {
    showSlide((currentSlide + 1) % heroSlides.length);
  }

  function startSlideShow() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5500);
  }

  sliderDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-slide'), 10);
      showSlide(idx);
      startSlideShow();
    });
  });

  if (heroSlides.length > 0) {
    startSlideShow();
  }

  // ==========================================================================
  // 5. PRODUCTS RENDERING & FILTERING
  // ==========================================================================
  function getFilteredProducts() {
    let list = [...rawProducts];

    // Category filter
    if (currentCategory !== 'all') {
      list = list.filter(p => p.category === currentCategory);
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    // Sort filter
    if (currentSort === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }

  function renderProducts() {
    const filtered = getFilteredProducts();

    if (visibleCountEl) visibleCountEl.textContent = filtered.length;

    if (filtered.length === 0) {
      productsGrid.style.display = 'none';
      if (noProductsEl) noProductsEl.style.display = 'block';
      return;
    }

    productsGrid.style.display = 'grid';
    if (noProductsEl) noProductsEl.style.display = 'none';

    productsGrid.innerHTML = filtered.map(product => {
      const isSaved = wishlist.includes(product.id);
      const secondImage = product.images && product.images.length > 1 ? product.images[1] : product.image;
      const primarySize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'L';

      return `
        <article class="product-card" data-id="${product.id}">
          <div class="card-media" onclick="openProductQuickView('${product.id}')">
            <img src="${product.image}" alt="${escapeHtml(product.name)}" class="card-img-primary" loading="lazy">
            <img src="${secondImage}" alt="${escapeHtml(product.name)}" class="card-img-secondary" loading="lazy">
            
            <div class="card-badges">
              <span class="badge-sale">SAVE 25%</span>
              <span class="badge-leather">100% Genuine Leather</span>
            </div>

            <button class="card-wishlist-btn ${isSaved ? 'active' : ''}" 
              data-id="${product.id}" 
              aria-label="Save to Wishlist" 
              onclick="event.stopPropagation(); toggleWishlist('${product.id}')">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="${isSaved ? '#ef4444' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
              </svg>
            </button>

            <button class="card-quick-view-btn" onclick="event.stopPropagation(); openProductQuickView('${product.id}')">
              👁️ Quick View
            </button>
          </div>

          <div class="card-body">
            <span class="card-category">${product.category}</span>
            <h3 class="card-title" onclick="openProductQuickView('${product.id}')" title="${escapeHtml(product.name)}">
              ${escapeHtml(product.name)}
            </h3>

            <div class="card-rating">
              <span>★</span> ${(product.rating || 4.9).toFixed(1)} 
              <span>(${product.reviewCount || 24} reviews)</span>
            </div>

            <div class="card-price-row">
              <span class="card-price">$${product.price.toFixed(2)}</span>
              <span class="card-original-price">$${product.originalPrice.toFixed(2)}</span>
              <span class="card-shipping-tag">${product.price >= 399 ? 'Free Shipping' : '+$33 Shipping'}</span>
            </div>

            <div class="card-sizes" data-selected-size="${primarySize}">
              ${(product.sizes || ['S', 'M', 'L', 'XL']).slice(0, 5).map((sz, idx) => `
                <button type="button" class="size-chip ${idx === 0 ? 'selected' : ''}" 
                  onclick="selectCardSize(this, '${sz}')">${sz}</button>
              `).join('')}
            </div>

            <div class="card-actions">
              <button type="button" class="card-add-btn" onclick="addCardToCart('${product.id}', this)">
                Add to Cart
              </button>
              <a href="https://wa.me/923046251824?text=${encodeURIComponent(`Hello Haji Leather, I am interested in ${product.name} (ID: ${product.id}) priced at $${product.price}`)}" 
                target="_blank" rel="noopener noreferrer" class="card-wa-btn" title="Inquire on WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zM12.05 20.2c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z"/>
                </svg>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  window.selectCardSize = function(btn, size) {
    const parent = btn.closest('.card-sizes');
    if (!parent) return;
    parent.querySelectorAll('.size-chip').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    parent.setAttribute('data-selected-size', size);
  };

  window.addCardToCart = function(productId, btn) {
    const product = rawProducts.find(p => p.id === productId);
    if (!product) return;

    const card = btn.closest('.product-card');
    const sizeContainer = card ? card.querySelector('.card-sizes') : null;
    const selectedSize = sizeContainer ? (sizeContainer.getAttribute('data-selected-size') || 'L') : 'L';

    addToCart(product, selectedSize, 1);
  };

  // Category Filter Pill clicks
  if (categoryTabs) {
    categoryTabs.addEventListener('click', (e) => {
      const pill = e.target.closest('.cat-pill');
      if (!pill) return;

      categoryTabs.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      currentCategory = pill.getAttribute('data-category');
      renderProducts();
    });
  }

  // Links with data-cat (e.g. in Nav or Hero buttons)
  document.querySelectorAll('[data-cat]').forEach(el => {
    el.addEventListener('click', (e) => {
      const cat = el.getAttribute('data-cat');
      if (cat) {
        currentCategory = cat;
        if (categoryTabs) {
          categoryTabs.querySelectorAll('.cat-pill').forEach(p => {
            p.classList.toggle('active', p.getAttribute('data-category') === cat);
          });
        }
        renderProducts();
        closeMobileDrawer();
      }
    });
  });

  // Sort dropdown
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderProducts();
    });
  }

  // Search input binding
  function handleSearch(val) {
    searchQuery = val;
    if (clearSearchBtn) {
      clearSearchBtn.style.display = val.length > 0 ? 'block' : 'none';
    }
    renderProducts();
  }

  if (headerSearchInput) {
    headerSearchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  }
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (headerSearchInput) headerSearchInput.value = '';
      if (mobileSearchInput) mobileSearchInput.value = '';
      handleSearch('');
    });
  }

  // Mobile search bar toggle
  if (mobileSearchToggle && mobileSearchBar) {
    mobileSearchToggle.addEventListener('click', () => {
      mobileSearchBar.classList.toggle('active');
      if (mobileSearchBar.classList.contains('active') && mobileSearchInput) {
        mobileSearchInput.focus();
      }
    });
  }
  if (mobileBarSearch && mobileSearchBar) {
    mobileBarSearch.addEventListener('click', () => {
      mobileSearchBar.classList.toggle('active');
      if (mobileSearchBar.classList.contains('active') && mobileSearchInput) {
        mobileSearchInput.focus();
      }
    });
  }

  const resetFilterBtn = document.getElementById('reset-filter-btn');
  if (resetFilterBtn) {
    resetFilterBtn.addEventListener('click', () => {
      currentCategory = 'all';
      searchQuery = '';
      if (headerSearchInput) headerSearchInput.value = '';
      if (mobileSearchInput) mobileSearchInput.value = '';
      if (categoryTabs) {
        categoryTabs.querySelectorAll('.cat-pill').forEach(p => {
          p.classList.toggle('active', p.getAttribute('data-category') === 'all');
        });
      }
      renderProducts();
    });
  }

  // ==========================================================================
  // 6. CART MANAGEMENT (Add, Remove, Qty, Coupon, Shipping, WhatsApp Format)
  // ==========================================================================
  function saveCart() {
    try {
      localStorage.setItem('hl_cart', JSON.stringify(cart));
    } catch (e) {}
    updateCartUI();
  }

  function addToCart(product, size, qty = 1) {
    const existingIndex = cart.findIndex(item => item.id === product.id && item.size === size);
    if (existingIndex > -1) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        size: size,
        qty: qty
      });
    }
    saveCart();
    showToast(`Added: ${product.name.slice(0, 32)}... (Size: ${size})`);
    openCartDrawer();
  }

  function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountBadges.forEach(badge => badge.textContent = totalCount);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (cartTotalHeader) cartTotalHeader.textContent = `$${subtotal.toFixed(2)}`;

    // Free Shipping Progress
    const freeShippingThreshold = 399.00;
    if (shippingMeterText && shippingMeterFill) {
      if (subtotal >= freeShippingThreshold) {
        shippingMeterText.innerHTML = `🎉 <strong>Congratulations!</strong> You unlocked <strong>FREE Worldwide Express Shipping</strong>!`;
        shippingMeterFill.style.width = '100%';
      } else {
        const remaining = (freeShippingThreshold - subtotal).toFixed(2);
        const percent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
        shippingMeterText.innerHTML = `Add <strong>$${remaining}</strong> more for <strong>FREE Express Shipping</strong>!`;
        shippingMeterFill.style.width = `${percent}%`;
      }
    }

    // Render cart items
    if (cart.length === 0) {
      if (emptyCartState) emptyCartState.style.display = 'flex';
      if (cartDrawerFooter) cartDrawerFooter.style.display = 'none';
      if (cartItemsWrap) cartItemsWrap.innerHTML = emptyCartState ? emptyCartState.outerHTML : '';
    } else {
      if (emptyCartState) emptyCartState.style.display = 'none';
      if (cartDrawerFooter) cartDrawerFooter.style.display = 'block';

      cartItemsWrap.innerHTML = cart.map((item, idx) => `
        <div class="cart-item">
          <img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-item-img">
          <div class="cart-item-info">
            <h4 class="cart-item-title">${escapeHtml(item.name)}</h4>
            <div class="cart-item-size">Size: <strong>${item.size}</strong></div>
            <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
            <div class="cart-item-qty-row">
              <div class="qty-stepper">
                <button type="button" class="qty-step-btn" onclick="stepCartQty(${idx}, -1)">-</button>
                <span class="qty-val">${item.qty}</span>
                <button type="button" class="qty-step-btn" onclick="stepCartQty(${idx}, 1)">+</button>
              </div>
              <button type="button" class="cart-item-remove-btn" onclick="removeCartItem(${idx})">Remove</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Pricing calculation
    let discount = 0;
    if (activeCoupon) {
      discount = (subtotal * activeCoupon.percent) / 100;
    }

    const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0.00 : 33.00;
    const finalTotal = Math.max(0, subtotal - discount + shipping);

    if (cartSubtotalEl) cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (discountRow) discountRow.style.display = discount > 0 ? 'flex' : 'none';
    if (cartDiscountEl) cartDiscountEl.textContent = `-$${discount.toFixed(2)}`;
    if (cartShippingEl) cartShippingEl.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    if (cartTotalEl) cartTotalEl.textContent = `$${finalTotal.toFixed(2)}`;

    // Sync Checkout Modal Pricing
    const modalSubtotal = document.getElementById('modal-subtotal');
    const modalDiscountRow = document.getElementById('modal-discount-row');
    const modalDiscount = document.getElementById('modal-discount');
    const modalShipping = document.getElementById('modal-shipping');
    const modalTotal = document.getElementById('modal-total');

    if (modalSubtotal) modalSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (modalDiscountRow) modalDiscountRow.style.display = discount > 0 ? 'flex' : 'none';
    if (modalDiscount) modalDiscount.textContent = `-$${discount.toFixed(2)}`;
    if (modalShipping) modalShipping.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    if (modalTotal) modalTotal.textContent = `$${finalTotal.toFixed(2)}`;
  }

  window.stepCartQty = function(index, delta) {
    if (!cart[index]) return;
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
    saveCart();
  };

  window.removeCartItem = function(index) {
    if (!cart[index]) return;
    cart.splice(index, 1);
    saveCart();
  };

  // Coupon apply
  if (applyCouponBtn && couponInput) {
    applyCouponBtn.addEventListener('click', () => {
      const code = couponInput.value.trim().toUpperCase();
      if (code === 'WELCOME15') {
        activeCoupon = { code: 'WELCOME15', percent: 15 };
        couponFeedback.innerHTML = `<span style="color:#10b981;">✓ 15% Welcome discount applied successfully!</span>`;
        updateCartUI();
      } else if (code === '') {
        activeCoupon = null;
        couponFeedback.textContent = '';
        updateCartUI();
      } else {
        couponFeedback.innerHTML = `<span style="color:#ef4444;">Invalid promo code. Use code: WELCOME15</span>`;
      }
    });
  }

  // WhatsApp Structured Order Formulation
  function buildWhatsAppOrderMessage(customerInfo = null, paymentMethodName = null) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const freeShipping = subtotal >= 399 || subtotal === 0;
    let discount = activeCoupon ? (subtotal * activeCoupon.percent) / 100 : 0;
    const shipping = freeShipping ? 0 : 33;
    const finalTotal = Math.max(0, subtotal - discount + shipping);

    let msg = `*HAJI LEATHER — ORDER INQUIRY*\n`;
    msg += `---------------------------------\n`;
    msg += `*Order Date:* ${new Date().toLocaleDateString()}\n\n`;
    msg += `*ITEMS ORDERED:*\n`;

    cart.forEach((item, i) => {
      msg += `${i + 1}. *${item.name}*\n   Size: ${item.size} | Qty: ${item.qty} | Price: $${(item.price * item.qty).toFixed(2)}\n`;
    });

    msg += `\n---------------------------------\n`;
    msg += `*Subtotal:* $${subtotal.toFixed(2)}\n`;
    if (discount > 0) msg += `*Discount (WELCOME15):* -$${discount.toFixed(2)}\n`;
    msg += `*Worldwide Shipping:* ${freeShipping ? 'FREE' : '$33.00'}\n`;
    msg += `*TOTAL DUE:* $${finalTotal.toFixed(2)}\n`;

    if (paymentMethodName) {
      msg += `*Selected Payment:* ${paymentMethodName}\n`;
    }

    if (customerInfo) {
      msg += `\n*CUSTOMER DETAILS:*\n`;
      msg += `Name: ${customerInfo.name}\n`;
      msg += `Phone: ${customerInfo.phone}\n`;
      msg += `Email: ${customerInfo.email}\n`;
      msg += `Address: ${customerInfo.address}, ${customerInfo.city}, ${customerInfo.country}\n`;
    }

    msg += `\nHello Haji Leather team, please confirm my order and sizing details!`;
    return encodeURIComponent(msg);
  }

  const whatsappQuickOrderBtn = document.getElementById('whatsapp-quick-order-btn');
  if (whatsappQuickOrderBtn) {
    whatsappQuickOrderBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Your cart is empty! Add products to proceed.');
        return;
      }
      const waMsg = buildWhatsAppOrderMessage();
      window.open(`https://wa.me/923046251824?text=${waMsg}`, '_blank');
    });
  }

  // Cart Drawer open / close
  function openCartDrawer() {
    if (cartDrawer) cartDrawer.classList.add('open');
    if (cartBackdrop) cartBackdrop.classList.add('open');
  }

  function closeCartDrawer() {
    if (cartDrawer) cartDrawer.classList.remove('open');
    if (cartBackdrop) cartBackdrop.classList.remove('open');
  }

  if (cartDrawerOpenBtn) cartDrawerOpenBtn.addEventListener('click', openCartDrawer);
  if (mobileBarCartBtn) mobileBarCartBtn.addEventListener('click', openCartDrawer);
  if (cartDrawerCloseBtn) cartDrawerCloseBtn.addEventListener('click', closeCartDrawer);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCartDrawer);

  const startShoppingBtn = document.getElementById('start-shopping-btn');
  if (startShoppingBtn) {
    startShoppingBtn.addEventListener('click', () => {
      closeCartDrawer();
      const catEl = document.getElementById('catalog');
      if (catEl) catEl.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ==========================================================================
  // 7. CHECKOUT MODAL & PAYMENT METHOD SELECTION (Stripe, Apple/Google Pay, COD)
  // ==========================================================================
  function openCheckoutModal() {
    if (cart.length === 0) {
      showToast('Your cart is empty. Please select products first.');
      return;
    }
    closeCartDrawer();
    if (checkoutModal) checkoutModal.classList.add('open');
    if (checkoutBackdrop) checkoutBackdrop.classList.add('open');
    if (orderSuccessState) orderSuccessState.style.display = 'none';
    if (checkoutForm) checkoutForm.style.display = 'block';
  }

  function closeCheckoutModal() {
    if (checkoutModal) checkoutModal.classList.remove('open');
    if (checkoutBackdrop) checkoutBackdrop.classList.remove('open');
  }

  if (openCheckoutModalBtn) openCheckoutModalBtn.addEventListener('click', openCheckoutModal);
  if (checkoutModalCloseBtn) checkoutModalCloseBtn.addEventListener('click', closeCheckoutModal);
  if (checkoutBackdrop) checkoutBackdrop.addEventListener('click', closeCheckoutModal);

  // Payment Method Radios (Luxwearz Style)
  const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
  paymentRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-radio-label').forEach(lbl => lbl.classList.remove('active'));
      const activeLabel = radio.closest('.payment-radio-label');
      if (activeLabel) activeLabel.classList.add('active');

      // Toggle Stripe Card fields
      if (stripeCardFields) {
        stripeCardFields.style.display = radio.value === 'stripe' ? 'block' : 'none';
      }
    });
  });

  // Credit Card formatting helper
  const stripeCardNum = document.getElementById('stripe-card-num');
  if (stripeCardNum) {
    stripeCardNum.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 16);
      let formatted = v.match(/.{1,4}/g)?.join(' ') || v;
      e.target.value = formatted;
    });
  }

  const stripeCardExp = document.getElementById('stripe-card-exp');
  if (stripeCardExp) {
    stripeCardExp.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (v.length > 2) {
        e.target.value = v.substring(0, 2) + ' / ' + v.substring(2);
      } else {
        e.target.value = v;
      }
    });
  }

  // Handle Checkout Submission
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('c-name')?.value.trim();
      const phone = document.getElementById('c-phone')?.value.trim();
      const email = document.getElementById('c-email')?.value.trim();
      const country = document.getElementById('c-country')?.value;
      const address = document.getElementById('c-address')?.value.trim();
      const city = document.getElementById('c-city')?.value.trim();

      if (!name || !phone || !email || !address || !city) {
        showToast('Please fill out all required shipping fields.');
        return;
      }

      const selectedMethodEl = document.querySelector('input[name="payment_method"]:checked');
      const methodValue = selectedMethodEl ? selectedMethodEl.value : 'stripe';
      let methodName = 'Credit/Debit Card (Stripe)';
      if (methodValue === 'express_wallet') methodName = 'Apple Pay / Google Pay';
      if (methodValue === 'cod') methodName = 'Cash on Delivery (COD)';
      if (methodValue === 'whatsapp_bank') methodName = 'WhatsApp Order / Bank Transfer';

      // Generate random order ID
      const orderId = 'HL-' + Math.floor(1000 + Math.random() * 9000);
      const placedOrderIdEl = document.getElementById('placed-order-id');
      if (placedOrderIdEl) placedOrderIdEl.textContent = orderId;

      // WhatsApp Forwarding Link for Success Screen
      const customerObj = { name, phone, email, country, address, city };
      const waMsg = buildWhatsAppOrderMessage(customerObj, `${methodName} [Order ${orderId}]`);
      const successWaBtn = document.getElementById('success-wa-confirm-btn');
      if (successWaBtn) {
        successWaBtn.href = `https://wa.me/923046251824?text=${waMsg}`;
      }

      // Hide Form, Show Success
      checkoutForm.style.display = 'none';
      if (orderSuccessState) orderSuccessState.style.display = 'block';

      // Clear cart
      cart = [];
      saveCart();
      showToast('Order received successfully!');
    });
  }

  if (successCloseBtn) {
    successCloseBtn.addEventListener('click', closeCheckoutModal);
  }

  // ==========================================================================
  // 8. PRODUCT QUICK VIEW MODAL
  // ==========================================================================
  window.openProductQuickView = function(productId) {
    const product = rawProducts.find(p => p.id === productId);
    if (!product) return;

    // Fill gallery
    const mainImg = document.getElementById('modal-main-image');
    if (mainImg) {
      mainImg.src = product.image;
      mainImg.alt = product.name;
    }

    const thumbsContainer = document.getElementById('modal-thumbnails');
    if (thumbsContainer) {
      const allImages = product.images && product.images.length > 0 ? product.images : [product.image];
      thumbsContainer.innerHTML = allImages.map((imgUrl, i) => `
        <img src="${imgUrl}" alt="${escapeHtml(product.name)} ${i+1}" 
          class="modal-thumb ${i === 0 ? 'active' : ''}" 
          onclick="setModalMainImage('${imgUrl}', this)">
      `).join('');
    }

    // Fill info
    document.getElementById('modal-category').textContent = product.category;
    document.getElementById('modal-title').textContent = product.name;
    document.getElementById('modal-rating-text').textContent = `${(product.rating || 4.9).toFixed(1)} (${product.reviewCount || 24} verified reviews)`;
    document.getElementById('modal-price').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('modal-original-price').textContent = `$${product.originalPrice.toFixed(2)}`;
    document.getElementById('modal-description').textContent = product.description || 'Handcrafted from competition-grade genuine leather with heavy-duty solid brass hardware and ergonomic comfort cut.';

    // Size options
    const sizeOptionsContainer = document.getElementById('modal-size-options');
    const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', '2XL'];
    let selectedModalSize = availableSizes[0];

    if (sizeOptionsContainer) {
      sizeOptionsContainer.innerHTML = availableSizes.map((sz, idx) => `
        <button type="button" class="modal-size-btn ${idx === 0 ? 'active' : ''}" 
          onclick="selectModalSize(this, '${sz}')">${sz}</button>
      `).join('');
    }

    window.selectModalSize = function(btn, sz) {
      sizeOptionsContainer.querySelectorAll('.modal-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedModalSize = sz;
      updateModalWhatsAppBtn();
    };

    // Quantity
    const qtyInput = document.getElementById('qty-input');
    if (qtyInput) qtyInput.value = 1;

    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    if (qtyMinus) {
      qtyMinus.onclick = () => {
        let v = parseInt(qtyInput.value, 10) || 1;
        if (v > 1) qtyInput.value = v - 1;
        updateModalWhatsAppBtn();
      };
    }
    if (qtyPlus) {
      qtyPlus.onclick = () => {
        let v = parseInt(qtyInput.value, 10) || 1;
        if (v < 10) qtyInput.value = v + 1;
        updateModalWhatsAppBtn();
      };
    }

    function updateModalWhatsAppBtn() {
      const waBtn = document.getElementById('modal-whatsapp-inquiry-btn');
      if (waBtn) {
        const qty = parseInt(qtyInput?.value || 1, 10);
        const text = encodeURIComponent(`Hello Haji Leather, I want to order / inquire about: ${product.name} (Size: ${selectedModalSize}, Qty: ${qty}) for $${(product.price * qty).toFixed(2)}.`);
        waBtn.href = `https://wa.me/923046251824?text=${text}`;
      }
    }
    updateModalWhatsAppBtn();

    // Add to cart from modal
    const modalAddCartBtn = document.getElementById('modal-add-to-cart-btn');
    if (modalAddCartBtn) {
      modalAddCartBtn.onclick = () => {
        const qty = parseInt(qtyInput?.value || 1, 10);
        addToCart(product, selectedModalSize, qty);
        closeProductQuickView();
      };
    }

    // Open
    if (productModal) productModal.classList.add('open');
    if (productModalBackdrop) productModalBackdrop.classList.add('open');
  };

  window.setModalMainImage = function(url, thumbEl) {
    const mainImg = document.getElementById('modal-main-image');
    if (mainImg) mainImg.src = url;
    document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
  };

  function closeProductQuickView() {
    if (productModal) productModal.classList.remove('open');
    if (productModalBackdrop) productModalBackdrop.classList.remove('open');
  }

  if (productModalCloseBtn) productModalCloseBtn.addEventListener('click', closeProductQuickView);
  if (productModalBackdrop) productModalBackdrop.addEventListener('click', closeProductQuickView);

  // ==========================================================================
  // 9. WISHLIST MANAGEMENT
  // ==========================================================================
  window.toggleWishlist = function(productId) {
    const idx = wishlist.indexOf(productId);
    if (idx > -1) {
      wishlist.splice(idx, 1);
      showToast('Removed from wishlist');
    } else {
      wishlist.push(productId);
      showToast('Saved to your wishlist! ❤️');
    }
    try {
      localStorage.setItem('hl_wishlist', JSON.stringify(wishlist));
    } catch (e) {}
    updateWishlistUI();
    renderProducts();
  };

  function updateWishlistUI() {
    if (wishlistCountBadge) wishlistCountBadge.textContent = wishlist.length;
    if (wishlistDrawerCount) wishlistDrawerCount.textContent = wishlist.length;

    const savedProducts = rawProducts.filter(p => wishlist.includes(p.id));

    if (savedProducts.length === 0) {
      if (emptyWishlistState) emptyWishlistState.style.display = 'block';
      if (wishlistItemsWrap) wishlistItemsWrap.innerHTML = emptyWishlistState ? emptyWishlistState.outerHTML : '';
    } else {
      if (emptyWishlistState) emptyWishlistState.style.display = 'none';
      wishlistItemsWrap.innerHTML = savedProducts.map(p => `
        <div class="cart-item">
          <img src="${p.image}" alt="${escapeHtml(p.name)}" class="cart-item-img">
          <div class="cart-item-info">
            <h4 class="cart-item-title">${escapeHtml(p.name)}</h4>
            <div class="cart-item-price">$${p.price.toFixed(2)}</div>
            <div class="cart-item-qty-row">
              <button type="button" class="btn btn-primary" style="padding: 6px 12px; font-size: 11px;" 
                onclick="addToCartFromWishlist('${p.id}')">Add to Cart</button>
              <button type="button" class="cart-item-remove-btn" onclick="toggleWishlist('${p.id}')">Remove</button>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  window.addToCartFromWishlist = function(productId) {
    const product = rawProducts.find(p => p.id === productId);
    if (product) {
      const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'L';
      addToCart(product, defaultSize, 1);
      closeWishlistDrawer();
    }
  };

  function openWishlistDrawer() {
    updateWishlistUI();
    if (wishlistDrawer) wishlistDrawer.classList.add('open');
    if (wishlistBackdrop) wishlistBackdrop.classList.add('open');
  }

  function closeWishlistDrawer() {
    if (wishlistDrawer) wishlistDrawer.classList.remove('open');
    if (wishlistBackdrop) wishlistBackdrop.classList.remove('open');
  }

  if (wishlistOpenBtn) wishlistOpenBtn.addEventListener('click', openWishlistDrawer);
  if (wishlistCloseBtn) wishlistCloseBtn.addEventListener('click', closeWishlistDrawer);
  if (wishlistBackdrop) wishlistBackdrop.addEventListener('click', closeWishlistDrawer);

  // ==========================================================================
  // 10. MOBILE NAVIGATION DRAWER
  // ==========================================================================
  function openMobileDrawer() {
    if (mobileDrawer) mobileDrawer.classList.add('open');
    if (drawerBackdrop) drawerBackdrop.classList.add('open');
  }

  function closeMobileDrawer() {
    if (mobileDrawer) mobileDrawer.classList.remove('open');
    if (drawerBackdrop) drawerBackdrop.classList.remove('open');
  }

  if (mobileMenuOpenBtn) mobileMenuOpenBtn.addEventListener('click', openMobileDrawer);
  if (mobileMenuCloseBtn) mobileMenuCloseBtn.addEventListener('click', closeMobileDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeMobileDrawer);

  // ==========================================================================
  // 11. SIZE GUIDE MODAL
  // ==========================================================================
  function openSizeGuide() {
    if (sizeGuideModal) sizeGuideModal.classList.add('open');
    if (sizeGuideBackdrop) sizeGuideBackdrop.classList.add('open');
  }

  function closeSizeGuide() {
    if (sizeGuideModal) sizeGuideModal.classList.remove('open');
    if (sizeGuideBackdrop) sizeGuideBackdrop.classList.remove('open');
  }

  document.querySelectorAll('#nav-size-guide-btn, #mobile-size-guide-btn, #modal-open-size-guide, #footer-size-guide-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openSizeGuide();
      closeMobileDrawer();
    });
  });

  if (sizeGuideCloseBtn) sizeGuideCloseBtn.addEventListener('click', closeSizeGuide);
  if (sizeGuideBackdrop) sizeGuideBackdrop.addEventListener('click', closeSizeGuide);

  // ==========================================================================
  // 12. UTILITY HELPERS
  // ==========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial Boot
  renderProducts();
  updateCartUI();
  updateWishlistUI();
});
