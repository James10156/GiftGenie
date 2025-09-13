import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getProductImage, getAlternativeProductImage } from './imageService';

// Mock node-fetch
const mockFetch = vi.fn();
vi.mock('node-fetch', () => ({
  default: mockFetch,
}));

// Mock environment variables
const mockEnv = {
  UNSPLASH_ACCESS_KEY: 'test-unsplash-key',
  PEXELS_API_KEY: 'test-pexels-key',
};

describe('Image Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.env
    Object.assign(process.env, mockEnv);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getProductImage', () => {
    it('should return Unsplash image when API call succeeds', async () => {
      const mockUnsplashResponse = {
        results: [
          {
            id: 'test-image-1',
            urls: {
              regular: 'https://images.unsplash.com/photo-123?w=400',
              small: 'https://images.unsplash.com/photo-123?w=200',
              thumb: 'https://images.unsplash.com/photo-123?w=100',
            },
            alt_description: 'Test product image',
            description: 'A beautiful test product',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUnsplashResponse),
      });

      const result = await getProductImage('Nintendo Switch');

      expect(result).toBe('https://images.unsplash.com/photo-123?w=400');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.unsplash.com/search/photos'),
        expect.objectContaining({
          headers: {
            Authorization: 'Client-ID test-unsplash-key',
          },
        })
      );
    });

    it('should encode search query properly', async () => {
      const mockUnsplashResponse = { results: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUnsplashResponse),
      });

      await getProductImage('Gaming Headset & Microphone');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('gaming%20headset%20microphone'),
        expect.any(Object)
      );
    });

    it('should fall back to fallback image when Unsplash returns no results', async () => {
      const mockUnsplashResponse = { results: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUnsplashResponse),
      });

      const result = await getProductImage('headphones');

      expect(result).toBe('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400');
    });

    it('should fall back when Unsplash API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getProductImage('laptop');

      expect(result).toBe('https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400');
    });

    it('should fall back when Unsplash returns HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429, // Rate limited
      });

      const result = await getProductImage('phone');

      expect(result).toBe('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400');
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await getProductImage('camera');

      expect(result).toBe('https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400');
    });

    it('should use product description for better matching', async () => {
      const mockUnsplashResponse = { results: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUnsplashResponse),
      });

      const result = await getProductImage('Premium Device', 'Wireless bluetooth headphones with noise cancellation');

      // Should match headphones category from description
      expect(result).toBe('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400');
    });
  });

  describe('getAlternativeProductImage', () => {
    it('should return Pexels image when API call succeeds', async () => {
      const mockPexelsResponse = {
        photos: [
          {
            id: 'pexels-123',
            src: {
              medium: 'https://images.pexels.com/photos/123/pexels-photo-123.jpeg?w=400',
              small: 'https://images.pexels.com/photos/123/pexels-photo-123.jpeg?w=200',
            },
            alt: 'Test product from Pexels',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPexelsResponse),
      });

      const result = await getAlternativeProductImage('Wireless Speaker');

      expect(result).toBe('https://images.pexels.com/photos/123/pexels-photo-123.jpeg?w=400');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.pexels.com/v1/search'),
        expect.objectContaining({
          headers: {
            Authorization: 'test-pexels-key',
          },
        })
      );
    });

    it('should fall back to fallback image when Pexels API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Pexels API error'));

      const result = await getAlternativeProductImage('watch');

      expect(result).toBe('https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400');
    });

    it('should fall back when Pexels returns no photos', async () => {
      const mockPexelsResponse = { photos: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPexelsResponse),
      });

      const result = await getAlternativeProductImage('tablet');

      expect(result).toBe('https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400');
    });

    it('should handle missing environment variables', async () => {
      delete process.env.PEXELS_API_KEY;

      const result = await getAlternativeProductImage('smartwatch');

      expect(result).toBe('https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400');
      
      // Should still make the API call with fallback key
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: 'your-pexels-api-key',
          },
        })
      );
    });
  });

  describe('Product Name Cleaning', () => {
    it('should clean product names for better search results', async () => {
      const mockUnsplashResponse = { results: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUnsplashResponse),
      });

      await getProductImage('The Amazing Wireless Gaming Headset with RGB Lights for Professional Gamers');

      // Should clean and simplify the search term
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('amazing%20wireless%20gaming'),
        expect.any(Object)
      );
    });

    it('should remove articles and prepositions', async () => {
      const mockUnsplashResponse = { results: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUnsplashResponse),
      });

      await getProductImage('A Premium Laptop for Students');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('premium%20laptop'),
        expect.any(Object)
      );
    });

    it('should handle special characters in product names', async () => {
      const mockUnsplashResponse = { results: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUnsplashResponse),
      });

      await getProductImage('iPhone 15 Pro Max (256GB) - Space Black!');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('iphone%2015%20pro'),
        expect.any(Object)
      );
    });
  });

  describe('Fallback Image Matching', () => {
    it('should match electronics products correctly', async () => {
      const electronicsTests = [
        { input: 'smartphone', expected: 'phone' },
        { input: 'macbook pro', expected: 'laptop' },
        { input: 'airpods max', expected: 'headphones' },
        { input: 'digital camera', expected: 'camera' },
        { input: 'bluetooth speaker', expected: 'bluetooth speaker' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      for (const test of electronicsTests) {
        const result = await getProductImage(test.input);
        expect(result).toContain('images.unsplash.com');
      }
    });

    it('should match fashion products correctly', async () => {
      const fashionTests = [
        'designer watch',
        'leather handbag',
        'diamond necklace',
        'gold bracelet',
        'silver earrings',
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      for (const product of fashionTests) {
        const result = await getProductImage(product);
        expect(result).toContain('images.unsplash.com');
        expect(result).toMatch(/w=400/);
      }
    });

    it('should match home products correctly', async () => {
      const homeTests = [
        'scented candle',
        'houseplant',
        'coffee mug',
        'throw pillow',
        'reading lamp',
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      for (const product of homeTests) {
        const result = await getProductImage(product);
        expect(result).toContain('images.unsplash.com');
      }
    });

    it('should provide default fallback for unmatched products', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      const result = await getProductImage('completely unknown weird product xyz123');
      
      // Should still return a valid fallback image
      expect(result).toContain('images.unsplash.com');
    });
  });

  describe('API Integration', () => {
    it('should set correct Unsplash API parameters', async () => {
      const mockUnsplashResponse = { results: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUnsplashResponse),
      });

      await getProductImage('test product');

      const fetchCall = mockFetch.mock.calls[0];
      const url = fetchCall[0] as string;
      
      expect(url).toContain('api.unsplash.com/search/photos');
      expect(url).toContain('per_page=5');
      expect(url).toContain('orientation=squarish');
      expect(url).toContain('query=test%20product');
    });

    it('should set correct Pexels API parameters', async () => {
      const mockPexelsResponse = { photos: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPexelsResponse),
      });

      await getAlternativeProductImage('test product');

      const fetchCall = mockFetch.mock.calls[0];
      const url = fetchCall[0] as string;
      
      expect(url).toContain('api.pexels.com/v1/search');
      expect(url).toContain('per_page=5');
      expect(url).toContain('orientation=square');
      expect(url).toContain('query=test%20product');
    });

    it('should handle API rate limiting gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      const result = await getProductImage('rate limited product');

      // Should fall back gracefully without throwing
      expect(result).toBeDefined();
      expect(result).toContain('images.unsplash.com');
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const result = await getProductImage('timeout test');

      expect(result).toBeDefined();
      expect(result).toContain('images.unsplash.com');
    });
  });

  describe('Error Recovery', () => {
    it('should handle multiple API failures gracefully', async () => {
      // Simulate multiple service failures
      mockFetch
        .mockRejectedValueOnce(new Error('Unsplash down'))
        .mockRejectedValueOnce(new Error('Pexels down'));

      const unsplashResult = await getProductImage('test');
      const pexelsResult = await getAlternativeProductImage('test');

      // Both should return valid fallback images
      expect(unsplashResult).toBeDefined();
      expect(pexelsResult).toBeDefined();
      expect(unsplashResult).toContain('images.unsplash.com');
      expect(pexelsResult).toContain('images.unsplash.com');
    });

    it('should never return null or undefined', async () => {
      // Test various failure scenarios
      const failureTests = [
        () => mockFetch.mockRejectedValueOnce(new Error('Network error')),
        () => mockFetch.mockResolvedValueOnce({ ok: false, status: 500 }),
        () => mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(null) }),
        () => mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }),
      ];

      for (const setupFailure of failureTests) {
        setupFailure();
        const result = await getProductImage('test product');
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });
});
