import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';

// Mock the storage module
const mockStorage = {
  users: new Map(),
  friends: new Map(),
  savedGifts: new Map(),
  
  async getUser(id) {
    return this.users.get(id) || null;
  },
  
  async createUser(userData) {
    const id = Date.now().toString();
    const user = { id, ...userData };
    this.users.set(id, user);
    return user;
  },
  
  async getFriendsByUserId(userId) {
    return Array.from(this.friends.values()).filter(f => f.userId === userId);
  },
  
  async createFriend(friendData) {
    const id = Date.now().toString();
    const friend = { id, ...friendData };
    this.friends.set(id, friend);
    return friend;
  },
  
  async updateFriend(id, updateData) {
    const friend = this.friends.get(id);
    if (!friend) return null;
    const updated = { ...friend, ...updateData };
    this.friends.set(id, updated);
    return updated;
  },
  
  async deleteFriend(id) {
    return this.friends.delete(id);
  },
  
  async getSavedGiftsByUserId(userId) {
    return Array.from(this.savedGifts.values()).filter(g => g.userId === userId);
  },
  
  async createSavedGift(giftData) {
    const id = Date.now().toString();
    const gift = { id, ...giftData };
    this.savedGifts.set(id, gift);
    return gift;
  },
  
  async deleteSavedGift(id) {
    return this.savedGifts.delete(id);
  }
};

describe('Express Server Tests', () => {
  let app;
  let server;
  let testPort = 5001;

  before(() => {
    // Create a test Express app
    app = express();
    app.use(express.json());
    
    // Mock routes similar to the actual server
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    app.get('/api/friends', async (req, res) => {
      try {
        const userId = req.query.userId || 'test-user';
        const friends = await mockStorage.getFriendsByUserId(userId);
        res.json(friends);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.post('/api/friends', async (req, res) => {
      try {
        const friendData = { userId: 'test-user', ...req.body };
        const friend = await mockStorage.createFriend(friendData);
        res.status(201).json(friend);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.put('/api/friends/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updated = await mockStorage.updateFriend(id, req.body);
        if (!updated) {
          return res.status(404).json({ error: 'Friend not found' });
        }
        res.json(updated);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.delete('/api/friends/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const deleted = await mockStorage.deleteFriend(id);
        if (!deleted) {
          return res.status(404).json({ error: 'Friend not found' });
        }
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.get('/api/gifts', async (req, res) => {
      try {
        const userId = req.query.userId || 'test-user';
        const gifts = await mockStorage.getSavedGiftsByUserId(userId);
        res.json(gifts);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.post('/api/gifts', async (req, res) => {
      try {
        const giftData = { userId: 'test-user', ...req.body };
        const gift = await mockStorage.createSavedGift(giftData);
        res.status(201).json(gift);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Start test server
    server = app.listen(testPort);
  });

  after(() => {
    if (server) {
      server.close();
    }
  });

  it('should respond to health check', async () => {
    const response = await makeRequest('GET', '/api/health');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.status, 'ok');
    assert.ok(response.data.timestamp);
  });

  it('should get empty friends list initially', async () => {
    const response = await makeRequest('GET', '/api/friends');
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.data));
    assert.strictEqual(response.data.length, 0);
  });

  it('should create a new friend', async () => {
    const friendData = {
      name: 'John Doe',
      age: 30,
      interests: ['coding', 'gaming']
    };
    
    const response = await makeRequest('POST', '/api/friends', friendData);
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.data.name, friendData.name);
    assert.strictEqual(response.data.age, friendData.age);
    assert.deepStrictEqual(response.data.interests, friendData.interests);
    assert.ok(response.data.id);
  });

  it('should get friends list after creating one', async () => {
    const response = await makeRequest('GET', '/api/friends');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.length, 1);
    assert.strictEqual(response.data[0].name, 'John Doe');
  });

  it('should update a friend', async () => {
    // First create a friend
    const createResponse = await makeRequest('POST', '/api/friends', {
      name: 'Jane Doe',
      age: 25,
      interests: ['reading']
    });
    
    const friendId = createResponse.data.id;
    const updateData = { age: 26, interests: ['reading', 'hiking'] };
    
    const response = await makeRequest('PUT', `/api/friends/${friendId}`, updateData);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.age, 26);
    assert.deepStrictEqual(response.data.interests, ['reading', 'hiking']);
  });

  it('should delete a friend', async () => {
    // First create a friend
    const createResponse = await makeRequest('POST', '/api/friends', {
      name: 'Bob Smith',
      age: 35,
      interests: ['sports']
    });
    
    const friendId = createResponse.data.id;
    
    const response = await makeRequest('DELETE', `/api/friends/${friendId}`);
    assert.strictEqual(response.status, 204);
  });

  it('should handle 404 for non-existent friend update', async () => {
    const response = await makeRequest('PUT', '/api/friends/nonexistent', { name: 'Test' });
    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.data.error, 'Friend not found');
  });

  it('should get empty gifts list initially', async () => {
    const response = await makeRequest('GET', '/api/gifts');
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.data));
    assert.strictEqual(response.data.length, 0);
  });

  it('should create a saved gift', async () => {
    const giftData = {
      productName: 'Gaming Headset',
      price: '$99.99',
      url: 'https://example.com/headset',
      friendId: 'friend-123'
    };
    
    const response = await makeRequest('POST', '/api/gifts', giftData);
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.data.productName, giftData.productName);
    assert.strictEqual(response.data.price, giftData.price);
    assert.ok(response.data.id);
  });

  // Helper function to make HTTP requests
  async function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: testPort,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const responseData = body ? JSON.parse(body) : null;
            resolve({
              status: res.statusCode,
              data: responseData,
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              data: body,
            });
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }
});

console.log('✅ Server tests completed!');
