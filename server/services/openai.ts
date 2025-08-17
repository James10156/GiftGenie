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

function generateShops(basePrice: number, budget: number, currency: string) {
  const shops = [
    { name: "Amazon", multiplier: 1.0, url: "https://amazon.com" },
    { name: "Target", multiplier: 0.95, url: "https://target.com" },
    { name: "Best Buy", multiplier: 1.1, url: "https://bestbuy.com" },
    { name: "Walmart", multiplier: 0.85, url: "https://walmart.com" },
    { name: "REI", multiplier: 1.15, url: "https://rei.com" }
  ];

  const symbol = getCurrencySymbol(currency);
  return shops.slice(0, 3).map(shop => ({
    name: shop.name,
    price: `${symbol}${Math.round(basePrice * shop.multiplier)}`,
    inStock: Math.random() > 0.2,
    url: shop.url
  }));
}

export async function generateGiftRecommendations(
  personalityTraits: string[],
  interests: string[],
  budget: number,
  friendName: string,
  currency: string = "USD",
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
      const shops = generateShops(basePrice, budget, currency);
      
      // Generate Unsplash image URL
      const imageUrl = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000) + 1500000000}?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250&q=${encodeURIComponent(rec.imageSearchTerm || 'gift')}`;

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
    return generateFallbackRecommendations(personalityTraits, interests, budget, friendName, currency, notes);
  }
}

// Fallback function for when OpenAI is unavailable
async function generateFallbackRecommendations(
  personalityTraits: string[],
  interests: string[],
  budget: number,
  friendName: string,
  currency: string = "USD",
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
            shops: generateShops(gift.basePrice, budget, currency)
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
      shops: generateShops(randomGift.basePrice, budget, currency)
    });
  }

  return recommendations;
}
