import { securityService } from '../services/security.service';
import { rateLimiter } from '../services/rateLimiter.service';
import { apiService, ApiServiceError } from '../services/api.service';

describe('Security Service Tests', () => {
  describe('CSRF Protection', () => {
    it('should generate a CSRF token', () => {
      const token = securityService.getCSRFToken();
      expect(token).toBeTruthy();
      expect(token.length).toBeGreaterThan(32);
    });

    it('should return the same CSRF token on multiple calls', () => {
      const token1 = securityService.getCSRFToken();
      const token2 = securityService.getCSRFToken();
      expect(token1).toBe(token2);
    });
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const testData = { 
        username: 'testuser', 
        password: 'secretpass123',
        sessionId: '12345'
      };

      const encrypted = securityService.encrypt(testData);
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(JSON.stringify(testData));

      const decrypted = securityService.decrypt(encrypted);
      expect(decrypted).toEqual(testData);
    });

    it('should handle encryption errors gracefully', () => {
      const circular: any = {};
      circular.self = circular;

      const encrypted = securityService.encrypt(circular);
      expect(encrypted).toBe('');
    });

    it('should handle decryption errors gracefully', () => {
      const decrypted = securityService.decrypt('invalid-encrypted-data');
      expect(decrypted).toBeNull();
    });
  });

  describe('Secure Storage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should store encrypted data in localStorage', () => {
      const testData = { token: 'abc123', userId: 'user1' };
      
      securityService.secureStorage.setItem('test', testData);
      
      const storedValue = localStorage.getItem('secure_test');
      expect(storedValue).toBeTruthy();
      expect(storedValue).not.toContain('abc123');
      expect(storedValue).not.toContain('user1');
    });

    it('should retrieve decrypted data from localStorage', () => {
      const testData = { token: 'xyz789', userId: 'user2' };
      
      securityService.secureStorage.setItem('test', testData);
      const retrieved = securityService.secureStorage.getItem('test');
      
      expect(retrieved).toEqual(testData);
    });

    it('should handle non-existent keys gracefully', () => {
      const retrieved = securityService.secureStorage.getItem('nonexistent');
      expect(retrieved).toBeNull();
    });

    it('should clear secure storage', () => {
      securityService.secureStorage.setItem('test1', { data: 'value1' });
      securityService.secureStorage.setItem('test2', { data: 'value2' });
      localStorage.setItem('regular_item', 'regular_value');

      securityService.secureStorage.clear();

      expect(localStorage.getItem('secure_test1')).toBeNull();
      expect(localStorage.getItem('secure_test2')).toBeNull();
      expect(localStorage.getItem('regular_item')).toBe('regular_value');
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize malicious input', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const sanitized = securityService.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
    });

    it('should preserve safe HTML entities', () => {
      const safeInput = 'Hello & welcome < 3';
      const sanitized = securityService.sanitizeInput(safeInput);
      
      expect(sanitized).toBe('Hello &amp; welcome &lt; 3');
    });
  });
});

describe('Rate Limiter Tests', () => {
  beforeEach(() => {
    // Reset rate limiter state
    rateLimiter.cleanup();
  });

  it('should allow requests within rate limit', async () => {
    const endpoint = '/api/test';
    
    for (let i = 0; i < 5; i++) {
      const allowed = await rateLimiter.checkLimit(endpoint, 'auth');
      expect(allowed).toBe(true);
    }
  });

  it('should block requests exceeding rate limit', async () => {
    const endpoint = '/api/auth/login';
    
    // Auth category has limit of 5 requests per 5 minutes
    for (let i = 0; i < 5; i++) {
      await rateLimiter.checkLimit(endpoint, 'auth');
    }

    // 6th request should fail
    await expect(rateLimiter.checkLimit(endpoint, 'auth')).rejects.toThrow('Rate limit exceeded');
  });

  it('should track different endpoints separately', async () => {
    const endpoint1 = '/api/endpoint1';
    const endpoint2 = '/api/endpoint2';
    
    // Max out endpoint1
    for (let i = 0; i < 100; i++) {
      await rateLimiter.checkLimit(endpoint1, 'default');
    }

    // endpoint2 should still be allowed
    const allowed = await rateLimiter.checkLimit(endpoint2, 'default');
    expect(allowed).toBe(true);
  });

  it('should reset limits after time window', async () => {
    jest.useFakeTimers();
    
    const endpoint = '/api/test';
    
    // Use up the rate limit
    for (let i = 0; i < 3; i++) {
      await rateLimiter.checkLimit(endpoint, 'payment');
    }

    // Should be blocked
    await expect(rateLimiter.checkLimit(endpoint, 'payment')).rejects.toThrow();

    // Advance time past the window
    jest.advanceTimersByTime(61000); // 61 seconds

    // Should be allowed again
    const allowed = await rateLimiter.checkLimit(endpoint, 'payment');
    expect(allowed).toBe(true);

    jest.useRealTimers();
  });

  it('should return correct remaining requests', () => {
    const endpoint = '/api/test';
    
    // Initially should have full quota
    let remaining = rateLimiter.getRemainingRequests(endpoint, 'order');
    expect(remaining).toBe(10); // Order category limit

    // After one request
    rateLimiter.checkLimit(endpoint, 'order');
    remaining = rateLimiter.getRemainingRequests(endpoint, 'order');
    expect(remaining).toBe(9);
  });
});

describe('API Service Security Tests', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    rateLimiter.cleanup();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should include CSRF token in requests', async () => {
    const mockResponse = { token: 'test-token', user: { id: '1', email: 'test@test.com', name: 'Test', role: 'user' } };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await apiService.login({ email: 'test@test.com', password: 'password', tableNumber: '1' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.any(Headers),
        credentials: 'include',
      })
    );

    const call = (global.fetch as jest.Mock).mock.calls[0];
    const headers = call[1].headers;
    expect(headers.get('X-CSRF-Token')).toBeTruthy();
  });

  it('should handle rate limit errors', async () => {
    // Exhaust rate limit for auth endpoint
    for (let i = 0; i < 5; i++) {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      try {
        await apiService.login({ email: 'test@test.com', password: 'wrong', tableNumber: '1' });
      } catch (e) {
        // Expected to fail
      }
    }

    // Next request should be rate limited
    await expect(
      apiService.login({ email: 'test@test.com', password: 'password', tableNumber: '1' })
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('should throw ApiServiceError with proper status code', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found', message: 'Resource not found' }),
    });

    try {
      await apiService.fetchMenu('test-token');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiServiceError);
      expect((error as ApiServiceError).statusCode).toBe(404);
      expect((error as ApiServiceError).message).toBe('Resource not found');
    }
  });
});