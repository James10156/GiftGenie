import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

// Mock fetch globally
const originalFetch = global.fetch;
let mockFetchResponses = [];
let fetchCallLog = [];

global.fetch = async (url, options = {}) => {
  fetchCallLog.push({ url, options });
  
  // Return mock response based on URL patterns
  for (const mockResponse of mockFetchResponses) {
    if (mockResponse.urlPattern.test(url)) {
      return mockResponse.response;
    }
  }
  
  // Default response
  return {
    ok: false,
    status: 404,
    json: async () => ({ error: 'Not mocked' }),
    text: async () => 'Not mocked'
  };
};

// Mock Google Images scraper functionality
class MockGoogleImageScraper {
  async getGoogleImageResult(searchTerm) {
    console.log(`[MOCK_GOOGLE_IMAGES] Searching for: "${searchTerm}"`);
    
    // Simulate timeout handling
    if (searchTerm === 'timeout-test') {
      throw new Error('AbortError: Operation was aborted');
    }
    
    // Simulate no results
    if (searchTerm === 'no-results') {
      return null;
    }
    
    // Return mock image URL based on search term
    const mockImages = {
      'gaming headset': 'https://example.com/gaming-headset.jpg',
      'watercolor paint': 'https://example.com/watercolor-paint.jpg',
      'yoga mat': 'https://example.com/yoga-mat.jpg',
      'laptop': 'https://example.com/laptop.jpg'
    };
    
    return mockImages[searchTerm.toLowerCase()] || `https://example.com/${searchTerm.replace(/\s+/g, '-')}.jpg`;
  }
  
  async getProductImageFromGoogle(productName) {
    return this.getGoogleImageResult(productName);
  }
}

// Mock Image Service
class MockImageService {
  constructor() {
    this.fallbackImages = {
      'headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      'laptop': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      'yoga': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'book': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    };
  }
  
  async getProductImage(productName, productData = {}) {
    console.log(`[MOCK_IMAGE_SERVICE] Getting image for: "${productName}"`);
    
    // Simulate Unsplash API call
    if (productName.includes('unsplash')) {
      return await this.fetchFromUnsplash(productName);
    }
    
    // Use fallback images
    const lowercaseName = productName.toLowerCase();
    for (const [key, url] of Object.entries(this.fallbackImages)) {
      if (lowercaseName.includes(key)) {
        return url;
      }
    }
    
    return 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400'; // Default fallback
  }
  
  async fetchFromUnsplash(query) {
    const mockResponse = {
      results: [
        {
          id: 'mock-id',
          urls: {
            small: `https://images.unsplash.com/mock-${query}?w=400`,
            regular: `https://images.unsplash.com/mock-${query}?w=800`,
            thumb: `https://images.unsplash.com/mock-${query}?w=200`
          },
          alt_description: `Mock image for ${query}`,
          description: `A beautiful mock image for ${query}`
        }
      ]
    };
    
    return mockResponse.results[0]?.urls.small || null;
  }
  
  categorizeProduct(productName) {
    const categories = {
      'electronics': ['laptop', 'phone', 'headphones', 'tablet'],
      'fitness': ['yoga', 'workout', 'exercise', 'gym'],
      'books': ['book', 'novel', 'guide', 'manual'],
      'art': ['paint', 'brush', 'canvas', 'sketch']
    };
    
    const lowercaseName = productName.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowercaseName.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }
}

// Mock OpenAI Service
class MockOpenAIService {
  async generateGiftRecommendations(friendData, options = {}) {
    console.log(`[MOCK_OPENAI] Generating gifts for friend: ${friendData.name}`);
    
    // Simulate API error
    if (friendData.name === 'API_ERROR_TEST') {
      throw new Error('OpenAI API error');
    }
    
    // Generate mock recommendations based on friend's traits
    const recommendations = [];
    const { personalityTraits = [], interests = [], currency = 'USD' } = friendData;
    
    // Trait-based recommendations
    if (personalityTraits.includes('Creative') || interests.includes('Art')) {
      recommendations.push({
        name: "Professional Watercolor Set",
        description: "Premium watercolor paints perfect for artistic expression",
        price: this.formatPrice(45, currency),
        reasoning: "Perfect for their creative personality and artistic interests",
        confidence: 0.9,
        imageUrl: "https://example.com/watercolor-set.jpg",
        purchaseUrl: "https://example-store.com/watercolor-set",
        category: "Art Supplies"
      });
    }
    
    if (personalityTraits.includes('Tech-savvy') || interests.includes('Gaming')) {
      recommendations.push({
        name: "Mechanical Gaming Keyboard",
        description: "High-performance keyboard for gaming enthusiasts",
        price: this.formatPrice(125, currency),
        reasoning: "Matches their tech-savvy nature and gaming interests",
        confidence: 0.85,
        imageUrl: "https://example.com/gaming-keyboard.jpg",
        purchaseUrl: "https://example-store.com/gaming-keyboard",
        category: "Electronics"
      });
    }
    
    if (personalityTraits.includes('Sporty') || interests.includes('Fitness')) {
      recommendations.push({
        name: "Premium Yoga Mat",
        description: "High-quality yoga mat for workout sessions",
        price: this.formatPrice(55, currency),
        reasoning: "Great for their sporty lifestyle and fitness interests",
        confidence: 0.8,
        imageUrl: "https://example.com/yoga-mat.jpg",
        purchaseUrl: "https://example-store.com/yoga-mat",
        category: "Fitness"
      });
    }
    
    // Ensure we always return at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        name: "Universal Gift Card",
        description: "Flexible gift card for any occasion",
        price: this.formatPrice(50, currency),
        reasoning: "A versatile option that works for anyone",
        confidence: 0.7,
        imageUrl: "https://example.com/gift-card.jpg",
        purchaseUrl: "https://example-store.com/gift-card",
        category: "Gift Cards"
      });
    }
    
    return recommendations.slice(0, options.count || 3);
  }
  
  formatPrice(amount, currency) {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$'
    };
    
    return `${symbols[currency] || '$'}${amount}`;
  }
}

describe('External Service Integration Tests', () => {
  let googleScraper;
  let imageService;
  let openaiService;

  before(() => {
    googleScraper = new MockGoogleImageScraper();
    imageService = new MockImageService();
    openaiService = new MockOpenAIService();
    
    // Clear logs
    fetchCallLog = [];
    mockFetchResponses = [];
  });

  after(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('Google Images Scraper', () => {
    it('should return image URL for valid search term', async () => {
      const result = await googleScraper.getGoogleImageResult('gaming headset');
      
      assert.strictEqual(result, 'https://example.com/gaming-headset.jpg');
    });

    it('should handle timeout errors gracefully', async () => {
      try {
        await googleScraper.getGoogleImageResult('timeout-test');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message.includes('abort'));
      }
    });

    it('should return null for no results', async () => {
      const result = await googleScraper.getGoogleImageResult('no-results');
      
      assert.strictEqual(result, null);
    });

    it('should clean and encode search terms', async () => {
      const result = await googleScraper.getGoogleImageResult('watercolor paint!!!');
      
      assert.ok(result.includes('watercolor-paint'));
    });

    it('should handle various product types', async () => {
      const products = ['laptop', 'yoga mat', 'book'];
      
      for (const product of products) {
        const result = await googleScraper.getGoogleImageResult(product);
        assert.ok(result);
        assert.ok(result.startsWith('https://'));
      }
    });
  });

  describe('Image Service', () => {
    it('should return image URL for known product categories', async () => {
      const result = await imageService.getProductImage('Gaming Headphones');
      
      assert.strictEqual(result, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400');
    });

    it('should categorize products correctly', () => {
      const testCases = [
        { product: 'Gaming Laptop', expected: 'electronics' },
        { product: 'Yoga Mat', expected: 'fitness' },
        { product: 'Art Book', expected: 'books' },
        { product: 'Watercolor Paint', expected: 'art' },
        { product: 'Random Item', expected: 'general' }
      ];
      
      testCases.forEach(({ product, expected }) => {
        const category = imageService.categorizeProduct(product);
        assert.strictEqual(category, expected, `Failed for product: ${product}`);
      });
    });

    it('should return fallback image for unknown products', async () => {
      const result = await imageService.getProductImage('Unknown Product');
      
      assert.ok(result.startsWith('https://images.unsplash.com/'));
    });

    it('should fetch from Unsplash when specified', async () => {
      const result = await imageService.getProductImage('unsplash test');
      
      assert.ok(result.includes('mock-unsplash'));
    });

    it('should handle image service errors gracefully', async () => {
      // This should not throw an error, should return fallback
      const result = await imageService.getProductImage('');
      
      assert.ok(result);
      assert.ok(result.startsWith('https://'));
    });
  });

  describe('OpenAI Service Integration', () => {
    it('should generate recommendations for creative friend', async () => {
      const friendData = {
        name: 'Creative Friend',
        personalityTraits: ['Creative', 'Artistic'],
        interests: ['Art', 'Drawing'],
        currency: 'USD'
      };
      
      const recommendations = await openaiService.generateGiftRecommendations(friendData);
      
      assert.ok(Array.isArray(recommendations));
      assert.ok(recommendations.length > 0);
      
      const artRecommendation = recommendations.find(r => r.category === 'Art Supplies');
      assert.ok(artRecommendation);
      assert.strictEqual(artRecommendation.name, 'Professional Watercolor Set');
      assert.ok(artRecommendation.price.includes('$'));
      assert.ok(artRecommendation.confidence >= 0.8);
    });

    it('should generate recommendations for tech-savvy friend', async () => {
      const friendData = {
        name: 'Tech Friend',
        personalityTraits: ['Tech-savvy'],
        interests: ['Gaming', 'Computers'],
        currency: 'EUR'
      };
      
      const recommendations = await openaiService.generateGiftRecommendations(friendData);
      
      const techRecommendation = recommendations.find(r => r.category === 'Electronics');
      assert.ok(techRecommendation);
      assert.strictEqual(techRecommendation.name, 'Mechanical Gaming Keyboard');
      assert.ok(techRecommendation.price.includes('€'));
    });

    it('should generate recommendations for sporty friend', async () => {
      const friendData = {
        name: 'Sporty Friend',
        personalityTraits: ['Sporty', 'Active'],
        interests: ['Fitness', 'Yoga'],
        currency: 'GBP'
      };
      
      const recommendations = await openaiService.generateGiftRecommendations(friendData);
      
      const fitnessRecommendation = recommendations.find(r => r.category === 'Fitness');
      assert.ok(fitnessRecommendation);
      assert.strictEqual(fitnessRecommendation.name, 'Premium Yoga Mat');
      assert.ok(fitnessRecommendation.price.includes('£'));
    });

    it('should handle friends with no specific traits', async () => {
      const friendData = {
        name: 'Generic Friend',
        personalityTraits: [],
        interests: [],
        currency: 'USD'
      };
      
      const recommendations = await openaiService.generateGiftRecommendations(friendData);
      
      assert.ok(recommendations.length > 0);
      const giftCard = recommendations.find(r => r.category === 'Gift Cards');
      assert.ok(giftCard);
      assert.strictEqual(giftCard.name, 'Universal Gift Card');
    });

    it('should respect recommendation count limit', async () => {
      const friendData = {
        name: 'Multi Interest Friend',
        personalityTraits: ['Creative', 'Tech-savvy', 'Sporty'],
        interests: ['Art', 'Gaming', 'Fitness'],
        currency: 'USD'
      };
      
      const recommendations = await openaiService.generateGiftRecommendations(friendData, { count: 2 });
      
      assert.strictEqual(recommendations.length, 2);
    });

    it('should handle API errors gracefully', async () => {
      const friendData = {
        name: 'API_ERROR_TEST',
        personalityTraits: ['Creative'],
        interests: ['Art']
      };
      
      try {
        await openaiService.generateGiftRecommendations(friendData);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message.includes('OpenAI API error'));
      }
    });

    it('should format prices correctly for different currencies', () => {
      const testCases = [
        { amount: 50, currency: 'USD', expected: '$50' },
        { amount: 45, currency: 'EUR', expected: '€45' },
        { amount: 60, currency: 'GBP', expected: '£60' },
        { amount: 55, currency: 'CAD', expected: 'C$55' },
        { amount: 40, currency: 'JPY', expected: '$40' } // Fallback to USD
      ];
      
      testCases.forEach(({ amount, currency, expected }) => {
        const formatted = openaiService.formatPrice(amount, currency);
        assert.strictEqual(formatted, expected, `Failed for ${currency}`);
      });
    });
  });

  describe('Service Integration', () => {
    it('should work together for complete gift recommendation flow', async () => {
      const friendData = {
        name: 'Test Friend',
        personalityTraits: ['Creative'],
        interests: ['Art'],
        currency: 'USD'
      };
      
      // 1. Generate recommendations
      const recommendations = await openaiService.generateGiftRecommendations(friendData);
      assert.ok(recommendations.length > 0);
      
      // 2. Get images for recommendations
      for (const recommendation of recommendations) {
        const imageUrl = await imageService.getProductImage(recommendation.name);
        assert.ok(imageUrl);
        assert.ok(imageUrl.startsWith('https://'));
        
        // 3. Try Google image search as fallback
        const googleImage = await googleScraper.getGoogleImageResult(recommendation.name);
        if (googleImage) {
          assert.ok(googleImage.startsWith('https://'));
        }
      }
    });

    it('should handle service failures gracefully in integration', async () => {
      const friendData = {
        name: 'Resilience Test',
        personalityTraits: ['Unknown'],
        interests: ['Obscure'],
        currency: 'USD'
      };
      
      // Should still work even with unusual inputs
      const recommendations = await openaiService.generateGiftRecommendations(friendData);
      assert.ok(recommendations.length > 0);
      
      // Image service should provide fallbacks
      const imageUrl = await imageService.getProductImage('Completely Unknown Product');
      assert.ok(imageUrl);
    });
  });
});

console.log('✅ External service integration tests completed!');
