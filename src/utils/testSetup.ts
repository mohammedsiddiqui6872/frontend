// Test environment setup for security features

export const setupTestEnvironment = () => {
  // Mock crypto.getRandomValues for tests
  if (!global.crypto) {
    global.crypto = {
      getRandomValues: (array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
    } as any;
  }

  // Mock localStorage
  const localStorageMock: Storage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  };
  global.localStorage = localStorageMock;

  // Mock fetch if not already mocked
  if (!global.fetch) {
    global.fetch = jest.fn();
  }

  // Mock console methods to avoid noise in tests
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
};

// Security test helpers
export const testSecurityHeaders = (headers: Headers) => {
  expect(headers.get('X-CSRF-Token')).toBeTruthy();
  expect(headers.get('Content-Type')).toBe('application/json');
};

export const createMockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  headers: new Headers(),
});

// Rate limiter test helper
export const exhaustRateLimit = async (
  fn: () => Promise<any>,
  limit: number
) => {
  const attempts = [];
  for (let i = 0; i < limit; i++) {
    attempts.push(fn());
  }
  await Promise.all(attempts);
};