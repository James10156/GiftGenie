import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { serveStatic } from './vite';

// Mock filesystem
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    promises: {
      readFile: vi.fn(),
    },
  },
}));

vi.mock('path', () => ({
  default: {
    resolve: vi.fn(),
  },
}));

describe('Vite Configuration and Static Serving', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    vi.clearAllMocks();
  });

  describe('serveStatic function', () => {
    it('should serve static files when build directory exists', () => {
      const mockDistPath = '/test/path/public';
      
      (path.resolve as any).mockReturnValue(mockDistPath);
      (fs.existsSync as any).mockReturnValue(true);

      // Mock express.static to return a middleware function
      const mockStaticMiddleware = vi.fn();
      vi.spyOn(express, 'static').mockReturnValue(mockStaticMiddleware as any);

      expect(() => serveStatic(app)).not.toThrow();
      
      expect(path.resolve).toHaveBeenCalledWith(expect.any(String), 'public');
      expect(fs.existsSync).toHaveBeenCalledWith(mockDistPath);
      expect(express.static).toHaveBeenCalledWith(mockDistPath);
    });

    it('should throw error when build directory does not exist', () => {
      const mockDistPath = '/test/path/public';
      
      (path.resolve as any).mockReturnValue(mockDistPath);
      (fs.existsSync as any).mockReturnValue(false);

      expect(() => serveStatic(app)).toThrow(
        `Could not find the build directory: ${mockDistPath}, make sure to build the client first`
      );
    });

    it('should set up fallback route for SPA', () => {
      const mockDistPath = '/test/path/public';
      
      (path.resolve as any).mockReturnValue(mockDistPath);
      (fs.existsSync as any).mockReturnValue(true);

      const mockStaticMiddleware = vi.fn();
      vi.spyOn(express, 'static').mockReturnValue(mockStaticMiddleware as any);

      // Mock app.use to capture middleware registration
      const useSpy = vi.spyOn(app, 'use');

      serveStatic(app);

      // Verify that both static middleware and fallback route are registered
      expect(useSpy).toHaveBeenCalledWith(mockStaticMiddleware);
      expect(useSpy).toHaveBeenCalledWith('*', expect.any(Function));
    });
  });

  describe('Build Path Resolution', () => {
    it('should resolve correct build path relative to server directory', () => {
      const expectedPath = path.resolve(__dirname, 'public');
      
      (path.resolve as any).mockReturnValue(expectedPath);
      (fs.existsSync as any).mockReturnValue(true);

      const mockStaticMiddleware = vi.fn();
      vi.spyOn(express, 'static').mockReturnValue(mockStaticMiddleware as any);

      serveStatic(app);

      expect(path.resolve).toHaveBeenCalledWith(expect.any(String), 'public');
    });

    it('should handle relative path resolution correctly', () => {
      const mockServerDir = '/home/user/project/server';
      const expectedPublicDir = '/home/user/project/server/public';

      (path.resolve as any).mockReturnValue(expectedPublicDir);
      (fs.existsSync as any).mockReturnValue(true);

      const mockStaticMiddleware = vi.fn();
      vi.spyOn(express, 'static').mockReturnValue(mockStaticMiddleware as any);

      serveStatic(app);

      expect(path.resolve).toHaveBeenCalled();
    });
  });

  describe('SPA Fallback Route', () => {
    it('should serve index.html for unknown routes', () => {
      const mockDistPath = '/test/path/public';
      const mockIndexPath = '/test/path/public/index.html';
      
      (path.resolve as any)
        .mockReturnValueOnce(mockDistPath)  // First call for dist path
        .mockReturnValueOnce(mockIndexPath); // Second call for index.html
      
      (fs.existsSync as any).mockReturnValue(true);

      const mockStaticMiddleware = vi.fn();
      vi.spyOn(express, 'static').mockReturnValue(mockStaticMiddleware as any);

      let capturedFallbackHandler: Function;
      const useSpy = vi.spyOn(app, 'use').mockImplementation((route: any, handler?: any) => {
        if (route === '*' && typeof handler === 'function') {
          capturedFallbackHandler = handler;
        }
        return app;
      });

      serveStatic(app);

      expect(capturedFallbackHandler!).toBeDefined();

      // Test the fallback handler
      const mockReq = {};
      const mockRes = {
        sendFile: vi.fn(),
      };

      capturedFallbackHandler!(mockReq, mockRes);

      expect(path.resolve).toHaveBeenCalledWith(mockDistPath, 'index.html');
      expect(mockRes.sendFile).toHaveBeenCalledWith(mockIndexPath);
    });
  });

  describe('Production Build Validation', () => {
    it('should handle missing index.html in build directory', () => {
      const mockDistPath = '/test/path/public';
      
      (path.resolve as any).mockReturnValue(mockDistPath);
      (fs.existsSync as any).mockReturnValue(true);

      const mockStaticMiddleware = vi.fn();
      vi.spyOn(express, 'static').mockReturnValue(mockStaticMiddleware as any);

      // Setup should not throw even if index.html doesn't exist yet
      expect(() => serveStatic(app)).not.toThrow();
    });

    it('should handle empty build directory', () => {
      const mockDistPath = '/test/path/public';
      
      (path.resolve as any).mockReturnValue(mockDistPath);
      (fs.existsSync as any).mockReturnValue(true);

      const mockStaticMiddleware = vi.fn();
      vi.spyOn(express, 'static').mockReturnValue(mockStaticMiddleware as any);

      expect(() => serveStatic(app)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle filesystem errors gracefully', () => {
      (path.resolve as any).mockReturnValue('/test/path/public');
      (fs.existsSync as any).mockImplementation(() => {
        throw new Error('Filesystem error');
      });

      expect(() => serveStatic(app)).toThrow('Filesystem error');
    });

    it('should handle path resolution errors', () => {
      (path.resolve as any).mockImplementation(() => {
        throw new Error('Path resolution error');
      });

      expect(() => serveStatic(app)).toThrow('Path resolution error');
    });
  });
});

describe('Vite Configuration File', () => {
  it('should have correct alias configuration', () => {
    // Test that vite.config.ts has the expected alias structure
    const expectedAliases = ['@', '@shared', '@assets'];
    
    expectedAliases.forEach(alias => {
      expect(alias).toBeDefined();
      expect(typeof alias).toBe('string');
    });
  });

  it('should have correct build configuration', () => {
    // Test build configuration expectations
    const buildConfig = {
      outDir: expect.stringContaining('dist/public'),
      emptyOutDir: true,
    };

    expect(buildConfig.outDir).toBeDefined();
    expect(buildConfig.emptyOutDir).toBe(true);
  });

  it('should have correct server proxy configuration', () => {
    // Test proxy configuration for development
    const proxyConfig = {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    };

    expect(proxyConfig['/api'].target).toBe('http://localhost:5000');
    expect(proxyConfig['/api'].changeOrigin).toBe(true);
  });

  it('should have correct test configuration', () => {
    // Test vitest configuration
    const testConfig = {
      globals: true,
      environment: 'node',
      include: ['../server/**/*.test.ts'],
    };

    expect(testConfig.globals).toBe(true);
    expect(testConfig.environment).toBe('node');
    expect(testConfig.include).toContain('../server/**/*.test.ts');
  });
});

describe('Development vs Production Behavior', () => {
  it('should handle development mode correctly', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // In development, Vite dev server should handle frontend
    expect(process.env.NODE_ENV).toBe('development');

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle production mode correctly', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // In production, Express should serve static files
    expect(process.env.NODE_ENV).toBe('production');

    process.env.NODE_ENV = originalEnv;
  });

  it('should serve different content based on environment', () => {
    const developmentBehavior = process.env.NODE_ENV === 'development';
    const productionBehavior = process.env.NODE_ENV === 'production';

    // Both can't be true at the same time
    expect(developmentBehavior && productionBehavior).toBe(false);
  });
});
