import { useEffect, useState, useCallback } from 'react';

interface HapticPattern {
  name: string;
  pattern: number | number[];
  description: string;
}

// Predefined haptic patterns for different interactions
const HAPTIC_PATTERNS: Record<string, HapticPattern> = {
  // Basic interactions
  light: { name: 'Light Tap', pattern: 10, description: 'Subtle feedback for hover' },
  medium: { name: 'Medium Tap', pattern: 30, description: 'Standard button press' },
  heavy: { name: 'Heavy Tap', pattern: 50, description: 'Important action' },
  
  // Success/Error patterns
  success: { name: 'Success', pattern: [20, 50, 20], description: 'Action completed' },
  error: { name: 'Error', pattern: [50, 100, 50], description: 'Error occurred' },
  warning: { name: 'Warning', pattern: [30, 30, 30], description: 'Warning feedback' },
  
  // Special patterns
  notification: { name: 'Notification', pattern: [100, 50, 100], description: 'New notification' },
  achievement: { name: 'Achievement', pattern: [50, 100, 50, 100, 50], description: 'Achievement unlocked' },
  heartbeat: { name: 'Heartbeat', pattern: [50, 200, 50, 200], description: 'Living pulse' },
  
  // Menu interactions
  addToCart: { name: 'Add to Cart', pattern: [30, 50, 30], description: 'Item added' },
  removeFromCart: { name: 'Remove', pattern: [50, 30], description: 'Item removed' },
  swipe: { name: 'Swipe', pattern: [10, 20, 10], description: 'Swipe gesture' },
  
  // Game-like patterns
  levelUp: { name: 'Level Up', pattern: [30, 50, 30, 50, 100], description: 'Level achieved' },
  unlock: { name: 'Unlock', pattern: [20, 40, 20, 40, 80], description: 'Feature unlocked' },
  reward: { name: 'Reward', pattern: [100, 50, 100, 50, 100], description: 'Reward received' },
};

export const useHapticFeedback = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Check if vibration API is supported
    setIsSupported('vibrate' in navigator);
    
    // Check user preference from localStorage
    const savedPreference = localStorage.getItem('hapticFeedback');
    if (savedPreference !== null) {
      setIsEnabled(savedPreference === 'true');
    }
  }, []);

  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if (isSupported && isEnabled) {
      navigator.vibrate(pattern);
    }
  }, [isSupported, isEnabled]);

  const triggerHaptic = useCallback((type: keyof typeof HAPTIC_PATTERNS | number | number[]) => {
    if (typeof type === 'string' && type in HAPTIC_PATTERNS) {
      const pattern = HAPTIC_PATTERNS[type];
      if (pattern) {
        vibrate(pattern.pattern);
      }
    } else {
      vibrate(type as number | number[]);
    }
  }, [vibrate]);

  // Convenience methods for common patterns
  const lightTap = useCallback(() => triggerHaptic('light'), [triggerHaptic]);
  const mediumTap = useCallback(() => triggerHaptic('medium'), [triggerHaptic]);
  const heavyTap = useCallback(() => triggerHaptic('heavy'), [triggerHaptic]);
  const successTap = useCallback(() => triggerHaptic('success'), [triggerHaptic]);
  const errorTap = useCallback(() => triggerHaptic('error'), [triggerHaptic]);
  const warningTap = useCallback(() => triggerHaptic('warning'), [triggerHaptic]);

  // Advanced haptic sequences
  const playSequence = useCallback(async (sequence: Array<{ pattern: number | number[], delay: number }>) => {
    for (const step of sequence) {
      vibrate(step.pattern);
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }
  }, [vibrate]);

  // Enable/disable haptic feedback
  const toggleHapticFeedback = useCallback(() => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    localStorage.setItem('hapticFeedback', newState.toString());
    
    // Give feedback about the change
    if (newState) {
      vibrate([30, 50, 30]); // Enabled pattern
    }
  }, [isEnabled, vibrate]);

  return {
    // Core functionality
    vibrate,
    triggerHaptic,
    isSupported,
    isEnabled,
    toggleHapticFeedback,
    
    // Common patterns
    lightTap,
    mediumTap,
    heavyTap,
    successTap,
    errorTap,
    warningTap,
    
    // Advanced features
    playSequence,
    patterns: HAPTIC_PATTERNS,
  };
};