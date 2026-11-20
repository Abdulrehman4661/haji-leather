/**
 * HAJI LEATHER — Interactive Scripts (Molexent-Style E-Commerce Features)
 */

document.addEventListener('DOMContentLoaded', () => {

  /* --------------------------------------------------------------------------
     1. Hero Slideshow Carousel (Auto-slide, Arrows, Dots)
     -------------------------------------------------------------------------- */
  const slides = document.querySelectorAll('.slide-item');
  const dots = document.querySelectorAll('.slider-dots .dot');
  const prevBtn = document.getElementById('prev-slide');
  const nextBtn = document.getElementById('next-slide');
  let currentSlide = 0;
  let slideInterval = null;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    currentSlide = index;
  }

  function nextSlide() {
    let nextIndex = (currentSlide + 1) % slides.length;
    showSlide(nextIndex);
  }

  function prevSlide() {
    let prevIndex = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(prevIndex);
  }

  if (slides.length > 0) {
    if (nextBtn) nextBtn.addEventListener('click', () => {
      nextSlide();
      resetInterval();
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
      prevSlide();
      resetInterval();
    });

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const index = parseInt(dot.getAttribute('data-index'), 10);
        showSlide(index);
        resetInterval();
      });
    });

    function startInterval() {
      slideInterval = setInterval(nextSlide, 5000);
    }

    function resetInterval() {
      clearInterval(slideInterval);
      startInterval();
    }

    startInterval();
  }

  /* --------------------------------------------------------------------------
     2. Product Tabs Switcher (Latest / Bestseller / Custom Made)
     -------------------------------------------------------------------------- */
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  /* --------------------------------------------------------------------------
     3. Mobile Navigation Menu Toggle
     -------------------------------------------------------------------------- */
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mainNav = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mainNav.classList.toggle('active');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 868) {
          mainNav.classList.remove('active');
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     4. Header Search Input Simulation
     -------------------------------------------------------------------------- */
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-button');

  function handleSearch() {
    const query = searchInput ? searchInput.value.trim() : '';
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (query) {
      // Optional subtle feedback
      console.log('Search query for Haji Leather:', query);
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
  }

  /* --------------------------------------------------------------------------
     5. Smooth Scroll for Anchor Links
     -------------------------------------------------------------------------- */
  const smoothLinks = document.querySelectorAll('a[href^="#"]');
  smoothLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

});
