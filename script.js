/**
 * HAJI LEATHER ATELIER — EDITORIAL JAVASCRIPT ENGINE
 * Modeled after Dodge Hell Varsity (dodgehellvarsity.com)
 * Earthy Neutral Palette, Payoneer Citibank USA Flow & Screenshot Proof Upload
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Data Store Initialization
  const rawProducts = window.HAJI_PRODUCTS || [];
  let currentCategory = 'all';
  let searchQuery = '';
  let currentSort = 'featured';
  let activeCoupon = null; // { code: 'WELCOME15', percent: 15 }
  let attachedScreenshotFile = null;

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

  // Shipping Meter & Coupon
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
  const orderSuccessState = document.getElementById('order-success-state');
  const successCloseBtn = document.getElementById('success-close-btn');

  // Screenshot Upload Elements
  const paymentScreenshotFile = document.getElementById('payment-screenshot-file');
  const uploadDropzone = document.getElementById('upload-dropzone');
  const dropzonePrompt = document.getElementById('dropzone-prompt');
  const dropzonePreview = document.getElementById('dropzone-preview');
  const previewThumbnail = document.getElementById('preview-thumbnail');
  const previewFilename = document.getElementById('preview-filename');
  const removeProofBtn = document.getElementById('remove-proof-btn');

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
  // 3. TOAST & CLIPBOARD HELPERS
  // ==========================================================================
  function showToast(message) {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 2800);
  }

  window.copyText = function(text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
      const original = btnElement.textContent;
      btnElement.textContent = 'Copied! ✓';
      btnElement.style.background = '#E6D3B8';
      btnElement.style.color = '#141414';
      setTimeout(() => {
        btnElement.textContent = original;
        btnElement.style.background = '';
        btnElement.style.color = '';
      }, 2000);
      showToast(`Copied: ${text}`);
    }).catch(() => {
      showToast(`Copy failed, please select manually: ${text}`);
    });
  };

  const copyPromoPill = document.getElementById('copy-promo-pill');
  if (copyPromoPill) {
    copyPromoPill.addEventListener('click', () => {
      copyText('WELCOME15', copyPromoPill);
    });
  }

  // ==========================================================================
  // 4. PRODUCTS FILTERING & RENDERING (Editorial Cards in #141414)
  // ==========================================================================
  function getFilteredProducts() {
    let list = [...rawProducts];

    // Category filter
    if (currentCategory !== 'all') {
      list = list.filter(p => p.category === currentCategory);
    }

    // Search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    // Sorting
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
        <article class="editorial-card" data-id="${product.id}">
          <div class="card-media-stage" onclick="openProductQuickView('${product.id}')">
            <img src="${product.image}" alt="${escapeHtml(product.name)}" class="card-img-front" loading="lazy">
            <img src="${secondImage}" alt="${escapeHtml(product.name)}" class="card-img-back" loading="lazy">
            
            <div class="card-badges-stack">
              <span class="card-pill-tag sale">SAVE 25%</span>
              <span class="card-pill-tag leather">GENUINE HIDE</span>
            </div>

            <button class="card-wish-btn ${isSaved ? 'active' : ''}" 
              data-id="${product.id}" 
              aria-label="Save to Wishlist" 
              onclick="event.stopPropagation(); toggleWishlist('${product.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? '#ef4444' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
              </svg>
            </button>

            <button class="card-quick-overlay" onclick="event.stopPropagation(); openProductQuickView('${product.id}')">
              Quick View ↗
            </button>
          </div>

          <div class="card-editorial-body">
            <span class="card-cat-label">${product.category}</span>
            <h3 class="card-garment-title" onclick="openProductQuickView('${product.id}')" title="${escapeHtml(product.name)}">
              ${escapeHtml(product.name)}
            </h3>

            <div class="card-star-row">
              <span>★</span> ${(product.rating || 4.9).toFixed(1)} 
              <span>(${product.reviewCount || 24} reviews)</span>
            </div>

            <div class="card-price-bar">
              <span class="card-price-val">$${product.price.toFixed(2)}</span>
              <span class="card-strike-val">$${product.originalPrice.toFixed(2)}</span>
              <span class="card-shipping-flag">${product.price >= 399 ? 'Free Express' : '+$33 Shipping'}</span>
            </div>

            <div class="card-size-pills" data-selected-size="${primarySize}">
              ${(product.sizes || ['S', 'M', 'L', 'XL']).slice(0, 5).map((sz, idx) => `
                <button type="button" class="size-pill-btn ${idx === 0 ? 'selected' : ''}" 
                  onclick="selectCardSize(this, '${sz}')">${sz}</button>
              `).join('')}
            </div>

            <div class="card-actions-grid">
              <button type="button" class="card-cart-btn" onclick="addCardToCart('${product.id}', this)">
                Add to Bag
              </button>
              <a href="https://wa.me/923046251824?text=${encodeURIComponent(`Hello Haji Leather Atelier, I am interested in ${product.name} (ID: ${product.id}) priced at $${product.price}`)}" 
                target="_blank" rel="noopener noreferrer" class="card-whatsapp-btn" title="Inquire on WhatsApp">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
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
    const parent = btn.closest('.card-size-pills');
    if (!parent) return;
    parent.querySelectorAll('.size-pill-btn').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    parent.setAttribute('data-selected-size', size);
  };

  window.addCardToCart = function(productId, btn) {
    const product = rawProducts.find(p => p.id === productId);
    if (!product) return;

    const card = btn.closest('.editorial-card');
    const sizeContainer = card ? card.querySelector('.card-size-pills') : null;
    const selectedSize = sizeContainer ? (sizeContainer.getAttribute('data-selected-size') || 'L') : 'L';

    addToCart(product, selectedSize, 1);
  };

  // Category filter tabs
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

  // Links with data-cat attribute
  document.querySelectorAll('[data-cat]').forEach(el => {
    el.addEventListener('click', () => {
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

  // Search logic
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
  // 5. CART & BAG ENGINE (With Free Shipping Meter & Coupon)
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
    showToast(`Added to Bag: ${product.name.slice(0, 30)}... (${size})`);
    openCartDrawer();
  }

  function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountBadges.forEach(badge => badge.textContent = totalCount);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Free Shipping Progress
    const freeShippingThreshold = 399.00;
    if (shippingMeterText && shippingMeterFill) {
      if (subtotal >= freeShippingThreshold) {
        shippingMeterText.innerHTML = `🎉 <strong>Congratulations!</strong> You unlocked <strong>FREE Worldwide Express</strong>!`;
        shippingMeterFill.style.width = '100%';
      } else {
        const remaining = (freeShippingThreshold - subtotal).toFixed(2);
        const percent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
        shippingMeterText.innerHTML = `Add <strong>$${remaining}</strong> more for <strong>FREE Worldwide Express</strong>!`;
        shippingMeterFill.style.width = `${percent}%`;
      }
    }

    // Render items list
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

    // Price calculation
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
        couponFeedback.innerHTML = `<span style="color:#34d399;">✓ 15% Welcome discount applied!</span>`;
        updateCartUI();
      } else if (code === '') {
        activeCoupon = null;
        couponFeedback.textContent = '';
        updateCartUI();
      } else {
        couponFeedback.innerHTML = `<span style="color:#ef4444;">Invalid promo code. Use: WELCOME15</span>`;
      }
    });
  }

  // Drawers open/close
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
  // 6. PAYONEER CHECKOUT & SCREENSHOT UPLOAD FLOW
  // ==========================================================================
  window.openCheckoutModalWithPayoneer = function() {
    openCheckoutModal();
    const radioPayoneer = document.getElementById('radio-payoneer');
    if (radioPayoneer) {
      radioPayoneer.checked = true;
      radioPayoneer.dispatchEvent(new Event('change'));
    }
  };

  function openCheckoutModal() {
    if (cart.length === 0) {
      showToast('Your bag is empty. Please select products first.');
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

  // Payment method radio tabs toggles
  const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
  paymentRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-card-option').forEach(opt => opt.classList.remove('active'));
      const activeOption = radio.closest('.payment-card-option');
      if (activeOption) activeOption.classList.add('active');

      const payoneerBox = document.getElementById('payoneer-box');
      if (payoneerBox) {
        payoneerBox.style.display = radio.value === 'payoneer' ? 'block' : 'none';
      }

      const stripeFieldsBox = document.getElementById('stripe-fields-box');
      if (stripeFieldsBox) {
        stripeFieldsBox.style.display = radio.value === 'stripe' ? 'block' : 'none';
      }
    });
  });

  // Screenshot Upload Drag & Drop and Preview Handler
  if (uploadDropzone && paymentScreenshotFile) {
    uploadDropzone.addEventListener('click', () => {
      paymentScreenshotFile.click();
    });

    uploadDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadDropzone.style.borderColor = '#E6D3B8';
      uploadDropzone.style.background = 'rgba(230, 211, 184, 0.1)';
    });

    uploadDropzone.addEventListener('dragleave', () => {
      uploadDropzone.style.borderColor = '';
      uploadDropzone.style.background = '';
    });

    uploadDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadDropzone.style.borderColor = '';
      uploadDropzone.style.background = '';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleScreenshotFile(e.dataTransfer.files[0]);
      }
    });

    paymentScreenshotFile.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleScreenshotFile(e.target.files[0]);
      }
    });
  }

  function handleScreenshotFile(file) {
    attachedScreenshotFile = file;
    if (previewFilename) previewFilename.textContent = file.name;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (previewThumbnail) previewThumbnail.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      if (previewThumbnail) previewThumbnail.src = 'logo.jpg';
    }

    if (dropzonePrompt) dropzonePrompt.style.display = 'none';
    if (dropzonePreview) dropzonePreview.style.display = 'flex';
    showToast('Payment screenshot attached successfully! ✓');
  }

  if (removeProofBtn) {
    removeProofBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      attachedScreenshotFile = null;
      if (paymentScreenshotFile) paymentScreenshotFile.value = '';
      if (dropzonePrompt) dropzonePrompt.style.display = 'flex';
      if (dropzonePreview) dropzonePreview.style.display = 'none';
    });
  }

  // Format Structured WhatsApp Order with Screenshot Confirmation
  function buildWhatsAppOrderMessage(customerInfo, orderId, paymentMethodName, hasProof) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const freeShipping = subtotal >= 399 || subtotal === 0;
    let discount = activeCoupon ? (subtotal * activeCoupon.percent) / 100 : 0;
    const shipping = freeShipping ? 0 : 33;
    const finalTotal = Math.max(0, subtotal - discount + shipping);

    let msg = `*HAJI LEATHER ATELIER — NEW ORDER PLACED*\n`;
    msg += `-------------------------------------------\n`;
    msg += `*Order Reference ID:* ${orderId}\n`;
    msg += `*Date:* ${new Date().toLocaleDateString()}\n\n`;

    msg += `*CUSTOMER DETAILS:*\n`;
    msg += `Name: ${customerInfo.name}\n`;
    msg += `Phone: ${customerInfo.phone}\n`;
    msg += `Email: ${customerInfo.email}\n`;
    msg += `Address: ${customerInfo.address}, ${customerInfo.city}, ${customerInfo.country}\n\n`;

    msg += `*ORDERED PIECES:*\n`;
    cart.forEach((item, i) => {
      msg += `${i + 1}. *${item.name}*\n   Size: ${item.size} | Qty: ${item.qty} | Price: $${(item.price * item.qty).toFixed(2)}\n`;
    });

    msg += `\n-------------------------------------------\n`;
    msg += `*Subtotal:* $${subtotal.toFixed(2)}\n`;
    if (discount > 0) msg += `*Discount (WELCOME15):* -$${discount.toFixed(2)}\n`;
    msg += `*Worldwide Shipping:* ${freeShipping ? 'FREE' : '$33.00'}\n`;
    msg += `*TOTAL DUE:* $${finalTotal.toFixed(2)}\n`;
    msg += `*Payment Method:* ${paymentMethodName}\n`;
    msg += `*Payment Proof Screenshot:* ${hasProof ? 'Attached on website (sending photo here as well)' : 'Sending screenshot right now'}\n\n`;
    msg += `Hello Haji Leather Atelier team, please confirm my order receipt and custom measurements!`;

    return encodeURIComponent(msg);
  }

  // Handle Checkout Form Submission
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
        showToast('Please complete all required customer fields.');
        return;
      }

      const selectedMethodEl = document.querySelector('input[name="payment_method"]:checked');
      const methodVal = selectedMethodEl ? selectedMethodEl.value : 'payoneer';
      let methodName = 'Payoneer / Citibank USA Direct Transfer';
      if (methodVal === 'stripe') methodName = 'Credit/Debit Card (Stripe)';
      if (methodVal === 'cod') methodName = 'Cash on Delivery (COD)';
      if (methodVal === 'whatsapp_direct') methodName = 'Direct WhatsApp Order';

      const hasProof = !!attachedScreenshotFile;

      // Generate Order ID
      const orderId = 'HL-' + Math.floor(1000 + Math.random() * 9000);
      const placedOrderIdEl = document.getElementById('placed-order-id');
      if (placedOrderIdEl) placedOrderIdEl.textContent = orderId;

      const successMethodText = document.getElementById('success-method-text');
      if (successMethodText) successMethodText.innerHTML = `Payment Method: <strong>${methodName}</strong>`;

      const successProofStatus = document.getElementById('success-proof-status');
      if (successProofStatus) {
        successProofStatus.innerHTML = hasProof
          ? `Screenshot Proof: <span class="proof-attached-tag">Attached ✓ (${attachedScreenshotFile.name})</span>`
          : `Screenshot Proof: <span style="color:#fbbf24;">Please forward via WhatsApp below</span>`;
      }

      // Prepare WhatsApp Forward Link
      const customerObj = { name, phone, email, country, address, city };
      const waMsg = buildWhatsAppOrderMessage(customerObj, orderId, methodName, hasProof);
      const successWaConfirmBtn = document.getElementById('success-wa-confirm-btn');
      if (successWaConfirmBtn) {
        successWaConfirmBtn.href = `https://wa.me/923046251824?text=${waMsg}`;
      }

      // Hide form, show success
      checkoutForm.style.display = 'none';
      if (orderSuccessState) orderSuccessState.style.display = 'block';

      // Clear cart
      cart = [];
      saveCart();
      showToast('Order received! Please forward receipt on WhatsApp.');
    });
  }

  if (successCloseBtn) {
    successCloseBtn.addEventListener('click', closeCheckoutModal);
  }

  // Quick WhatsApp Order from cart
  const whatsappQuickOrderBtn = document.getElementById('whatsapp-quick-order-btn');
  if (whatsappQuickOrderBtn) {
    whatsappQuickOrderBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Your bag is empty!');
        return;
      }
      const orderId = 'HL-' + Math.floor(1000 + Math.random() * 9000);
      const dummyCustomer = { name: 'Customer', phone: 'Phone', email: 'Email', address: 'Address', city: 'City', country: 'Country' };
      const waMsg = buildWhatsAppOrderMessage(dummyCustomer, orderId, 'Payoneer Citibank / WhatsApp Inquiry', false);
      window.open(`https://wa.me/923046251824?text=${waMsg}`, '_blank');
    });
  }

  // ==========================================================================
  // 7. PRODUCT QUICK VIEW MODAL
  // ==========================================================================
  window.openProductQuickView = function(productId) {
    const product = rawProducts.find(p => p.id === productId);
    if (!product) return;

    // Gallery
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

    // Texts
    document.getElementById('modal-category').textContent = product.category;
    document.getElementById('modal-title').textContent = product.name;
    document.getElementById('modal-rating-text').textContent = `${(product.rating || 4.9).toFixed(1)} (${product.reviewCount || 24} reviews)`;
    document.getElementById('modal-price').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('modal-original-price').textContent = `$${product.originalPrice.toFixed(2)}`;
    document.getElementById('modal-description').textContent = product.description || 'Handcrafted from competition-grade genuine leather hide with heavy-duty solid brass hardware and ergonomic comfort cut.';

    // Sizes
    const sizeOptionsContainer = document.getElementById('modal-size-options');
    const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', '2XL'];
    let selectedModalSize = availableSizes[0];

    if (sizeOptionsContainer) {
      sizeOptionsContainer.innerHTML = availableSizes.map((sz, idx) => `
        <button type="button" class="modal-size-pill ${idx === 0 ? 'active' : ''}" 
          onclick="selectModalSize(this, '${sz}')">${sz}</button>
      `).join('');
    }

    window.selectModalSize = function(btn, sz) {
      sizeOptionsContainer.querySelectorAll('.modal-size-pill').forEach(b => b.classList.remove('active'));
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
        const text = encodeURIComponent(`Hello Haji Leather Atelier, I want to order / inquire about: ${product.name} (Size: ${selectedModalSize}, Qty: ${qty}) for $${(product.price * qty).toFixed(2)}.`);
        waBtn.href = `https://wa.me/923046251824?text=${text}`;
      }
    }
    updateModalWhatsAppBtn();

    const modalAddCartBtn = document.getElementById('modal-add-to-cart-btn');
    if (modalAddCartBtn) {
      modalAddCartBtn.onclick = () => {
        const qty = parseInt(qtyInput?.value || 1, 10);
        addToCart(product, selectedModalSize, qty);
        closeProductQuickView();
      };
    }

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
  // 8. WISHLIST MANAGEMENT
  // ==========================================================================
  window.toggleWishlist = function(productId) {
    const idx = wishlist.indexOf(productId);
    if (idx > -1) {
      wishlist.splice(idx, 1);
      showToast('Removed from saved wishlist');
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
              <button type="button" class="pill-btn primary-pill" style="padding: 5px 12px; font-size: 11px;" 
                onclick="addToCartFromWishlist('${p.id}')">Add to Bag</button>
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
  // 9. MOBILE DRAWER & SIZE GUIDE
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

  function openSizeGuide() {
    if (sizeGuideModal) sizeGuideModal.classList.add('open');
    if (sizeGuideBackdrop) sizeGuideBackdrop.classList.add('open');
  }

  function closeSizeGuide() {
    if (sizeGuideModal) sizeGuideModal.classList.remove('open');
    if (sizeGuideBackdrop) sizeGuideBackdrop.classList.remove('open');
  }

  document.querySelectorAll('#nav-size-guide-btn, #mobile-size-guide-btn, #modal-open-size-guide, #footer-size-chart-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openSizeGuide();
      closeMobileDrawer();
    });
  });

  if (sizeGuideCloseBtn) sizeGuideCloseBtn.addEventListener('click', closeSizeGuide);
  if (sizeGuideBackdrop) sizeGuideBackdrop.addEventListener('click', closeSizeGuide);

  // Helper
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Boot
  renderProducts();
  updateCartUI();
  updateWishlistUI();
});
