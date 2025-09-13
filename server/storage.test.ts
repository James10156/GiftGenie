import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from './storage';
import type { InsertFriend, InsertUser, InsertSavedGift } from '@shared/schema';

describe('MemStorage', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('User operations', () => {
    it('should create a user', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword',
      };

      const user = await storage.createUser(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.password).toBe('hashedpassword');
    });

    it('should get a user by id', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword',
      };

      const createdUser = await storage.createUser(userData);
      const retrievedUser = await storage.getUser(createdUser.id);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.username).toBe('testuser');
    });

    it('should get a user by username', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        password: 'hashedpassword',
      };

      await storage.createUser(userData);
      const retrievedUser = await storage.getUserByUsername('testuser');

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.username).toBe('testuser');
    });

    it('should return undefined for non-existent user', async () => {
      const user = await storage.getUser('non-existent-id');
      expect(user).toBeUndefined();
    });
  });

  describe('Friend operations', () => {
    it('should create a friend', async () => {
      const friendData: InsertFriend = {
        name: 'John Doe',
        personalityTraits: ['funny', 'creative'],
        interests: ['gaming', 'music'],
        budget: 100,
        notes: 'Best friend from college',
        currency: 'USD',
        country: 'United States',
      };

      const friend = await storage.createFriend(friendData);

      expect(friend).toBeDefined();
      expect(friend.id).toBeDefined();
      expect(friend.name).toBe('John Doe');
      expect(friend.personalityTraits).toEqual(['funny', 'creative']);
      expect(friend.interests).toEqual(['gaming', 'music']);
      expect(friend.budget).toBe(100);
      expect(friend.createdAt).toBeDefined();
    });

    it('should get a friend by id', async () => {
      const friendData: InsertFriend = {
        name: 'Jane Smith',
        personalityTraits: ['thoughtful'],
        interests: ['reading'],
        budget: 50,
        currency: 'USD',
        country: 'United States',
      };

      const createdFriend = await storage.createFriend(friendData);
      const retrievedFriend = await storage.getFriend(createdFriend.id);

      expect(retrievedFriend).toBeDefined();
      expect(retrievedFriend?.id).toBe(createdFriend.id);
      expect(retrievedFriend?.name).toBe('Jane Smith');
    });

    it('should get all friends sorted by creation date', async () => {
      const friend1Data: InsertFriend = {
        name: 'Friend 1',
        personalityTraits: ['funny'],
        interests: ['sports'],
        budget: 75,
        currency: 'USD',
        country: 'United States',
      };

      const friend2Data: InsertFriend = {
        name: 'Friend 2',
        personalityTraits: ['creative'],
        interests: ['art'],
        budget: 120,
        currency: 'USD',
        country: 'United States',
      };

      // Create friends with a small delay to ensure different timestamps
      const friend1 = await storage.createFriend(friend1Data);
      await new Promise(resolve => setTimeout(resolve, 10));
      const friend2 = await storage.createFriend(friend2Data);

      const allFriends = await storage.getAllFriends();

      expect(allFriends).toHaveLength(2);
      expect(allFriends[0].name).toBe('Friend 2'); // Most recent first
      expect(allFriends[1].name).toBe('Friend 1');
    });

    it('should update a friend', async () => {
      const friendData: InsertFriend = {
        name: 'Original Name',
        personalityTraits: ['funny'],
        interests: ['gaming'],
        budget: 100,
        currency: 'USD',
        country: 'United States',
      };

      const createdFriend = await storage.createFriend(friendData);
      const updateData: Partial<InsertFriend> = {
        name: 'Updated Name',
        budget: 150,
      };

      const updatedFriend = await storage.updateFriend(createdFriend.id, updateData);

      expect(updatedFriend).toBeDefined();
      expect(updatedFriend?.name).toBe('Updated Name');
      expect(updatedFriend?.budget).toBe(150);
      expect(updatedFriend?.personalityTraits).toEqual(['funny']); // Unchanged
    });

    it('should delete a friend', async () => {
      const friendData: InsertFriend = {
        name: 'To Be Deleted',
        personalityTraits: ['funny'],
        interests: ['gaming'],
        budget: 100,
        currency: 'USD',
        country: 'United States',
      };

      const createdFriend = await storage.createFriend(friendData);
      const deleteResult = await storage.deleteFriend(createdFriend.id);

      expect(deleteResult).toBe(true);

      const retrievedFriend = await storage.getFriend(createdFriend.id);
      expect(retrievedFriend).toBeUndefined();
    });

    it('should return false when deleting non-existent friend', async () => {
      const deleteResult = await storage.deleteFriend('non-existent-id');
      expect(deleteResult).toBe(false);
    });
  });

  describe('SavedGift operations', () => {
    let friendId: string;

    beforeEach(async () => {
      const friendData: InsertFriend = {
        name: 'Test Friend',
        personalityTraits: ['funny'],
        interests: ['gaming'],
        budget: 100,
        currency: 'USD',
        country: 'United States',
      };
      const friend = await storage.createFriend(friendData);
      friendId = friend.id;
    });

    it('should create a saved gift', async () => {
      const giftData: InsertSavedGift = {
        friendId,
        name: 'Gaming Headset',
        description: 'High-quality gaming headset',
        price: '$80',
        image: 'https://example.com/headset.jpg',
        matchingTraits: ['gaming', 'tech-savvy'],
        shops: [
          {
            name: 'Amazon',
            url: 'https://amazon.com/headset',
            price: '$80',
          },
        ],
      };

      const savedGift = await storage.createSavedGift(giftData);

      expect(savedGift).toBeDefined();
      expect(savedGift.id).toBeDefined();
      expect(savedGift.friendId).toBe(friendId);
      expect(savedGift.name).toBe('Gaming Headset');
      expect(savedGift.shops).toHaveLength(1);
      expect(savedGift.createdAt).toBeDefined();
    });

    it('should get a saved gift by id', async () => {
      const giftData: InsertSavedGift = {
        friendId,
        name: 'Test Gift',
        description: 'Test description',
        price: '$50',
        image: 'https://example.com/gift.jpg',
        matchingTraits: ['thoughtful'],
        shops: [],
      };

      const createdGift = await storage.createSavedGift(giftData);
      const retrievedGift = await storage.getSavedGift(createdGift.id);

      expect(retrievedGift).toBeDefined();
      expect(retrievedGift?.id).toBe(createdGift.id);
      expect(retrievedGift?.name).toBe('Test Gift');
    });

    it('should get saved gifts by friend id', async () => {
      const gift1Data: InsertSavedGift = {
        friendId,
        name: 'Gift 1',
        description: 'First gift',
        price: '$25',
        image: 'https://example.com/gift1.jpg',
        matchingTraits: ['thoughtful'],
        shops: [],
      };

      const gift2Data: InsertSavedGift = {
        friendId,
        name: 'Gift 2',
        description: 'Second gift',
        price: '$75',
        image: 'https://example.com/gift2.jpg',
        matchingTraits: ['creative'],
        shops: [],
      };

      await storage.createSavedGift(gift1Data);
      await storage.createSavedGift(gift2Data);

      const friendGifts = await storage.getSavedGiftsByFriend(friendId);

      expect(friendGifts).toHaveLength(2);
      expect(friendGifts.map(g => g.name)).toContain('Gift 1');
      expect(friendGifts.map(g => g.name)).toContain('Gift 2');
    });

    it('should get all saved gifts', async () => {
      const giftData: InsertSavedGift = {
        friendId,
        name: 'All Gifts Test',
        description: 'Test gift for all gifts',
        price: '$30',
        image: 'https://example.com/allgifts.jpg',
        matchingTraits: ['funny'],
        shops: [],
      };

      await storage.createSavedGift(giftData);

      const allGifts = await storage.getAllSavedGifts();

      expect(allGifts.length).toBeGreaterThan(0);
      expect(allGifts.some(g => g.name === 'All Gifts Test')).toBe(true);
    });

    it('should delete a saved gift', async () => {
      const giftData: InsertSavedGift = {
        friendId,
        name: 'To Be Deleted Gift',
        description: 'This gift will be deleted',
        price: '$40',
        image: 'https://example.com/delete.jpg',
        matchingTraits: ['temporary'],
        shops: [],
      };

      const createdGift = await storage.createSavedGift(giftData);
      const deleteResult = await storage.deleteSavedGift(createdGift.id);

      expect(deleteResult).toBe(true);

      const retrievedGift = await storage.getSavedGift(createdGift.id);
      expect(retrievedGift).toBeUndefined();
    });

    it('should return false when deleting non-existent saved gift', async () => {
      const deleteResult = await storage.deleteSavedGift('non-existent-id');
      expect(deleteResult).toBe(false);
    });
  });
});
