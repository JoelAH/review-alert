/**
 * Performance monitoring utilities for ReviewQuest
 */

// Web Vitals tracking
export const trackWebVitals = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Basic performance tracking without web-vitals dependency
    try {
      // Track page load time
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          console.log('Page Load Time:', navigation.loadEventEnd - navigation.fetchStart);
          console.log('DOM Content Loaded:', navigation.domContentLoadedEventEnd - navigation.fetchStart);
          console.log('First Paint:', performance.getEntriesByName('first-paint')[0]?.startTime || 'N/A');
          console.log('First Contentful Paint:', performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 'N/A');
        }
      });
    } catch (error) {
      console.log('Performance tracking not available');
    }
  }
};

// Performance observer for monitoring
export const observePerformance = () => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('Navigation timing:', entry);
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 100) { // Log slow resources
            console.log('Slow resource:', entry.name, entry.duration);
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('Paint timing:', entry.name, entry.startTime);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.log('Performance Observer not supported');
    }
  }
};

// Image lazy loading utility
export const lazyLoadImages = () => {
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
};

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof window !== 'undefined') {
    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap';
    fontLink.as = 'style';
    document.head.appendChild(fontLink);

    // Preload critical images (if any)
    const criticalImages = [
      '/hero-image.webp',
      '/logo.webp'
    ];

    criticalImages.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = 'image';
      document.head.appendChild(link);
    });
  }
};

// Bundle size monitoring
export const monitorBundleSize = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let totalSize = 0;
      let jsSize = 0;
      let cssSize = 0;

      resources.forEach((resource) => {
        if (resource.transferSize) {
          totalSize += resource.transferSize;
          
          if (resource.name.includes('.js')) {
            jsSize += resource.transferSize;
          } else if (resource.name.includes('.css')) {
            cssSize += resource.transferSize;
          }
        }
      });

      console.log('Bundle sizes:', {
        total: `${(totalSize / 1024).toFixed(2)} KB`,
        javascript: `${(jsSize / 1024).toFixed(2)} KB`,
        css: `${(cssSize / 1024).toFixed(2)} KB`
      });
    });
  }
};

// Initialize all performance monitoring
export const initPerformanceMonitoring = () => {
  trackWebVitals();
  observePerformance();
  lazyLoadImages();
  preloadCriticalResources();
  monitorBundleSize();
};