import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageAdapter } from './storage-adapter';
import type { InsertFriend, InsertSavedGift } from '../shared/schema';

// Mock the database storage to force guest isolation testing
vi.mock('./db', () => ({
  DatabaseStorage: vi.fn().mockImplementation(() => ({
    // Mock database methods that won't be called for guest users
    getFriendForUser: vi.fn(),
    getAllFriendsForUser: vi.fn(),
    createFriendForUser: vi.fn(),
  }))
}));

vi.mock('./storage', () => ({
  MemStorage: vi.fn().mockImplementation(() => ({
    // Mock memory storage methods that won't be called for guest users
    getFriend: vi.fn(),
    getAllFriends: vi.fn(),
    createFriend: vi.fn(),
  }))
}));

describe('StorageAdapter - Guest User Isolation', () => {
  let storageAdapter: StorageAdapter;

  beforeEach(() => {
    storageAdapter = new StorageAdapter();
  });

  describe('Guest session identification', () => {
    it('should identify guest users correctly', () => {
      // Access private method for testing
      const isGuestUser = (storageAdapter as any).isGuestUser;
      
      expect(isGuestUser('guest_1234567890_abc123')).toBe(true);
      expect(isGuestUser('guest_9876543210_xyz789')).toBe(true);
      expect(isGuestUser('user-uuid-12345')).toBe(false);
      expect(isGuestUser('admin-uuid-67890')).toBe(false);
      expect(isGuestUser(undefined)).toBe(false);
      expect(isGuestUser(null)).toBe(false);
    });

    it('should create isolated guest storage on first access', async () => {
      const guestId = 'guest_1234567890_test';
      
      // Test by creating a friend and verifying isolation works
      const friend1 = await storageAdapter.createFriend({
        name: 'Test Friend',
        personalityTraits: ['Test'],
        interests: ['Testing'],
      }, guestId);
      
      const friends = await storageAdapter.getAllFriends(guestId);
      
      expect(friends).toHaveLength(1);
      expect(friends[0].id).toBe(friend1.id);
      expect(friends[0].name).toBe('Test Friend');
    });
  });

  describe('Friend operations isolation', () => {
    const guest1Id = 'guest_1111111111_aaa';
    const guest2Id = 'guest_2222222222_bbb';
    
    const friend1Data: InsertFriend = {
      name: 'Guest 1 Friend',
      personalityTraits: ['Creative'],
      interests: ['Reading'],
      currency: 'USD',
      country: 'United States'
    };
    
    const friend2Data: InsertFriend = {
      name: 'Guest 2 Friend', 
      personalityTraits: ['Sporty'],
      interests: ['Running'],
      currency: 'EUR',
      country: 'Germany'
    };

    it('should create friends in isolated guest storage', async () => {
      const friend1 = await storageAdapter.createFriend(friend1Data, guest1Id);
      const friend2 = await storageAdapter.createFriend(friend2Data, guest2Id);

      expect(friend1.name).toBe('Guest 1 Friend');
      expect(friend2.name).toBe('Guest 2 Friend');
      expect(friend1.id).not.toBe(friend2.id);
      expect(friend1.userId).toBe(guest1Id);
      expect(friend2.userId).toBe(guest2Id);
    });

    it('should retrieve only own friends for each guest', async () => {
      await storageAdapter.createFriend(friend1Data, guest1Id);
      await storageAdapter.createFriend(friend2Data, guest2Id);

      const guest1Friends = await storageAdapter.getAllFriends(guest1Id);
      const guest2Friends = await storageAdapter.getAllFriends(guest2Id);

      expect(guest1Friends).toHaveLength(1);
      expect(guest2Friends).toHaveLength(1);
      expect(guest1Friends[0].name).toBe('Guest 1 Friend');
      expect(guest2Friends[0].name).toBe('Guest 2 Friend');
    });

    it('should prevent cross-access to other guest friends', async () => {
      const friend1 = await storageAdapter.createFriend(friend1Data, guest1Id);
      await storageAdapter.createFriend(friend2Data, guest2Id);

      // Guest 2 tries to access Guest 1's friend
      const crossAccessAttempt = await storageAdapter.getFriend(friend1.id, guest2Id);
      
      expect(crossAccessAttempt).toBeUndefined();
    });

    it('should update only own friends', async () => {
      const friend1 = await storageAdapter.createFriend(friend1Data, guest1Id);
      const friend2 = await storageAdapter.createFriend(friend2Data, guest2Id);

      // Guest 1 updates their friend
      const updatedFriend1 = await storageAdapter.updateFriend(
        friend1.id, 
        { name: 'Updated Friend 1' }, 
        guest1Id
      );

      // Guest 2 tries to update Guest 1's friend (should fail)
      const failedUpdate = await storageAdapter.updateFriend(
        friend1.id,
        { name: 'Hacked Name' },
        guest2Id
      );

      expect(updatedFriend1?.name).toBe('Updated Friend 1');
      expect(failedUpdate).toBeUndefined();
    });

    it('should delete only own friends', async () => {
      const friend1 = await storageAdapter.createFriend(friend1Data, guest1Id);
      const friend2 = await storageAdapter.createFriend(friend2Data, guest2Id);

      // Guest 2 tries to delete Guest 1's friend (should fail)
      const crossDeleteAttempt = await storageAdapter.deleteFriend(friend1.id, guest2Id);
      
      // Guest 1 deletes their own friend (should succeed)
      const ownDeleteAttempt = await storageAdapter.deleteFriend(friend1.id, guest1Id);

      expect(crossDeleteAttempt).toBe(false);
      expect(ownDeleteAttempt).toBe(true);

      // Verify friend is deleted for guest 1 but guest 2's friend remains
      const guest1Friends = await storageAdapter.getAllFriends(guest1Id);
      const guest2Friends = await storageAdapter.getAllFriends(guest2Id);

      expect(guest1Friends).toHaveLength(0);
      expect(guest2Friends).toHaveLength(1);
    });
  });

  describe('Saved gifts isolation', () => {
    const guest1Id = 'guest_1111111111_aaa';
    const guest2Id = 'guest_2222222222_bbb';

    it('should create saved gifts in isolated guest storage', async () => {
      // Create friends first
      const friend1 = await storageAdapter.createFriend({
        name: 'Friend 1',
        personalityTraits: ['Creative'],
        interests: ['Art'],
      }, guest1Id);

      const friend2 = await storageAdapter.createFriend({
        name: 'Friend 2', 
        personalityTraits: ['Sporty'],
        interests: ['Sports'],
      }, guest2Id);

      const savedGift1Data: InsertSavedGift = {
        friendId: friend1.id,
        giftData: {
          name: 'Art Supplies',
          description: 'Creative gift',
          price: '$30',
          matchPercentage: 85,
          image: 'test.jpg',
          shops: []
        }
      };

      const savedGift2Data: InsertSavedGift = {
        friendId: friend2.id,
        giftData: {
          name: 'Sports Equipment',
          description: 'Athletic gift', 
          price: '$50',
          matchPercentage: 90,
          image: 'test2.jpg',
          shops: []
        }
      };

      const savedGift1 = await storageAdapter.createSavedGift(savedGift1Data, guest1Id);
      const savedGift2 = await storageAdapter.createSavedGift(savedGift2Data, guest2Id);

      expect(savedGift1.giftData.name).toBe('Art Supplies');
      expect(savedGift2.giftData.name).toBe('Sports Equipment');
      expect(savedGift1.userId).toBe(guest1Id);
      expect(savedGift2.userId).toBe(guest2Id);
    });

    it('should retrieve only own saved gifts for each guest', async () => {
      // Create friends and saved gifts for each guest
      const friend1 = await storageAdapter.createFriend({
        name: 'Friend 1',
        personalityTraits: ['Creative'],
        interests: ['Art'],
      }, guest1Id);

      const friend2 = await storageAdapter.createFriend({
        name: 'Friend 2',
        personalityTraits: ['Sporty'], 
        interests: ['Sports'],
      }, guest2Id);

      await storageAdapter.createSavedGift({
        friendId: friend1.id,
        giftData: {
          name: 'Gift 1',
          description: 'Test',
          price: '$30',
          matchPercentage: 85,
          image: 'test.jpg',
          shops: []
        }
      }, guest1Id);

      await storageAdapter.createSavedGift({
        friendId: friend2.id,
        giftData: {
          name: 'Gift 2',
          description: 'Test',
          price: '$50', 
          matchPercentage: 90,
          image: 'test2.jpg',
          shops: []
        }
      }, guest2Id);

      const guest1SavedGifts = await storageAdapter.getAllSavedGifts(guest1Id);
      const guest2SavedGifts = await storageAdapter.getAllSavedGifts(guest2Id);

      expect(guest1SavedGifts).toHaveLength(1);
      expect(guest2SavedGifts).toHaveLength(1);
      expect(guest1SavedGifts[0].giftData.name).toBe('Gift 1');
      expect(guest2SavedGifts[0].giftData.name).toBe('Gift 2');
    });

    it('should prevent cross-access to other guest saved gifts', async () => {
      // Create friends and saved gifts
      const friend1 = await storageAdapter.createFriend({
        name: 'Friend 1',
        personalityTraits: ['Creative'],
        interests: ['Art'],
      }, guest1Id);

      const savedGift1 = await storageAdapter.createSavedGift({
        friendId: friend1.id,
        giftData: {
          name: 'Private Gift',
          description: 'Should not be accessible',
          price: '$100',
          matchPercentage: 95,
          image: 'private.jpg',
          shops: []
        }
      }, guest1Id);

      // Guest 2 tries to access Guest 1's saved gift
      const crossAccessAttempt = await storageAdapter.getSavedGift(savedGift1.id, guest2Id);
      
      expect(crossAccessAttempt).toBeUndefined();
    });
  });

  describe('Memory management', () => {
    it('should handle multiple guest sessions efficiently', async () => {
      const guestIds = Array.from({ length: 10 }, (_, i) => `guest_test_${i}`);
      
      // Create data for multiple guests
      for (const guestId of guestIds) {
        await storageAdapter.createFriend({
          name: `Friend ${guestId}`,
          personalityTraits: ['Test'],
          interests: ['Testing'],
        }, guestId);
      }

      // Verify each guest has their own isolated data
      for (const guestId of guestIds) {
        const friends = await storageAdapter.getAllFriends(guestId);
        expect(friends).toHaveLength(1);
        expect(friends[0].name).toBe(`Friend ${guestId}`);
      }
    });

    it('should maintain session data consistency within same guest', async () => {
      const guestId = 'guest_consistency_test';
      
      // Create multiple friends for same guest
      await storageAdapter.createFriend({
        name: 'Friend 1',
        personalityTraits: ['A'],
        interests: ['X'],
      }, guestId);

      await storageAdapter.createFriend({
        name: 'Friend 2', 
        personalityTraits: ['B'],
        interests: ['Y'],
      }, guestId);

      const friends = await storageAdapter.getAllFriends(guestId);
      expect(friends).toHaveLength(2);
      expect(friends.map(f => f.name).sort()).toEqual(['Friend 1', 'Friend 2']);
    });
  });
});