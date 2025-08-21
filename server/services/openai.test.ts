import { describe, it, expect, vi } from 'vitest';
import { generateGiftRecommendations } from './openai';
import { PRODUCT_DATABASE } from './productDatabase';

// Mock the entire imageService to avoid actual API calls
vi.mock('./imageService', () => ({
  getProductImage: vi.fn().mockResolvedValue('https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'),
}));

// Mock OpenAI
vi.mock('openai', () => {
    const mockCompletions = {
      create: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                recommendations: [
                  {
                    name: 'Nintendo Switch OLED Model',
                    description: 'A great gaming console.',
                    price: '£300 - £350',
                    matchPercentage: 95,
                    matchingTraits: ['Tech-savvy', 'Gaming'],
                    imageSearchTerm: 'Nintendo Switch OLED',
                    shopSearchTerm: 'Nintendo Switch OLED Model',
                  },
                  {
                    name: 'A book you have never heard of',
                    description: 'A book that is not in our database.',
                    price: '£10 - £15',
                    matchPercentage: 80,
                    matchingTraits: ['Creative'],
                    imageSearchTerm: 'fantasy book',
                    shopSearchTerm: 'fantasy book',
                  },
                ],
              }),
            },
          },
        ],
      }),
    };
  
    return {
      __esModule: true,
      default: vi.fn(() => ({
        chat: {
          completions: mockCompletions,
        },
      })),
    };
  });

describe('generateGiftRecommendations', () => {
  it('should use the specific product image from the database when a product is found', async () => {
    const recommendations = await generateGiftRecommendations(
      ['Tech-savvy', 'Gaming'],
      ['Video Games'],
      500,
      'James',
      'GBP',
      'UK'
    );

    const nintendoRec = recommendations.find(rec => rec.name.includes('Nintendo Switch'));
    expect(nintendoRec).toBeDefined();
    expect(nintendoRec?.image).toBe(PRODUCT_DATABASE['nintendo switch'].image);
  });

  it('should fall back to the image service when a product is not in the database', async () => {
    const recommendations = await generateGiftRecommendations(
        ['Creative'],
        ['Reading'],
        50,
        'Sarah',
        'GBP',
        'UK'
      );
  
      const bookRec = recommendations.find(rec => rec.name.includes('A book you have never heard of'));
      expect(bookRec).toBeDefined();
      // This should be the mocked URL from getProductImage
      expect(bookRec?.image).toBe('https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300');
  });

  it('should return valid shop URLs for all recommendations', async () => {
    const recommendations = await generateGiftRecommendations(
        ['Tech-savvy', 'Creative'],
        ['Gaming', 'Reading'],
        500,
        'Alex',
        'USD',
        'USA'
      );

    expect(recommendations.length).toBeGreaterThan(0);

    for (const rec of recommendations) {
        expect(rec.shops).toBeDefined();
        expect(rec.shops.length).toBeGreaterThan(0);
        for(const shop of rec.shops) {
            expect(shop.url).toBeDefined();
            expect(shop.url).toContain('https://');
            expect(shop.name).toBeDefined();
            expect(shop.price).toBeDefined();
        }
    }
  });
});
