declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'set' | 'event' | 'consent',
      targetId: string,
      config?: any
    ) => void;
  }
}

export {};