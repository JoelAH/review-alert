/**
 * Keyboard navigation utilities for accessibility
 */

// Focusable element selectors
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]'
].join(', ');

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)) as HTMLElement[];
};

/**
 * Trap focus within a container (useful for modals)
 */
export const trapFocus = (container: HTMLElement) => {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    // Escape key to close
    if (event.key === 'Escape') {
      const closeButton = container.querySelector('[aria-label*="close"], [data-close]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  
  // Focus first element
  if (firstElement) {
    firstElement.focus();
  }

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Handle arrow key navigation for lists/grids
 */
export const handleArrowNavigation = (
  event: KeyboardEvent,
  elements: HTMLElement[],
  currentIndex: number,
  orientation: 'horizontal' | 'vertical' | 'grid' = 'vertical'
) => {
  let newIndex = currentIndex;

  switch (event.key) {
    case 'ArrowUp':
      if (orientation === 'vertical' || orientation === 'grid') {
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
      }
      break;
    case 'ArrowDown':
      if (orientation === 'vertical' || orientation === 'grid') {
        event.preventDefault();
        newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
      }
      break;
    case 'ArrowLeft':
      if (orientation === 'horizontal' || orientation === 'grid') {
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
      }
      break;
    case 'ArrowRight':
      if (orientation === 'horizontal' || orientation === 'grid') {
        event.preventDefault();
        newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
      }
      break;
    case 'Home':
      event.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      newIndex = elements.length - 1;
      break;
  }

  if (newIndex !== currentIndex && elements[newIndex]) {
    elements[newIndex].focus();
    return newIndex;
  }

  return currentIndex;
};

/**
 * Announce content to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

/**
 * Skip to main content functionality
 */
export const initSkipLinks = () => {
  const skipLink = document.querySelector('.skip-link') as HTMLAnchorElement;
  if (skipLink) {
    skipLink.addEventListener('click', (event) => {
      event.preventDefault();
      const target = document.querySelector(skipLink.getAttribute('href') || '#main-content') as HTMLElement;
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
};

/**
 * Initialize keyboard navigation for the entire app
 */
export const initKeyboardNavigation = () => {
  // Initialize skip links
  initSkipLinks();

  // Add keyboard event listeners for common patterns
  document.addEventListener('keydown', (event) => {
    // Global keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case '/':
          // Focus search (if available)
          event.preventDefault();
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;
      }
    }
  });

  // Improve focus visibility
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });
};