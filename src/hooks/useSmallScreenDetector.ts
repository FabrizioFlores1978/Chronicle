import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the app is being executed on a small screen or handheld phone device.
 * Checks CSS width (< 768px), device screen width, and user agent.
 */
export function useSmallScreenDetector() {
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('chronicle_small_screen_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const checkScreen = () => {
      // 1. Check window inner width (CSS pixels)
      const isNarrowWidth = window.innerWidth < 768;

      // 2. Check screen device width based on DPI
      const isNarrowScreenDevice = window.screen && window.screen.width < 768;

      // 3. User agent check for mobile phone devices
      const isMobileUserAgent = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      // Trigger if narrow viewport width OR (mobile phone UA with small screen)
      const detected = isNarrowWidth || isNarrowScreenDevice || (isMobileUserAgent && window.innerWidth < 1024);

      setIsSmallScreen(detected);
    };

    checkScreen();

    window.addEventListener('resize', checkScreen);
    window.addEventListener('orientationchange', checkScreen);

    return () => {
      window.removeEventListener('resize', checkScreen);
      window.removeEventListener('orientationchange', checkScreen);
    };
  }, []);

  const dismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('chronicle_small_screen_dismissed', 'true');
    } catch {
      // Ignore storage errors
    }
  };

  return {
    showNotice: isSmallScreen && !isDismissed,
    dismiss,
  };
}
