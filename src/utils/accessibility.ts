// ARIA live region announcer
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.setAttribute('class', 'sr-only');
  announcer.textContent = message;
  document.body.appendChild(announcer);
  
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
};

// Improved focus trap for modals with better selector
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'a[href]:not([disabled]), ' +
    'button:not([disabled]), ' +
    'textarea:not([disabled]), ' +
    'input[type="text"]:not([disabled]), ' +
    'input[type="radio"]:not([disabled]), ' +
    'input[type="checkbox"]:not([disabled]), ' +
    'input[type="number"]:not([disabled]), ' +
    'input[type="email"]:not([disabled]), ' +
    'input[type="tel"]:not([disabled]), ' +
    'select:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"]):not([disabled]), ' +
    '[contenteditable]:not([disabled])'
  );
  const firstFocusableElement = focusableElements[0] as HTMLElement;
  const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);
  firstFocusableElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

// Keyboard navigation for lists and grids
export const handleListKeyNavigation = (
  e: KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onNavigate: (newIndex: number) => void,
  options: {
    wrap?: boolean;
    orientation?: 'vertical' | 'horizontal' | 'grid';
    gridColumns?: number;
  } = {}
) => {
  const { wrap = true, orientation = 'vertical', gridColumns = 1 } = options;
  let newIndex = currentIndex;

  switch (e.key) {
    case 'ArrowDown':
      if (orientation === 'grid') {
        newIndex = currentIndex + gridColumns;
      } else if (orientation === 'vertical') {
        newIndex = currentIndex + 1;
      }
      break;
    case 'ArrowUp':
      if (orientation === 'grid') {
        newIndex = currentIndex - gridColumns;
      } else if (orientation === 'vertical') {
        newIndex = currentIndex - 1;
      }
      break;
    case 'ArrowRight':
      if (orientation === 'horizontal' || orientation === 'grid') {
        newIndex = currentIndex + 1;
      }
      break;
    case 'ArrowLeft':
      if (orientation === 'horizontal' || orientation === 'grid') {
        newIndex = currentIndex - 1;
      }
      break;
    case 'Home':
      newIndex = 0;
      e.preventDefault();
      break;
    case 'End':
      newIndex = totalItems - 1;
      e.preventDefault();
      break;
    default:
      return;
  }

  // Handle wrapping
  if (wrap) {
    if (newIndex < 0) newIndex = totalItems - 1;
    if (newIndex >= totalItems) newIndex = 0;
  } else {
    newIndex = Math.max(0, Math.min(totalItems - 1, newIndex));
  }

  if (newIndex !== currentIndex) {
    e.preventDefault();
    onNavigate(newIndex);
  }
};

// Skip link component for navigation
export const createSkipLink = (targetId: string, text: string = 'Skip to main content') => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'skip-link';
  skipLink.setAttribute('tabindex', '0');
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
  
  return skipLink;
};

// Escape key handler for modals/dialogs
export const handleEscapeKey = (callback: () => void) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      callback();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
};

// Roving tabindex for menu navigation
export const setupRovingTabIndex = (
  container: HTMLElement,
  itemSelector: string = '[role="menuitem"]'
) => {
  const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];
  let currentIndex = 0;

  // Set initial tabindex
  items.forEach((item, index) => {
    item.tabIndex = index === 0 ? 0 : -1;
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    const oldIndex = currentIndex;

    handleListKeyNavigation(e, currentIndex, items.length, (newIndex) => {
      currentIndex = newIndex;
    });

    if (currentIndex !== oldIndex) {
      const oldItem = items[oldIndex];
      const currentItem = items[currentIndex];
      
      if (oldItem && currentItem) {
        oldItem.tabIndex = -1;
        currentItem.tabIndex = 0;
        currentItem.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  return () => container.removeEventListener('keydown', handleKeyDown);
};