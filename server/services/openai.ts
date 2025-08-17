import OpenAI from "openai";
import type { GiftRecommendation } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Simulated gift recommendation data for development
const giftTemplates = {
  "Creative": [
    {
      name: "Professional Watercolor Paint Set",
      description: "A premium 36-color watercolor set perfect for unleashing creativity with vibrant, blendable colors and professional-grade brushes.",
      basePrice: 45,
      image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      matchingTraits: ["Creative", "Artistic"]
    },
    {
      name: "Digital Drawing Tablet",
      description: "A responsive graphics tablet that brings digital art to life, perfect for creative minds who love technology.",
      basePrice: 89,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      matchingTraits: ["Creative", "Tech-savvy"]
    }
  ],
  "Sporty": [
    {
      name: "Wireless Fitness Tracker",
      description: "Advanced fitness tracker with heart rate monitoring, GPS, and workout tracking to fuel their athletic passion.",
      basePrice: 95,
      image: "https://images.unsplash.com/photo-1544117519-31a4b719223d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      matchingTraits: ["Sporty", "Tech-savvy"]
    },
    {
      name: "Premium Yoga Mat Set",
      description: "Eco-friendly yoga mat with alignment guides and accessories, perfect for fitness enthusiasts who value quality.",
      basePrice: 55,
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      matchingTraits: ["Sporty", "Thoughtful"]
    }
  ],
  "Tech-savvy": [
    {
      name: "Smart Home Assistant Hub",
      description: "Voice-controlled smart hub that connects all their devices and makes life more convenient through technology.",
      basePrice: 79,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      matchingTraits: ["Tech-savvy", "Innovative"]
    },
    {
      name: "Mechanical Gaming Keyboard",
      description: "Professional-grade mechanical keyboard with customizable RGB lighting, perfect for tech enthusiasts.",
      basePrice: 125,
      image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      matchingTraits: ["Tech-savvy", "Gaming"]
    }
  ],
  "Outdoorsy": [
    {
      name: "Portable Camping Chair",
      description: "Lightweight, durable camping chair that packs small but provides maximum comfort for outdoor adventures.",
      basePrice: 65,
      image: "https://images.unsplash.com/photo-1487730116645-74489c95b41b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      matchingTraits: ["Outdoorsy", "Adventurous"]
    },
    {
      name: "Professional Hiking Backpack",
      description: "Ergonomic hiking backpack with multiple compartments and hydration system, built for serious outdoor enthusiasts.",
      basePrice: 145,
      image: "https://images.unsplash.com/photo-1516892366775-8d24e1b9d8b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      matchingTraits: ["Outdoorsy", "Adventurous"]
    }
  ],
  "Artistic": [
    {
      name: "Sketching Pencil Set",
      description: "Professional artist pencil set with various hardness levels, perfect for detailed drawings and artistic expression.",
      basePrice: 35,
      image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      matchingTraits: ["Artistic", "Creative"]
    },
    {
      name: "Acrylic Paint Starter Kit",
      description: "Complete acrylic painting kit with canvas, brushes, and vibrant colors for bringing artistic visions to life.",
      basePrice: 58,
      image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
      matchingTraits: ["Artistic", "Creative"]
    }
  ]
};

const genericGifts = [
  {
    name: "Premium Coffee Subscription",
    description: "Monthly delivery of freshly roasted, ethically sourced coffee beans from around the world.",
    basePrice: 25,
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
    matchingTraits: ["Thoughtful"]
  },
  {
    name: "Bluetooth Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation and premium sound quality.",
    basePrice: 89,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
    matchingTraits: ["Tech-savvy"]
  },
  {
    name: "Artisanal Chocolate Gift Box",
    description: "Curated selection of premium handcrafted chocolates with unique flavors and elegant presentation.",
    basePrice: 35,
    image: "https://images.unsplash.com/photo-1511910849309-0dffb8785146?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
    matchingTraits: ["Thoughtful"]
  }
];

function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    USD: "$", EUR: "€", GBP: "£", CAD: "C$", AUD: "A$", 
    JPY: "¥", KRW: "₩", BRL: "R$", MXN: "MX$", INR: "₹"
  };
  return symbols[currency] || "$";
}

// Reliable image mapping for gift categories
function getReliableImage(keywords: string): string {
  const imageMap: Record<string, string> = {
    // Art & Creative
    'art': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'paint': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'creative': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'drawing': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'tablet': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Tech
    'tech': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'keyboard': 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'gaming': 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'smart': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Fitness & Outdoors
    'fitness': 'https://images.unsplash.com/photo-1544117519-31a4b719223d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'yoga': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'outdoors': 'https://images.unsplash.com/photo-1487730116645-74489c95b41b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'camping': 'https://images.unsplash.com/photo-1487730116645-74489c95b41b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'hiking': 'https://images.unsplash.com/photo-1516892366775-8d24e1b9d8b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'backpack': 'https://images.unsplash.com/photo-1516892366775-8d24e1b9d8b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Food & Drink
    'coffee': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'tea': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'cooking': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Books & Reading
    'book': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'reading': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Fashion & Accessories
    'watch': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'jewelry': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'bag': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Music
    'music': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'speaker': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250'
  };
  
  // Find matching keyword
  for (const [key, imageUrl] of Object.entries(imageMap)) {
    if (keywords.includes(key)) {
      return imageUrl;
    }
  }
  
  // Default fallback image
  return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250';
}

function generateShops(basePrice: number, budget: number, currency: string, productName: string = "gift", country: string = "United States") {
  // UK-specific stores
  const ukShops = [
    { 
      name: "Amazon UK", 
      multiplier: 1.0, 
      baseUrl: "https://amazon.co.uk/s?k=",
      searchTerm: productName.replace(/\s+/g, '+').toLowerCase()
    },
    { 
      name: "Argos", 
      multiplier: 0.95, 
      baseUrl: "https://argos.co.uk/search/",
      searchTerm: productName.replace(/\s+/g, '-').toLowerCase()
    },
    { 
      name: "John Lewis", 
      multiplier: 1.15, 
      baseUrl: "https://johnlewis.com/search?search-term=",
      searchTerm: productName.replace(/\s+/g, '%20').toLowerCase()
    },
    { 
      name: "Currys", 
      multiplier: 1.05, 
      baseUrl: "https://currys.co.uk/search?q=",
      searchTerm: productName.replace(/\s+/g, '+').toLowerCase()
    },
    { 
      name: "ASOS", 
      multiplier: 0.9, 
      baseUrl: "https://asos.com/search/?q=",
      searchTerm: productName.replace(/\s+/g, '%20').toLowerCase()
    }
  ];

  // US/International stores
  const usShops = [
    { 
      name: "Amazon", 
      multiplier: 1.0, 
      baseUrl: "https://amazon.com/s?k=",
      searchTerm: productName.replace(/\s+/g, '+').toLowerCase()
    },
    { 
      name: "Target", 
      multiplier: 0.95, 
      baseUrl: "https://target.com/s?searchTerm=",
      searchTerm: productName.replace(/\s+/g, '%20').toLowerCase()
    },
    { 
      name: "Best Buy", 
      multiplier: 1.1, 
      baseUrl: "https://bestbuy.com/site/searchpage.jsp?st=",
      searchTerm: productName.replace(/\s+/g, '+').toLowerCase()
    },
    { 
      name: "Walmart", 
      multiplier: 0.85, 
      baseUrl: "https://walmart.com/search/?query=",
      searchTerm: productName.replace(/\s+/g, '%20').toLowerCase()
    },
    { 
      name: "REI", 
      multiplier: 1.15, 
      baseUrl: "https://rei.com/search?q=",
      searchTerm: productName.replace(/\s+/g, '+').toLowerCase()
    }
  ];

  // Choose shops based on country
  const shops = country.toLowerCase().includes('kingdom') || country.toLowerCase().includes('uk') ? ukShops : usShops;

  const symbol = getCurrencySymbol(currency);
  return shops.slice(0, 3).map(shop => ({
    name: shop.name,
    price: `${symbol}${Math.round(basePrice * shop.multiplier)}`,
    inStock: Math.random() > 0.2,
    url: `${shop.baseUrl}${shop.searchTerm}`
  }));
}

export async function generateGiftRecommendations(
  personalityTraits: string[],
  interests: string[],
  budget: number,
  friendName: string,
  currency: string = "USD",
  country: string = "United States",
  notes?: string
): Promise<GiftRecommendation[]> {
  try {
    const symbol = getCurrencySymbol(currency);
    const additionalContext = notes ? `\n\nAdditional context about ${friendName}: ${notes}` : '';
    
    console.log(`Generating AI-powered gifts for ${friendName} with traits: ${personalityTraits.join(', ')}, interests: ${interests.join(', ')}, budget: ${symbol}${budget}, currency: ${currency}${additionalContext ? '. Additional notes: ' + notes : ''}`);
    
    const prompt = `You are a thoughtful gift recommendation expert. Generate 5-6 personalized gift ideas for ${friendName} based on their profile:

Personality Traits: ${personalityTraits.join(', ')}
Interests: ${interests.join(', ')}
Budget: ${symbol}${budget}
Currency: ${currency}${additionalContext}

For each gift recommendation, provide:
1. A creative, specific gift name
2. A detailed description (2-3 sentences) explaining why it's perfect for them
3. An estimated price range within budget
4. A match percentage (how well it fits their profile)
5. Which specific traits/interests it matches
6. A realistic Unsplash image search term for the gift

Consider their personality and interests deeply. Be creative and think of unique, thoughtful gifts that someone with these specific traits would genuinely appreciate. Avoid generic suggestions.

Respond in JSON format with this structure:
{
  "recommendations": [
    {
      "name": "Gift name",
      "description": "Why this gift is perfect for them...",
      "price": "${symbol}XX - ${symbol}XX",
      "matchPercentage": 85,
      "matchingTraits": ["trait1", "trait2"],
      "imageSearchTerm": "professional art supplies"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert gift recommendation assistant. Provide thoughtful, personalized gift suggestions in valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2000
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
    const recommendations: GiftRecommendation[] = [];

    for (const rec of aiResponse.recommendations || []) {
      // Generate realistic shop pricing
      const basePrice = Math.random() * (budget * 0.8) + (budget * 0.2);
      const shops = generateShops(basePrice, budget, currency, rec.name || "gift", country);
      
      // Generate reliable image URL with fallback system
      const imageKeywords = rec.imageSearchTerm || rec.name || 'gift';
      const imageUrl = getReliableImage(imageKeywords.toLowerCase());

      recommendations.push({
        name: rec.name || "Personalized Gift",
        description: rec.description || "A thoughtful gift recommendation.",
        price: rec.price || `${symbol}${Math.round(basePrice * 0.8)} - ${symbol}${Math.round(basePrice * 1.2)}`,
        matchPercentage: Math.min(95, Math.max(60, rec.matchPercentage || 75)),
        matchingTraits: (rec.matchingTraits || []).filter((trait: string) => 
          personalityTraits.includes(trait) || interests.includes(trait)
        ),
        image: imageUrl,
        shops: shops
      });
    }

    console.log(`Generated ${recommendations.length} AI-powered recommendations for ${friendName}`);
    return recommendations;

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback to enhanced template-based recommendations
    return generateFallbackRecommendations(personalityTraits, interests, budget, friendName, currency, country, notes);
  }
}

// Fallback function for when OpenAI is unavailable
async function generateFallbackRecommendations(
  personalityTraits: string[],
  interests: string[],
  budget: number,
  friendName: string,
  currency: string = "USD",
  country: string = "United States",
  notes?: string
): Promise<GiftRecommendation[]> {
  console.log(`Using fallback recommendations for ${friendName}`);
  
  const recommendations: GiftRecommendation[] = [];
  const usedGifts = new Set<string>();

  // Enhanced template matching with notes consideration
  for (const trait of personalityTraits) {
    const traitGifts = giftTemplates[trait as keyof typeof giftTemplates];
    if (traitGifts) {
      for (const gift of traitGifts) {
        if (gift.basePrice <= budget && !usedGifts.has(gift.name) && recommendations.length < 6) {
          usedGifts.add(gift.name);
          
          const matchPercentage = Math.round(75 + Math.random() * 20);
          const symbol = getCurrencySymbol(currency);
          const priceRange = `${symbol}${Math.round(gift.basePrice * 0.8)} - ${symbol}${Math.round(gift.basePrice * 1.2)}`;
          
          let enhancedDescription = gift.description;
          if (notes) {
            enhancedDescription += ` This would be especially meaningful for ${friendName} who ${notes.toLowerCase()}.`;
          }

          recommendations.push({
            name: gift.name,
            description: enhancedDescription,
            price: priceRange,
            matchPercentage,
            matchingTraits: gift.matchingTraits.filter(t => personalityTraits.includes(t)),
            image: gift.image,
            shops: generateShops(gift.basePrice, budget, currency, gift.name, country)
          });
        }
      }
    }
  }

  // Fill remaining slots
  while (recommendations.length < 5) {
    const availableGeneric = genericGifts.filter(
      gift => gift.basePrice <= budget && !usedGifts.has(gift.name)
    );
    
    if (availableGeneric.length === 0) break;
    
    const randomGift = availableGeneric[Math.floor(Math.random() * availableGeneric.length)];
    usedGifts.add(randomGift.name);
    
    const matchPercentage = Math.round(60 + Math.random() * 25);
    const symbol = getCurrencySymbol(currency);
    const priceRange = `${symbol}${Math.round(randomGift.basePrice * 0.8)} - ${symbol}${Math.round(randomGift.basePrice * 1.2)}`;
    
    recommendations.push({
      name: randomGift.name,
      description: randomGift.description,
      price: priceRange,
      matchPercentage,
      matchingTraits: randomGift.matchingTraits.filter(t => personalityTraits.includes(t)),
      image: randomGift.image,
      shops: generateShops(randomGift.basePrice, budget, currency, randomGift.name, country)
    });
  }

  return recommendations;
}
