import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from './routes';
import type { Friend, User, SavedGift } from '@shared/schema';

// Mock dependencies
vi.mock('./storage', () => {
  const mockStorage = {
    getAllFriends: vi.fn(),
    getFriend: vi.fn(),
    createFriend: vi.fn(),
    updateFriend: vi.fn(),
    deleteFriend: vi.fn(),
    getAllSavedGifts: vi.fn(),
    getSavedGiftsByFriend: vi.fn(),
    createSavedGift: vi.fn(),
    deleteSavedGift: vi.fn(),
  };
  return { storage: mockStorage };
});

vi.mock('./services/openai', () => ({
  generateGiftRecommendations: vi.fn().mockResolvedValue([
    {
      name: 'Test Gift',
      description: 'A test gift recommendation',
      price: '$50 - $75',
      matchPercentage: 85,
      matchingTraits: ['thoughtful', 'creative'],
      image: 'https://example.com/test-gift.jpg',
      shops: [
        {
          name: 'Amazon',
          url: 'https://amazon.com/test-gift',
          price: '$60',
        },
      ],
    },
  ]),
}));

vi.mock('./auth-middleware', () => ({
  authenticateUser: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', username: 'testuser' };
    next();
  },
  authenticateUserOrGuest: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', username: 'testuser' };
    next();
  },
}));

vi.mock('./vite', () => ({
  log: vi.fn(),
  setupVite: vi.fn(),
  serveStatic: vi.fn(),
}));

describe('API Routes', () => {
  let app: express.Application;
  let server: any;
  const { storage } = await import('./storage');

  beforeEach(async () => {
    app = express();
    server = await registerRoutes(app);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        service: 'GiftGenie API',
      });
    });
  });

  describe('Debug Endpoints', () => {
    it('should return current user info', async () => {
      const response = await request(app)
        .get('/api/debug/user')
        .expect(200);

      expect(response.body).toEqual({
        user: { id: 'test-user-id', username: 'testuser' },
        timestamp: expect.any(String),
      });
    });
  });

  describe('Friends Endpoints', () => {
    const mockFriend: Friend = {
      id: 'friend-1',
      name: 'John Doe',
      personalityTraits: ['funny', 'creative'],
      interests: ['gaming', 'music'],
      budget: 100,
      currency: 'USD',
      country: 'United States',
      notes: 'Best friend',
      createdAt: new Date(),
      userId: 'test-user-id',
    };

    it('should get all friends', async () => {
      (storage.getAllFriends as any).mockResolvedValue([mockFriend]);

      const response = await request(app)
        .get('/api/friends')
        .expect(200);

      expect(response.body).toEqual([mockFriend]);
      expect(storage.getAllFriends).toHaveBeenCalledWith('test-user-id');
    });

    it('should handle error when getting all friends', async () => {
      (storage.getAllFriends as any).mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/api/friends')
        .expect(500);
    });

    it('should get a specific friend', async () => {
      (storage.getFriend as any).mockResolvedValue(mockFriend);

      const response = await request(app)
        .get('/api/friends/friend-1')
        .expect(200);

      expect(response.body).toEqual(mockFriend);
      expect(storage.getFriend).toHaveBeenCalledWith('friend-1', 'test-user-id');
    });

    it('should return 404 for non-existent friend', async () => {
      (storage.getFriend as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/friends/non-existent')
        .expect(404);

      expect(response.body).toEqual({ message: 'Friend not found' });
    });

    it('should create a new friend', async () => {
      const newFriendData = {
        name: 'Jane Smith',
        personalityTraits: ['thoughtful'],
        interests: ['reading'],
        budget: 75,
        currency: 'USD',
        country: 'United States',
      };

      (storage.createFriend as any).mockResolvedValue({ ...newFriendData, id: 'friend-2' });

      const response = await request(app)
        .post('/api/friends')
        .send(newFriendData)
        .expect(201);

      expect(response.body).toMatchObject(newFriendData);
      expect(storage.createFriend).toHaveBeenCalledWith(newFriendData, 'test-user-id');
    });

    it('should validate friend data when creating', async () => {
      const invalidFriendData = {
        name: '', // Invalid: empty name
        personalityTraits: [],
        interests: [],
        budget: -10, // Invalid: negative budget
      };

      const response = await request(app)
        .post('/api/friends')
        .send(invalidFriendData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid friend data');
      expect(response.body).toHaveProperty('errors');
    });

    it('should update a friend', async () => {
      const updateData = { name: 'Updated Name', budget: 150 };
      const updatedFriend = { ...mockFriend, ...updateData };

      (storage.updateFriend as any).mockResolvedValue(updatedFriend);

      const response = await request(app)
        .put('/api/friends/friend-1')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject(updateData);
      expect(storage.updateFriend).toHaveBeenCalledWith('friend-1', updateData, 'test-user-id');
    });

    it('should return 404 when updating non-existent friend', async () => {
      (storage.updateFriend as any).mockResolvedValue(null);

      await request(app)
        .put('/api/friends/non-existent')
        .send({ name: 'Updated Name' })
        .expect(404);
    });

    it('should delete a friend', async () => {
      (storage.deleteFriend as any).mockResolvedValue(true);

      await request(app)
        .delete('/api/friends/friend-1')
        .expect(204);

      expect(storage.deleteFriend).toHaveBeenCalledWith('friend-1', 'test-user-id');
    });

    it('should return 404 when deleting non-existent friend', async () => {
      (storage.deleteFriend as any).mockResolvedValue(false);

      await request(app)
        .delete('/api/friends/non-existent')
        .expect(404);
    });
  });

  describe('Gift Recommendations Endpoint', () => {
    const mockFriend: Friend = {
      id: 'friend-1',
      name: 'John Doe',
      personalityTraits: ['funny', 'creative'],
      interests: ['gaming', 'music'],
      budget: 100,
      currency: 'USD',
      country: 'United States',
      notes: 'Gaming enthusiast',
      createdAt: new Date(),
      userId: 'test-user-id',
    };

    it('should generate gift recommendations', async () => {
      (storage.getFriend as any).mockResolvedValue(mockFriend);

      const response = await request(app)
        .post('/api/gift-recommendations')
        .send({ friendId: 'friend-1', budget: 100 })
        .expect(200);

      expect(response.body).toEqual([
        {
          name: 'Test Gift',
          description: 'A test gift recommendation',
          price: '$50 - $75',
          matchPercentage: 85,
          matchingTraits: ['thoughtful', 'creative'],
          image: 'https://example.com/test-gift.jpg',
          shops: [
            {
              name: 'Amazon',
              url: 'https://amazon.com/test-gift',
              price: '$60',
            },
          ],
        },
      ]);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/gift-recommendations')
        .send({ friendId: 'friend-1' }) // Missing budget
        .expect(400);

      expect(response.body).toEqual({
        message: 'Friend ID and budget are required',
      });
    });

    it('should return 404 for non-existent friend', async () => {
      (storage.getFriend as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/gift-recommendations')
        .send({ friendId: 'non-existent', budget: 100 })
        .expect(404);

      expect(response.body).toEqual({ message: 'Friend not found' });
    });

    it('should handle OpenAI service errors', async () => {
      (storage.getFriend as any).mockResolvedValue(mockFriend);
      const { generateGiftRecommendations } = await import('./services/openai');
      (generateGiftRecommendations as any).mockRejectedValue(new Error('OpenAI API error'));

      const response = await request(app)
        .post('/api/gift-recommendations')
        .send({ friendId: 'friend-1', budget: 100 })
        .expect(500);

      expect(response.body).toEqual({
        message: 'OpenAI API error',
      });
    });
  });

  describe('Saved Gifts Endpoints', () => {
    const mockSavedGift: SavedGift = {
      id: 'gift-1',
      friendId: 'friend-1',
      name: 'Gaming Headset',
      description: 'High-quality gaming headset',
      price: '$80',
      image: 'https://example.com/headset.jpg',
      matchingTraits: ['gaming', 'tech-savvy'],
      shops: [
        {
          name: 'Best Buy',
          url: 'https://bestbuy.com/headset',
          price: '$80',
        },
      ],
      createdAt: new Date(),
      userId: 'test-user-id',
    };

    it('should get all saved gifts', async () => {
      (storage.getAllSavedGifts as any).mockResolvedValue([mockSavedGift]);

      const response = await request(app)
        .get('/api/saved-gifts')
        .expect(200);

      expect(response.body).toEqual([mockSavedGift]);
      expect(storage.getAllSavedGifts).toHaveBeenCalledWith('test-user-id');
    });

    it('should get saved gifts by friend', async () => {
      (storage.getSavedGiftsByFriend as any).mockResolvedValue([mockSavedGift]);

      const response = await request(app)
        .get('/api/saved-gifts/friend/friend-1')
        .expect(200);

      expect(response.body).toEqual([mockSavedGift]);
      expect(storage.getSavedGiftsByFriend).toHaveBeenCalledWith('friend-1', 'test-user-id');
    });

    it('should create a saved gift', async () => {
      const newSavedGiftData = {
        friendId: 'friend-1',
        name: 'Board Game',
        description: 'Fun strategy board game',
        price: '$45',
        image: 'https://example.com/boardgame.jpg',
        matchingTraits: ['strategic', 'social'],
        shops: [
          {
            name: 'Target',
            url: 'https://target.com/boardgame',
            price: '$45',
          },
        ],
      };

      (storage.createSavedGift as any).mockResolvedValue({
        ...newSavedGiftData,
        id: 'gift-2',
      });

      const response = await request(app)
        .post('/api/saved-gifts')
        .send(newSavedGiftData)
        .expect(201);

      expect(response.body).toMatchObject(newSavedGiftData);
      expect(storage.createSavedGift).toHaveBeenCalledWith(newSavedGiftData, 'test-user-id');
    });

    it('should validate saved gift data', async () => {
      const invalidGiftData = {
        friendId: '', // Invalid: empty friendId
        name: '',     // Invalid: empty name
        shops: 'invalid', // Invalid: should be array
      };

      const response = await request(app)
        .post('/api/saved-gifts')
        .send(invalidGiftData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid saved gift data');
      expect(response.body).toHaveProperty('errors');
    });

    it('should delete a saved gift', async () => {
      (storage.deleteSavedGift as any).mockResolvedValue(true);

      await request(app)
        .delete('/api/saved-gifts/gift-1')
        .expect(204);

      expect(storage.deleteSavedGift).toHaveBeenCalledWith('gift-1', 'test-user-id');
    });

    it('should return 404 when deleting non-existent saved gift', async () => {
      (storage.deleteSavedGift as any).mockResolvedValue(false);

      await request(app)
        .delete('/api/saved-gifts/non-existent')
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      (storage.getAllFriends as any).mockRejectedValue(new Error('Database connection failed'));

      await request(app)
        .get('/api/friends')
        .expect(500);
    });

    it('should handle malformed JSON requests', async () => {
      await request(app)
        .post('/api/friends')
        .send('invalid json')
        .type('application/json')
        .expect(400);
    });

    it('should handle requests to non-existent endpoints', async () => {
      await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);
    });
  });

  describe('Authentication Integration', () => {
    it('should include user context in authenticated routes', async () => {
      (storage.getAllFriends as any).mockResolvedValue([]);

      await request(app)
        .get('/api/friends')
        .expect(200);

      // Verify that the user ID was passed to storage methods
      expect(storage.getAllFriends).toHaveBeenCalledWith('test-user-id');
    });
  });
});
