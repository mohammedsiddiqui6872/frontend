export const useHapticFeedback = () => {
  const vibrate = (pattern: number | number[] = 50) => {
    // Check if vibration API is supported
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const lightTap = () => vibrate(10);
  const mediumTap = () => vibrate(30);
  const heavyTap = () => vibrate(50);
  const successTap = () => vibrate([20, 50, 20]);
  const errorTap = () => vibrate([50, 100, 50]);
  const warningTap = () => vibrate([30, 30, 30]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    successTap,
    errorTap,
    warningTap,
  };
};