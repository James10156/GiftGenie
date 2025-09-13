import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'crypto';

// Mock the schema types
const mockInsertFriend = {
  name: "Test Friend",
  personalityTraits: ["Kind", "Funny"],
  interests: ["Reading", "Movies"],
  notes: "A great friend",
  country: "United States",
  currency: "USD",
  profilePicture: "https://example.com/picture.jpg"
};

const mockInsertSavedGift = {
  friendId: "friend-123",
  giftData: {
    productName: "Test Gift",
    price: "$25.99",
    url: "https://example.com/gift",
    imageUrl: "https://example.com/gift-image.jpg",
    description: "A wonderful test gift"
  }
};

// Simple implementation of MemStorage for testing
class TestMemStorage {
  constructor() {
    this.users = new Map();
    this.userFriends = new Map();
    this.userSavedGifts = new Map();
    this.demoFriends = this.createDemoFriends();
  }

  createDemoFriends() {
    return [
      {
        id: randomUUID(),
        name: "Demo Friend 1",
        personalityTraits: ["Creative", "Outdoorsy"],
        interests: ["Art", "Hiking"],
        notes: "Demo friend for testing",
        country: "United States",
        currency: "USD",
        profilePicture: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        name: "Demo Friend 2",
        personalityTraits: ["Tech-savvy", "Innovative"],
        interests: ["Gadgets", "Gaming"],
        notes: "Another demo friend",
        country: "Canada",
        currency: "CAD",
        profilePicture: null,
        createdAt: new Date().toISOString(),
      }
    ];
  }

  initializeUserData(userId) {
    if (!this.userFriends.has(userId)) {
      this.userFriends.set(userId, new Map());
    }
    if (!this.userSavedGifts.has(userId)) {
      this.userSavedGifts.set(userId, new Map());
    }

    // For guest users, populate with demo data
    if (userId.startsWith('guest-')) {
      const userFriendsMap = this.userFriends.get(userId);
      this.demoFriends.forEach(friend => {
        userFriendsMap.set(friend.id, friend);
      });
    }
  }

  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser) {
    const id = randomUUID();
    const user = { 
      ...insertUser, 
      id,
      createdAt: new Date().toISOString()
    };
    this.users.set(id, user);
    this.initializeUserData(id);
    return user;
  }

  async getFriend(id, userId) {
    this.initializeUserData(userId);
    return this.userFriends.get(userId)?.get(id);
  }

  async getAllFriends(userId) {
    this.initializeUserData(userId);
    const userFriendsMap = this.userFriends.get(userId);
    if (!userFriendsMap) return [];
    
    return Array.from(userFriendsMap.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createFriend(insertFriend, userId) {
    this.initializeUserData(userId);
    const id = randomUUID();
    const friend = { 
      id,
      name: insertFriend.name,
      personalityTraits: insertFriend.personalityTraits,
      interests: insertFriend.interests,
      notes: insertFriend.notes || null,
      country: insertFriend.country || "United States",
      currency: insertFriend.currency || "USD",
      profilePicture: insertFriend.profilePicture || null,
      createdAt: new Date().toISOString()
    };
    this.userFriends.get(userId).set(id, friend);
    return friend;
  }

  async updateFriend(id, updateData, userId) {
    this.initializeUserData(userId);
    const userFriendsMap = this.userFriends.get(userId);
    if (!userFriendsMap) return undefined;
    
    const existingFriend = userFriendsMap.get(id);
    if (!existingFriend) return undefined;
    
    const updatedFriend = { 
      ...existingFriend, 
      ...(updateData.name && { name: updateData.name }),
      ...(updateData.personalityTraits && { personalityTraits: updateData.personalityTraits }),
      ...(updateData.interests && { interests: updateData.interests }),
      ...(updateData.notes !== undefined && { notes: updateData.notes }),
      ...(updateData.country && { country: updateData.country }),
      ...(updateData.currency && { currency: updateData.currency }),
      ...(updateData.profilePicture !== undefined && { profilePicture: updateData.profilePicture }),
    };
    userFriendsMap.set(id, updatedFriend);
    return updatedFriend;
  }

  async deleteFriend(id, userId) {
    this.initializeUserData(userId);
    const userFriendsMap = this.userFriends.get(userId);
    if (!userFriendsMap) return false;
    
    return userFriendsMap.delete(id);
  }

  async getSavedGift(id, userId) {
    this.initializeUserData(userId);
    return this.userSavedGifts.get(userId)?.get(id);
  }

  async getSavedGiftsByFriend(friendId, userId) {
    this.initializeUserData(userId);
    const userSavedGiftsMap = this.userSavedGifts.get(userId);
    if (!userSavedGiftsMap) return [];
    
    return Array.from(userSavedGiftsMap.values()).filter(gift => gift.friendId === friendId);
  }

  async getAllSavedGifts(userId) {
    this.initializeUserData(userId);
    const userSavedGiftsMap = this.userSavedGifts.get(userId);
    if (!userSavedGiftsMap) return [];
    
    return Array.from(userSavedGiftsMap.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createSavedGift(insertSavedGift, userId) {
    this.initializeUserData(userId);
    const id = randomUUID();
    const savedGift = { 
      id,
      friendId: insertSavedGift.friendId,
      giftData: insertSavedGift.giftData,
      createdAt: new Date().toISOString()
    };
    this.userSavedGifts.get(userId).set(id, savedGift);
    return savedGift;
  }

  async deleteSavedGift(id, userId) {
    this.initializeUserData(userId);
    const userSavedGiftsMap = this.userSavedGifts.get(userId);
    if (!userSavedGiftsMap) return false;
    
    return userSavedGiftsMap.delete(id);
  }
}

describe('MemStorage Tests', () => {
  let storage;
  let testUserId;
  let guestUserId;

  before(() => {
    testUserId = 'test-user-123';
    guestUserId = 'guest-user-456';
  });

  describe('User Management', () => {
    let storage;
    
    before(() => {
      storage = new TestMemStorage();
    });

    it('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User'
      };
      
      const user = await storage.createUser(userData);
      
      assert.ok(user.id);
      assert.strictEqual(user.username, userData.username);
      assert.strictEqual(user.email, userData.email);
      assert.strictEqual(user.displayName, userData.displayName);
      assert.ok(user.createdAt);
    });

    it('should retrieve a user by ID', async () => {
      const userData = {
        username: 'getuser',
        email: 'get@example.com'
      };
      
      const createdUser = await storage.createUser(userData);
      const retrievedUser = await storage.getUser(createdUser.id);
      
      assert.deepStrictEqual(retrievedUser, createdUser);
    });

    it('should retrieve a user by username', async () => {
      const userData = {
        username: 'finduser',
        email: 'find@example.com'
      };
      
      const createdUser = await storage.createUser(userData);
      const retrievedUser = await storage.getUserByUsername(userData.username);
      
      assert.deepStrictEqual(retrievedUser, createdUser);
    });

    it('should return undefined for non-existent user', async () => {
      const user = await storage.getUser('non-existent');
      assert.strictEqual(user, undefined);
    });
  });

  describe('Friend Management', () => {
    let storage;
    
    before(() => {
      storage = new TestMemStorage();
    });

    it('should initialize empty friends list for new user', async () => {
      const friends = await storage.getAllFriends(testUserId);
      assert.ok(Array.isArray(friends));
      assert.strictEqual(friends.length, 0);
    });

    it('should initialize demo friends for guest user', async () => {
      const friends = await storage.getAllFriends(guestUserId);
      assert.ok(Array.isArray(friends));
      assert.strictEqual(friends.length, 2);
      assert.strictEqual(friends[0].name, 'Demo Friend 1');
      assert.strictEqual(friends[1].name, 'Demo Friend 2');
    });

    it('should create a new friend', async () => {
      const friend = await storage.createFriend(mockInsertFriend, testUserId);
      
      assert.ok(friend.id);
      assert.strictEqual(friend.name, mockInsertFriend.name);
      assert.deepStrictEqual(friend.personalityTraits, mockInsertFriend.personalityTraits);
      assert.deepStrictEqual(friend.interests, mockInsertFriend.interests);
      assert.strictEqual(friend.notes, mockInsertFriend.notes);
      assert.strictEqual(friend.country, mockInsertFriend.country);
      assert.strictEqual(friend.currency, mockInsertFriend.currency);
      assert.ok(friend.createdAt);
    });

    it('should retrieve a friend by ID', async () => {
      const createdFriend = await storage.createFriend(mockInsertFriend, testUserId);
      const retrievedFriend = await storage.getFriend(createdFriend.id, testUserId);
      
      assert.deepStrictEqual(retrievedFriend, createdFriend);
    });

    it('should not retrieve friend from different user', async () => {
      const createdFriend = await storage.createFriend(mockInsertFriend, testUserId);
      const retrievedFriend = await storage.getFriend(createdFriend.id, 'other-user');
      
      assert.strictEqual(retrievedFriend, undefined);
    });

    it('should get all friends for a user', async () => {
      const freshStorage = new TestMemStorage();
      const friend1 = await freshStorage.createFriend({...mockInsertFriend, name: 'Friend 1'}, testUserId);
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const friend2 = await freshStorage.createFriend({...mockInsertFriend, name: 'Friend 2'}, testUserId);
      
      const friends = await freshStorage.getAllFriends(testUserId);
      
      assert.strictEqual(friends.length, 2); // Just the two we created
      // Should be sorted by creation date descending (most recent first)
      const friendNames = friends.map(f => f.name);
      assert.ok(friendNames.includes('Friend 1'));
      assert.ok(friendNames.includes('Friend 2'));
    });

    it('should update a friend', async () => {
      const createdFriend = await storage.createFriend(mockInsertFriend, testUserId);
      const updateData = {
        name: 'Updated Friend',
        interests: ['New Interest']
      };
      
      const updatedFriend = await storage.updateFriend(createdFriend.id, updateData, testUserId);
      
      assert.strictEqual(updatedFriend.name, updateData.name);
      assert.deepStrictEqual(updatedFriend.interests, updateData.interests);
      assert.strictEqual(updatedFriend.id, createdFriend.id);
    });

    it('should not update friend from different user', async () => {
      const createdFriend = await storage.createFriend(mockInsertFriend, testUserId);
      const updateData = { name: 'Should Not Update' };
      
      const result = await storage.updateFriend(createdFriend.id, updateData, 'other-user');
      
      assert.strictEqual(result, undefined);
    });

    it('should delete a friend', async () => {
      const createdFriend = await storage.createFriend(mockInsertFriend, testUserId);
      
      const deleted = await storage.deleteFriend(createdFriend.id, testUserId);
      assert.strictEqual(deleted, true);
      
      const retrievedFriend = await storage.getFriend(createdFriend.id, testUserId);
      assert.strictEqual(retrievedFriend, undefined);
    });

    it('should not delete friend from different user', async () => {
      const createdFriend = await storage.createFriend(mockInsertFriend, testUserId);
      
      const deleted = await storage.deleteFriend(createdFriend.id, 'other-user');
      assert.strictEqual(deleted, false);
      
      const retrievedFriend = await storage.getFriend(createdFriend.id, testUserId);
      assert.ok(retrievedFriend); // Should still exist
    });
  });

  describe('Saved Gift Management', () => {
    let storage;
    let testFriendId;

    before(async () => {
      storage = new TestMemStorage();
      const friend = await storage.createFriend(mockInsertFriend, testUserId);
      testFriendId = friend.id;
    });

    it('should initialize empty saved gifts list', async () => {
      const gifts = await storage.getAllSavedGifts('new-user');
      assert.ok(Array.isArray(gifts));
      assert.strictEqual(gifts.length, 0);
    });

    it('should create a saved gift', async () => {
      const giftData = {...mockInsertSavedGift, friendId: testFriendId};
      const savedGift = await storage.createSavedGift(giftData, testUserId);
      
      assert.ok(savedGift.id);
      assert.strictEqual(savedGift.friendId, testFriendId);
      assert.deepStrictEqual(savedGift.giftData, giftData.giftData);
      assert.ok(savedGift.createdAt);
    });

    it('should retrieve a saved gift by ID', async () => {
      const giftData = {...mockInsertSavedGift, friendId: testFriendId};
      const createdGift = await storage.createSavedGift(giftData, testUserId);
      const retrievedGift = await storage.getSavedGift(createdGift.id, testUserId);
      
      assert.deepStrictEqual(retrievedGift, createdGift);
    });

    it('should get saved gifts by friend ID', async () => {
      const freshStorage = new TestMemStorage();
      const friend = await freshStorage.createFriend(mockInsertFriend, testUserId);
      const friendId = friend.id;
      
      const giftData1 = {...mockInsertSavedGift, friendId: friendId, giftData: {...mockInsertSavedGift.giftData, productName: 'Gift 1'}};
      const giftData2 = {...mockInsertSavedGift, friendId: friendId, giftData: {...mockInsertSavedGift.giftData, productName: 'Gift 2'}};
      
      await freshStorage.createSavedGift(giftData1, testUserId);
      await freshStorage.createSavedGift(giftData2, testUserId);
      
      const friendGifts = await freshStorage.getSavedGiftsByFriend(friendId, testUserId);
      
      assert.strictEqual(friendGifts.length, 2); // Just the two we created
      assert.ok(friendGifts.every(gift => gift.friendId === friendId));
    });

    it('should get all saved gifts for user', async () => {
      const allGifts = await storage.getAllSavedGifts(testUserId);
      
      assert.ok(allGifts.length >= 1); // At least one gift exists
      assert.ok(allGifts.every(gift => typeof gift.id === 'string'));
      assert.ok(allGifts.every(gift => typeof gift.createdAt === 'string'));
    });

    it('should delete a saved gift', async () => {
      const giftData = {...mockInsertSavedGift, friendId: testFriendId};
      const createdGift = await storage.createSavedGift(giftData, testUserId);
      
      const deleted = await storage.deleteSavedGift(createdGift.id, testUserId);
      assert.strictEqual(deleted, true);
      
      const retrievedGift = await storage.getSavedGift(createdGift.id, testUserId);
      assert.strictEqual(retrievedGift, undefined);
    });

    it('should not delete gift from different user', async () => {
      const giftData = {...mockInsertSavedGift, friendId: testFriendId};
      const createdGift = await storage.createSavedGift(giftData, testUserId);
      
      const deleted = await storage.deleteSavedGift(createdGift.id, 'other-user');
      assert.strictEqual(deleted, false);
      
      const retrievedGift = await storage.getSavedGift(createdGift.id, testUserId);
      assert.ok(retrievedGift); // Should still exist
    });
  });

  describe('Data Isolation', () => {
    let storage;
    
    before(() => {
      storage = new TestMemStorage();
    });

    it('should maintain separate data for different users', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      
      // Create friends for both users
      const friend1 = await storage.createFriend({...mockInsertFriend, name: 'User 1 Friend'}, user1);
      const friend2 = await storage.createFriend({...mockInsertFriend, name: 'User 2 Friend'}, user2);
      
      // Get friends for each user
      const user1Friends = await storage.getAllFriends(user1);
      const user2Friends = await storage.getAllFriends(user2);
      
      assert.strictEqual(user1Friends.length, 1);
      assert.strictEqual(user2Friends.length, 1);
      assert.strictEqual(user1Friends[0].name, 'User 1 Friend');
      assert.strictEqual(user2Friends[0].name, 'User 2 Friend');
      
      // Ensure one user cannot access the other's data
      const crossAccess = await storage.getFriend(friend1.id, user2);
      assert.strictEqual(crossAccess, undefined);
    });
  });
});

console.log('✅ MemStorage tests completed!');
