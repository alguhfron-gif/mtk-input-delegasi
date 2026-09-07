import { useEffect } from 'react';

export type BackHandler = () => boolean | void;

interface BackHandlerEntry {
  id: string;
  handler: BackHandler;
}

// Global LIFO stack of back handlers (for modals, drawers, overlays)
const backHandlerStack: BackHandlerEntry[] = [];

/**
 * Register a back handler.
 * The most recently registered handler will be executed first on back gesture.
 */
export function registerBackHandler(id: string, handler: BackHandler): () => void {
  // Remove existing handler with same id if any
  const existingIdx = backHandlerStack.findIndex(item => item.id === id);
  if (existingIdx !== -1) {
    backHandlerStack.splice(existingIdx, 1);
  }

  backHandlerStack.push({ id, handler });

  return () => {
    const idx = backHandlerStack.findIndex(item => item.id === id);
    if (idx !== -1) {
      backHandlerStack.splice(idx, 1);
    }
  };
}

/**
 * Executes the topmost active back handler if any exists.
 * Returns true if a handler was executed, false otherwise.
 */
export function executeTopBackHandler(): boolean {
  if (backHandlerStack.length > 0) {
    const top = backHandlerStack.pop();
    if (top && top.handler) {
      try {
        const result = top.handler();
        // If result is explicitly false, it did not consume the back action
        if (result === false) {
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Error executing back handler:', err);
        return true;
      }
    }
  }
  return false;
}

export function hasActiveBackHandlers(): boolean {
  return backHandlerStack.length > 0;
}

/**
 * Initialize history on application launch so that the back gesture on mobile
 * is ALWAYS trapped within the app, preventing "about:blank" white screen crashes.
 */
export function initAppHistory(initialPage: string) {
  if (typeof window === 'undefined' || !window.history) return;

  try {
    const currentState = window.history.state;
    if (!currentState || !currentState.mtkApp) {
      // 1. Set current root state
      window.history.replaceState(
        { mtkApp: true, page: initialPage, isRoot: true, timestamp: Date.now() },
        '',
        window.location.pathname + window.location.search
      );

      // 2. Push guard entry so physical/gesture back never exits the browser tab immediately
      window.history.pushState(
        { mtkApp: true, page: initialPage, isGuard: true, timestamp: Date.now() },
        '',
        window.location.pathname + window.location.search
      );
    }
  } catch (err) {
    console.warn('initAppHistory failed:', err);
  }
}

/**
 * Push new page to browser history so swipe-back traverses pages in reverse.
 */
export function pushPageToHistory(page: string) {
  if (typeof window === 'undefined' || !window.history) return;

  try {
    // Only push if the current history state is different
    const current = window.history.state;
    if (current && current.mtkApp && current.page === page && !current.modal) {
      return;
    }

    window.history.pushState(
      { mtkApp: true, page, timestamp: Date.now() },
      '',
      `?tab=${page}`
    );
  } catch (err) {
    console.warn('pushPageToHistory failed:', err);
  }
}

/**
 * Push modal history state so swipe-back on mobile smoothly closes the modal.
 */
export function pushModalToHistory(modalId: string, page: string) {
  if (typeof window === 'undefined' || !window.history) return;

  try {
    window.history.pushState(
      { mtkApp: true, page, modal: modalId, timestamp: Date.now() },
      ''
    );
  } catch (err) {
    console.warn('pushModalToHistory failed:', err);
  }
}

/**
 * Custom React Hook for any modal, sheet, or overlay.
 * Automatically handles:
 * 1. Physical back button on Android
 * 2. Swipe gesture from left/right edge on HP
 * 3. ESC key on desktop
 * 4. Safe programmatic closing without desyncing browser history
 */
export function useModalBackHandler(
  isOpen: boolean,
  onClose: () => void,
  modalId: string,
  currentPage: string
) {
  useEffect(() => {
    if (!isOpen) return;

    // 1. Push modal state to history
    pushModalToHistory(modalId, currentPage);

    // 2. Register handler in backHandlerStack
    const unregister = registerBackHandler(modalId, () => {
      onClose();
      return true;
    });

    // 3. Desktop ESC key handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        safeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unregister();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, modalId, currentPage, onClose]);

  // Safe programmatic close (e.g. when user taps 'X' button or backdrop)
  const safeClose = () => {
    try {
      if (window.history && window.history.state && window.history.state.modal === modalId) {
        // Calling history.back() pops the state and triggers popstate, which executes the back handler
        window.history.back();
        return;
      }
    } catch {
      // ignore
    }
    // Fallback if history state isn't matching
    onClose();
  };

  return { safeClose };
}
