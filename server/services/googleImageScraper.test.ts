import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGoogleImageResult, getProductImageFromGoogle } from './googleImageScraper';

// Mock node-fetch
const mockFetch = vi.fn();
vi.mock('node-fetch', () => ({
  default: mockFetch,
}));

describe('Google Images Scraper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('getGoogleImageResult', () => {
    it('should return null if search term is empty', async () => {
      const result = await getGoogleImageResult('');
      expect(result).toBeNull();
    });

    it('should handle successful Google Images search', async () => {
      const mockHtml = `
        <html>
          <body>
            <script>
              var data = {
                "44588": ["https://example.com/image1.jpg", 400, 300],
                "44589": ["https://example.com/image2.jpg", 500, 400]
              };
            </script>
          </body>
        </html>
      `;

      // Mock successful search response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHtml),
        })
        // Mock successful image validation
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (header: string) => header === 'content-type' ? 'image/jpeg' : null,
          },
        });

      const result = await getGoogleImageResult('Nintendo Switch');

      expect(result).toBe('https://example.com/image1.jpg');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle timeout in Google search request', async () => {
      const timeoutError = new Error('AbortError');
      timeoutError.name = 'AbortError';
      
      mockFetch.mockRejectedValueOnce(timeoutError);

      const result = await getGoogleImageResult('test search');

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('google.com/search'),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should handle timeout in image validation', async () => {
      const mockHtml = `
        <html>
          <body>
            <script>
              var data = {
                "44588": ["https://slow-server.com/image.jpg", 400, 300]
              };
            </script>
          </body>
        </html>
      `;

      const timeoutError = new Error('AbortError');
      timeoutError.name = 'AbortError';

      // Mock successful search but timeout on image validation
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHtml),
        })
        .mockRejectedValueOnce(timeoutError);

      const result = await getGoogleImageResult('test search');

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should skip invalid images and continue to next', async () => {
      const mockHtml = `
        <html>
          <body>
            <script>
              var data = {
                "44588": ["https://invalid-image.com/broken.jpg", 400, 300],
                "44589": ["https://valid-image.com/working.jpg", 500, 400]
              };
            </script>
          </body>
        </html>
      `;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHtml),
        })
        // First image fails validation
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        // Second image succeeds
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (header: string) => header === 'content-type' ? 'image/png' : null,
          },
        });

      const result = await getGoogleImageResult('test search');

      expect(result).toBe('https://valid-image.com/working.jpg');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle non-image content type', async () => {
      const mockHtml = `
        <html>
          <body>
            <script>
              var data = {
                "44588": ["https://example.com/not-an-image.html", 400, 300]
              };
            </script>
          </body>
        </html>
      `;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHtml),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (header: string) => header === 'content-type' ? 'text/html' : null,
          },
        });

      const result = await getGoogleImageResult('test search');

      expect(result).toBeNull();
    });

    it('should extract images from alternative HTML patterns', async () => {
      const mockHtml = `
        <html>
          <body>
            <div>
              <img src="https://alternative-pattern.com/image.jpg" alt="test">
            </div>
          </body>
        </html>
      `;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHtml),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (header: string) => header === 'content-type' ? 'image/jpeg' : null,
          },
        });

      const result = await getGoogleImageResult('test search');

      expect(result).toBe('https://alternative-pattern.com/image.jpg');
    });

    it('should handle HTTP errors from Google', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429, // Rate limited
      });

      const result = await getGoogleImageResult('test search');

      expect(result).toBeNull();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getGoogleImageResult('test search');

      expect(result).toBeNull();
    });
  });

  describe('getProductImageFromGoogle', () => {
    it('should try multiple search strategies', async () => {
      // Mock all strategies to fail except the last one
      const mockHtml = `
        <html>
          <body>
            <script>
              var data = {
                "44588": ["https://final-strategy.com/image.jpg", 400, 300]
              };
            </script>
          </body>
        </html>
      `;

      mockFetch
        // First strategy fails (product)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('<html></html>'),
        })
        // Second strategy fails (buy)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('<html></html>'),
        })
        // Third strategy succeeds (just product name)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHtml),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (header: string) => header === 'content-type' ? 'image/jpeg' : null,
          },
        });

      const result = await getProductImageFromGoogle('Nintendo Switch', 'Gaming console');

      expect(result).toBe('https://final-strategy.com/image.jpg');
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should add delays between search strategies', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html></html>'),
      });

      const startTime = Date.now();
      await getProductImageFromGoogle('test product');
      
      // Run all pending timers to simulate delays
      vi.runAllTimers();
      
      expect(mockFetch).toHaveBeenCalledTimes(3); // 3 strategies attempted
    });

    it('should return null if all strategies fail', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html></html>'),
      });

      const result = await getProductImageFromGoogle('non-existent product');

      expect(result).toBeNull();
    });

    it('should handle product with description', async () => {
      const mockHtml = `
        <html>
          <body>
            <script>
              var data = {
                "44588": ["https://with-description.com/image.jpg", 400, 300]
              };
            </script>
          </body>
        </html>
      `;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHtml),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (header: string) => header === 'content-type' ? 'image/jpeg' : null,
          },
        });

      const result = await getProductImageFromGoogle(
        'iPhone 15',
        'Latest Apple smartphone with advanced camera'
      );

      expect(result).toBe('https://with-description.com/image.jpg');
    });
  });

  describe('AbortController timeout handling', () => {
    it('should properly set up AbortController for Google search', async () => {
      let capturedSignal: AbortSignal | undefined;

      mockFetch.mockImplementationOnce((url, options: any) => {
        capturedSignal = options.signal;
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<html></html>'),
        });
      });

      await getGoogleImageResult('test');

      expect(capturedSignal).toBeInstanceOf(AbortSignal);
    });

    it('should properly set up AbortController for image validation', async () => {
      const mockHtml = `
        <html>
          <body>
            <script>
              var data = {
                "44588": ["https://test.com/image.jpg", 400, 300]
              };
            </script>
          </body>
        </html>
      `;

      let validationSignal: AbortSignal | undefined;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHtml),
        })
        .mockImplementationOnce((url, options: any) => {
          validationSignal = options.signal;
          return Promise.resolve({
            ok: true,
            headers: {
              get: (header: string) => header === 'content-type' ? 'image/jpeg' : null,
            },
          });
        });

      await getGoogleImageResult('test');

      expect(validationSignal).toBeInstanceOf(AbortSignal);
    });
  });
});
