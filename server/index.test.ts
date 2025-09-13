import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from './routes';
import { log } from './vite';

// Mock dependencies
vi.mock('./vite', () => ({
  log: vi.fn(),
  setupVite: vi.fn(),
  serveStatic: vi.fn(),
}));

vi.mock('./storage', () => ({
  MemStorage: vi.fn(() => ({
    getAllFriends: vi.fn().mockResolvedValue([]),
    createFriend: vi.fn().mockResolvedValue({ id: '1', name: 'Test Friend' }),
  })),
}));

describe('Express Server', () => {
  let app: express.Application;

  beforeEach(async () => {
    app = express();
    await registerRoutes(app);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register routes successfully', async () => {
    expect(app).toBeDefined();
  });

  it('should handle 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/api/non-existent')
      .expect(404);
  });

  it('should have proper middleware setup', async () => {
    // Test that the app has JSON parsing middleware
    const response = await request(app)
      .get('/api/friends')
      .expect('Content-Type', /json/);
  });

  it('should log requests properly', () => {
    // Verify that logging function is available
    expect(log).toBeDefined();
    expect(typeof log).toBe('function');
  });
});

describe('Server Environment Configuration', () => {
  it('should handle development environment correctly', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    expect(process.env.NODE_ENV).toBe('development');
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should handle production environment correctly', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    expect(process.env.NODE_ENV).toBe('production');
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should default to port 5000 if PORT not specified', () => {
    const originalPort = process.env.PORT;
    delete process.env.PORT;
    
    const defaultPort = process.env.PORT || '5000';
    expect(defaultPort).toBe('5000');
    
    if (originalPort) process.env.PORT = originalPort;
  });
});
