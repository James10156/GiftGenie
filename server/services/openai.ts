import OpenAI from "openai";
import type { GiftRecommendation } from "@shared/schema";
import { getProductImage } from "./imageService.ts";
import { generateRealProductUrls, findBestProductMatch, PRODUCT_DATABASE } from "./productDatabase.ts";
import { getProductImageFromGoogle } from './googleImageScraper.ts';

let cachedOpenAIClient: OpenAI | null | undefined;

function resolveOpenAIApiKey(): string | null {
  const configuredKey = process.env.OPENAI_API_KEY?.trim();
  if (configuredKey) {
    return configuredKey;
  }

  if (process.env.NODE_ENV === "test") {
    return "test-api-key";
  }

  return null;
}

export function getOpenAIClient(): OpenAI | null {
  if (cachedOpenAIClient !== undefined) {
    return cachedOpenAIClient;
  }

  const apiKey = resolveOpenAIApiKey();
  if (!apiKey) {
    cachedOpenAIClient = null;
    return cachedOpenAIClient;
  }

  cachedOpenAIClient = new OpenAI({ apiKey });
  return cachedOpenAIClient;
}

export function resetOpenAIClient(): void {
  cachedOpenAIClient = undefined;
}

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
    JPY: "¥", KRW: "₩", BRL: "R$", MXN: "$", INR: "₹",
    CHF: "CHF", CNY: "¥", RUB: "₽", ZAR: "R",
    SEK: "kr", NOK: "kr", DKK: "kr", PLN: "zł", TRY: "₺", THB: "฿"
  };
  return symbols[currency] || "$";
}

// Enhanced reliable image mapping with intelligent keyword extraction
function getReliableImage(productDescription: string): string {
  const keywords = productDescription.toLowerCase().split(/\s+|[,.-]+/).filter(word => word.length > 2);
  
  // Comprehensive image mapping with multiple keyword variations
  const imageMap = {
    // Technology & Electronics
    'tech': 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'technology': 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'gadget': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'electronic': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'device': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'computer': 'https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'laptop': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'tablet': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'phone': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'smartphone': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'keyboard': 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'mouse': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Art & Creative
    'art': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'artist': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'artistic': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'paint': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'painting': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'draw': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'drawing': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'sketch': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'creative': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'craft': 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'crafting': 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'watercolor': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'acrylic': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'pencil': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Sports & Fitness
    'sport': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'fitness': 'https://images.unsplash.com/photo-1544117519-31a4b719223d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'gym': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'exercise': 'https://images.unsplash.com/photo-1544117519-31a4b719223d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'workout': 'https://images.unsplash.com/photo-1544117519-31a4b719223d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'yoga': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'running': 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'tracker': 'https://images.unsplash.com/photo-1544117519-31a4b719223d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Outdoor & Adventure
    'outdoor': 'https://images.unsplash.com/photo-1487730116645-74489c95b41b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'camping': 'https://images.unsplash.com/photo-1487730116645-74489c95b41b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'hiking': 'https://images.unsplash.com/photo-1516892366775-8d24e1b9d8b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'backpack': 'https://images.unsplash.com/photo-1516892366775-8d24e1b9d8b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'tent': 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'chair': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'adventure': 'https://images.unsplash.com/photo-1487730116645-74489c95b41b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Fashion & Accessories
    'fashion': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'clothing': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'dress': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'watch': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'jewelry': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'necklace': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'bracelet': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'ring': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'bag': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'purse': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'handbag': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Home & Kitchen
    'home': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'cooking': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'appliance': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'furniture': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'decor': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'decoration': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Books & Reading
    'book': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'reading': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'novel': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'literature': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Music & Audio
    'music': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'speaker': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'instrument': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'guitar': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'piano': 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Food & Beverages
    'coffee': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'tea': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'subscription': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Games & Toys
    'game': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'gaming': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'toy': 'https://images.unsplash.com/photo-1558060370-d8ba84a7d6c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'puzzle': 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Beauty & Personal Care
    'beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'skincare': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'makeup': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'cosmetic': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    
    // Tools & DIY
    'tool': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'tools': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'diy': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'repair': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'build': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250'
  };
  
  // Smart matching - try multiple approaches
  // 1. Direct keyword match
  for (const keyword of keywords) {
    if (imageMap[keyword as keyof typeof imageMap]) {
      return imageMap[keyword as keyof typeof imageMap];
    }
  }
  
  // 2. Partial match for compound words
  for (const [key, imageUrl] of Object.entries(imageMap)) {
    for (const keyword of keywords) {
      if (keyword.includes(key) || key.includes(keyword)) {
        return imageUrl;
      }
    }
  }
  
  // 3. Category-based fallback
  const categoryMap = {
    'tech': 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'art': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'sport': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'home': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    'fashion': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250'
  };
  
  for (const keyword of keywords) {
    for (const [category, imageUrl] of Object.entries(categoryMap)) {
      if (keyword.includes(category) || category.includes(keyword)) {
        return imageUrl;
      }
    }
  }
  
  // Default fallback image
  return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250';
}

// Enhanced product categorization for better shopping targeting
// Enhanced shopping platform detection and URL generation with brand-specific routing
async function generateShopsWithRange(basePrice: number, priceRange: string, currency: string, productName: string = "gift", country: string = "United States") {
  const symbol = getCurrencySymbol(currency);
  
  // Extract min and max from price range
  let minPrice = basePrice * 0.8;
  let maxPrice = basePrice * 1.2;
  
  try {
    // Handle different price range formats with comprehensive currency symbol removal
    const cleanRange = priceRange.replace(/[£€¥₩₹₽₺฿zł]|[CARMN]?\$|[CR]?\$|CHF|kr/g, '').trim();
    const priceNumbers = cleanRange.split(/\s*-\s*/).map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
    
    if (priceNumbers.length >= 2) {
      minPrice = priceNumbers[0];
      maxPrice = priceNumbers[1];
    } else if (priceNumbers.length === 1) {
      // Single price, create a small range around it
      const singlePrice = priceNumbers[0];
      minPrice = singlePrice * 0.9;
      maxPrice = singlePrice * 1.1;
    }
  } catch (error) {
    console.warn('Could not parse price range:', priceRange, error);
  }
  
  // Use the enhanced shop generation with brand routing
  const shops = await generateShopsWithBrandRouting(basePrice, maxPrice * 1.5, currency, productName, country);
  
  // Adjust shop prices to fit within the displayed price range
  return shops.map((shop, index) => {
    // Generate prices that span the range with realistic variation
    // Some shops cheaper, some more expensive, but all within reasonable bounds
    const priceSpread = maxPrice - minPrice;
    const baseTargetPrice = minPrice + (priceSpread * Math.random());
    
    // Add some shop-specific variation (±10% of the price spread)
    const variation = (priceSpread * 0.1) * (Math.random() - 0.5) * 2;
    const finalPrice = Math.max(minPrice * 0.95, Math.min(maxPrice * 1.05, baseTargetPrice + variation));
    
    return {
      ...shop,
      price: `${symbol}${Math.round(finalPrice)}`
    };
  });
}

// Enhanced brand-aware shop generation
async function generateShopsWithBrandRouting(basePrice: number, budget: number, currency: string, productName: string = "gift", country: string = "United States") {
  const brandInfo = detectBrandAndType(productName);
  const isUK = country.toLowerCase().includes('kingdom') || country.toLowerCase().includes('uk');
  const symbol = getCurrencySymbol(currency);
  
  // Safety check for NaN values
  if (isNaN(basePrice) || isNaN(budget)) {
    console.warn('NaN detected in generateShopsWithBrandRouting:', { basePrice, budget });
    basePrice = isNaN(basePrice) ? 50 : basePrice;
    budget = isNaN(budget) ? 100 : budget;
  }
  
  // For luxury brands, prioritize brand-specific retailers
  if (brandInfo.isLuxury && brandInfo.brand) {
    const brandSpecificShops = generateBrandSpecificShops(brandInfo, productName, basePrice, symbol, isUK);
    if (brandSpecificShops.length > 0) {
      return brandSpecificShops;
    }
  }
  
  // Fallback to existing database system
  const realProductUrls = generateRealProductUrls(productName, country, basePrice);
  if (realProductUrls && realProductUrls.length > 0) {
    return realProductUrls;
  }

  // Final fallback to category-based retailers
  const shops = await generateShops(basePrice, budget, currency, productName, country);
  return shops;
}

// Detect luxury brands and product types
function detectBrandAndType(productName: string) {
  const cleanName = productName.toLowerCase();
  
  const luxuryBrands = {
    // Fashion & Accessories
    'gucci': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'louis vuitton': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'chanel': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'prada': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'hermès': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'hermes': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'burberry': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'versace': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'valentino': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'balenciaga': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'givenchy': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'saint laurent': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'ysl': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'dior': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'fendi': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'bottega veneta': { type: 'fashion', isLuxury: true, hasOwnStore: true },
    'tiffany': { type: 'jewelry', isLuxury: true, hasOwnStore: true },
    'cartier': { type: 'jewelry', isLuxury: true, hasOwnStore: true },
    'bulgari': { type: 'jewelry', isLuxury: true, hasOwnStore: true },
    
    // Watches
    'rolex': { type: 'watches', isLuxury: true, hasOwnStore: true },
    'omega': { type: 'watches', isLuxury: true, hasOwnStore: true },
    'tag heuer': { type: 'watches', isLuxury: true, hasOwnStore: true },
    'breitling': { type: 'watches', isLuxury: true, hasOwnStore: true },
    'patek philippe': { type: 'watches', isLuxury: true, hasOwnStore: true },
    'audemars piguet': { type: 'watches', isLuxury: true, hasOwnStore: true },
    
    // Premium but not ultra-luxury brands
    'kate spade': { type: 'fashion', isLuxury: false, hasOwnStore: true },
    'michael kors': { type: 'fashion', isLuxury: false, hasOwnStore: true },
    'coach': { type: 'fashion', isLuxury: false, hasOwnStore: true },
    'marc jacobs': { type: 'fashion', isLuxury: false, hasOwnStore: true },
    'calvin klein': { type: 'fashion', isLuxury: false, hasOwnStore: true },
    'tommy hilfiger': { type: 'fashion', isLuxury: false, hasOwnStore: true },
    'hugo boss': { type: 'fashion', isLuxury: false, hasOwnStore: true },
    'ralph lauren': { type: 'fashion', isLuxury: false, hasOwnStore: true },
    'polo ralph lauren': { type: 'fashion', isLuxury: false, hasOwnStore: true }
  };
  
  let detectedBrand = null;
  let brandInfo = { type: 'general', isLuxury: false, hasOwnStore: false };
  
  for (const [brand, info] of Object.entries(luxuryBrands)) {
    if (cleanName.includes(brand)) {
      detectedBrand = brand;
      brandInfo = info;
      break;
    }
  }
  
  return {
    brand: detectedBrand,
    ...brandInfo
  };
}

// Generate brand-specific shop recommendations
function generateBrandSpecificShops(brandInfo: any, productName: string, basePrice: number, symbol: string, isUK: boolean) {
  const shops: any[] = [];
  const searchQuery = encodeURIComponent(productName.replace(/\s+/g, ' ').trim());
  const brandName = brandInfo.brand;
  
  // Brand official stores (if they have one)
  if (brandInfo.hasOwnStore && brandName) {
    const officialStore = generateOfficialStoreLink(brandName, searchQuery, isUK);
    if (officialStore) {
      shops.push({
        name: formatBrandName(brandName),
        price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.05))}`, // Official stores usually have MSRP
        inStock: Math.random() > 0.05, // High stock probability for official stores
        url: officialStore,
        isOfficialStore: true
      });
    }
  }
  
  // Luxury department stores for high-end brands
  if (brandInfo.isLuxury) {
    if (isUK) {
      shops.push({
        name: "Harrods",
        price: `${symbol}${Math.round(basePrice * (1.05 + Math.random() * 0.1))}`,
        inStock: Math.random() > 0.2,
        url: `https://www.harrods.com/en-gb/search/${searchQuery}`
      });
      shops.push({
        name: "Selfridges",
        price: `${symbol}${Math.round(basePrice * (1.03 + Math.random() * 0.1))}`,
        inStock: Math.random() > 0.15,
        url: `https://www.selfridges.com/GB/en/search/${searchQuery}`
      });
      shops.push({
        name: "Harvey Nichols",
        price: `${symbol}${Math.round(basePrice * (1.07 + Math.random() * 0.1))}`,
        inStock: Math.random() > 0.25,
        url: `https://www.harveynichols.com/search?keywords=${searchQuery}`
      });
    } else {
      shops.push({
        name: "Neiman Marcus",
        price: `${symbol}${Math.round(basePrice * (1.05 + Math.random() * 0.1))}`,
        inStock: Math.random() > 0.2,
        url: `https://www.neimanmarcus.com/search.jsp?query=${searchQuery}`
      });
      shops.push({
        name: "Saks Fifth Avenue",
        price: `${symbol}${Math.round(basePrice * (1.03 + Math.random() * 0.1))}`,
        inStock: Math.random() > 0.15,
        url: `https://www.saksfifthavenue.com/search?query=${searchQuery}`
      });
      shops.push({
        name: "Bergdorf Goodman",
        price: `${symbol}${Math.round(basePrice * (1.07 + Math.random() * 0.1))}`,
        inStock: Math.random() > 0.25,
        url: `https://www.bergdorfgoodman.com/search.jsp?query=${searchQuery}`
      });
    }
  } else {
    // Premium department stores for mid-tier brands
    if (isUK) {
      shops.push({
        name: "John Lewis",
        price: `${symbol}${Math.round(basePrice * (1.02 + Math.random() * 0.08))}`,
        inStock: Math.random() > 0.15,
        url: `https://www.johnlewis.com/search?search-term=${searchQuery}`
      });
    } else {
      shops.push({
        name: "Nordstrom",
        price: `${symbol}${Math.round(basePrice * (1.02 + Math.random() * 0.08))}`,
        inStock: Math.random() > 0.15,
        url: `https://www.nordstrom.com/sr?keyword=${searchQuery}`
      });
      shops.push({
        name: "Bloomingdale's",
        price: `${symbol}${Math.round(basePrice * (1.04 + Math.random() * 0.08))}`,
        inStock: Math.random() > 0.18,
        url: `https://www.bloomingdales.com/search?keyword=${searchQuery}`
      });
    }
  }
  
  // Add one general retailer as fallback (but lower priority)
  const generalRetailer = isUK ? "Farfetch" : "SSENSE";
  const generalUrl = isUK 
    ? `https://www.farfetch.com/shopping/search/items.aspx?q=${searchQuery}`
    : `https://www.ssense.com/en-us/search?q=${searchQuery}`;
  
  shops.push({
    name: generalRetailer,
    price: `${symbol}${Math.round(basePrice * (0.95 + Math.random() * 0.1))}`,
    inStock: Math.random() > 0.1,
    url: generalUrl
  });
  
  return shops.slice(0, 4);
}

// Generate official brand store links
function generateOfficialStoreLink(brandName: string, searchQuery: string, isUK: boolean) {
  const brandUrls: { [key: string]: { us: string, uk: string, searchPath: string } } = {
    'gucci': {
      us: 'https://www.gucci.com/us/en',
      uk: 'https://www.gucci.com/uk/en_gb',
      searchPath: '/search?q='
    },
    'louis vuitton': {
      us: 'https://us.louisvuitton.com',
      uk: 'https://uk.louisvuitton.com',
      searchPath: '/eng-us/search/'
    },
    'chanel': {
      us: 'https://www.chanel.com/us',
      uk: 'https://www.chanel.com/gb',
      searchPath: '/fashion/' // Chanel doesn't have a direct search, link to fashion section
    },
    'prada': {
      us: 'https://www.prada.com/us/en',
      uk: 'https://www.prada.com/gb/en',
      searchPath: '/search?q='
    },
    'hermès': {
      us: 'https://www.hermes.com/us/en',
      uk: 'https://www.hermes.com/uk/en',
      searchPath: '/search/?q='
    },
    'hermes': {
      us: 'https://www.hermes.com/us/en',
      uk: 'https://www.hermes.com/uk/en',
      searchPath: '/search/?q='
    },
    'burberry': {
      us: 'https://us.burberry.com',
      uk: 'https://uk.burberry.com',
      searchPath: '/search?q='
    },
    'coach': {
      us: 'https://www.coach.com',
      uk: 'https://uk.coach.com',
      searchPath: '/search?q='
    },
    'kate spade': {
      us: 'https://www.katespade.com',
      uk: 'https://www.katespade.co.uk',
      searchPath: '/search?q='
    },
    'michael kors': {
      us: 'https://www.michaelkors.com',
      uk: 'https://www.michaelkors.co.uk',
      searchPath: '/search?q='
    },
    'calvin klein': {
      us: 'https://www.calvinklein.us',
      uk: 'https://www.calvinklein.co.uk',
      searchPath: '/search?q='
    },
    'ralph lauren': {
      us: 'https://www.ralphlauren.com',
      uk: 'https://www.ralphlauren.co.uk',
      searchPath: '/search?q='
    },
    'polo ralph lauren': {
      us: 'https://www.ralphlauren.com',
      uk: 'https://www.ralphlauren.co.uk',
      searchPath: '/search?q='
    }
  };
  
  const brandData = brandUrls[brandName];
  if (!brandData) return null;
  
  const baseUrl = isUK ? brandData.uk : brandData.us;
  
  // For brands like Chanel that don't have search, just link to main category
  if (brandName === 'chanel') {
    return baseUrl + brandData.searchPath;
  }
  
  return baseUrl + brandData.searchPath + encodeURIComponent(searchQuery);
}

// Format brand names for display
function formatBrandName(brandName: string) {
  const specialCases: { [key: string]: string } = {
    'louis vuitton': 'Louis Vuitton',
    'hermès': 'Hermès',
    'hermes': 'Hermès',
    'ysl': 'Saint Laurent',
    'saint laurent': 'Saint Laurent',
    'kate spade': 'Kate Spade',
    'michael kors': 'Michael Kors',
    'calvin klein': 'Calvin Klein',
    'tommy hilfiger': 'Tommy Hilfiger',
    'hugo boss': 'Hugo Boss',
    'ralph lauren': 'Ralph Lauren',
    'polo ralph lauren': 'Polo Ralph Lauren',
    'marc jacobs': 'Marc Jacobs',
    'tag heuer': 'TAG Heuer',
    'patek philippe': 'Patek Philippe',
    'audemars piguet': 'Audemars Piguet',
    'bottega veneta': 'Bottega Veneta'
  };
  
  return specialCases[brandName] || brandName.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Enhanced product categorization for better shopping targeting
// Enhanced shopping platform detection and URL generation (HotUKDeals style)
async function generateShops(basePrice: number, budget: number, currency: string, productName: string = "gift", country: string = "United States") {
  const isUK = country.toLowerCase().includes('kingdom') || country.toLowerCase().includes('uk');
  const symbol = getCurrencySymbol(currency);
  
  // Safety check for NaN values
  if (isNaN(basePrice) || isNaN(budget)) {
    console.warn('NaN detected in generateShops:', { basePrice, budget });
    basePrice = isNaN(basePrice) ? 50 : basePrice;
    budget = isNaN(budget) ? 100 : budget;
  }
  
  // Fallback to our existing database system
  const realProductUrls = generateRealProductUrls(productName, country, basePrice);
  if (realProductUrls && realProductUrls.length > 0) {
    return realProductUrls;
  }

  // Final fallback to search-based URLs
  const cleanProduct = productName.toLowerCase();
  const shops: any[] = [];

  // Smart retailer selection based on product analysis
  const productAnalysis = analyzeProductForRetailers(cleanProduct);
  
  if (isUK) {
    const ukRetailers = getUKRetailers(productAnalysis, cleanProduct, basePrice, symbol);
    return ukRetailers.slice(0, 4);
  } else {
    const usRetailers = getUSRetailers(productAnalysis, cleanProduct, basePrice, symbol);
    return usRetailers.slice(0, 4);
  }
}

// Analyze product to determine best retailer types
function analyzeProductForRetailers(productName: string) {
  const analysis = {
    isElectronics: /\b(phone|laptop|computer|tablet|headphone|camera|tech|electronic|gadget|smart|device|bluetooth|wireless)\b/.test(productName),
    isFashion: /\b(dress|shirt|shoe|bag|watch|jewelry|fashion|clothing|accessory|style|wear)\b/.test(productName),
    isBeauty: /\b(makeup|skincare|perfume|beauty|cosmetic|fragrance|skincare|lotion|cream)\b/.test(productName),
    isBooks: /\b(book|novel|guide|journal|reading|kindle|ebook|magazine|cookbook)\b/.test(productName),
    isArt: /\b(art|paint|brush|canvas|sketch|draw|craft|watercolor|acrylic|pencil|marker)\b/.test(productName),
    isSports: /\b(sport|fitness|gym|exercise|yoga|running|outdoor|hiking|camping|bike)\b/.test(productName),
    isHome: /\b(home|kitchen|furniture|decor|candle|plant|pillow|blanket|lamp|vase|cookware)\b/.test(productName),
    isToys: /\b(toy|game|puzzle|board|card|lego|doll|action|figure|educational)\b/.test(productName),
    isMusic: /\b(music|instrument|guitar|piano|drum|violin|speaker|headphone|audio|sound)\b/.test(productName),
    isJewelry: /\b(jewelry|necklace|bracelet|earring|ring|pendant|chain|gold|silver|diamond)\b/.test(productName)
  };
  
  return analysis;
}

// UK-specific retailer mapping with enhanced URL targeting
function getUKRetailers(analysis: any, productName: string, basePrice: number, symbol: string) {
  const retailers: any[] = [];
  const searchQuery = encodeURIComponent(productName.replace(/\s+/g, ' ').trim());
  const optimizedQuery = optimizeSearchQuery(productName);
  
  // Safety check for NaN
  if (isNaN(basePrice)) {
    console.warn('NaN basePrice in getUKRetailers, using fallback value');
    basePrice = 50;
  }
  
  // Always include Amazon UK as primary with enhanced search
  retailers.push({
    name: "Amazon UK",
    price: `${symbol}${Math.round(basePrice * (0.95 + Math.random() * 0.1))}`,
    inStock: Math.random() > 0.1,
    url: generateAmazonUKURL(productName, optimizedQuery)
  });

  // Category-specific retailers with better URLs
  if (analysis.isElectronics) {
    retailers.push({
      name: "Currys PC World",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.15,
      url: `https://www.currys.co.uk/search?q=${optimizedQuery}&sort=relevance&tab=product`
    });
    retailers.push({
      name: "Argos",
      price: `${symbol}${Math.round(basePrice * (0.9 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.2,
      url: `https://www.argos.co.uk/search/${productName.replace(/\s+/g, '-').toLowerCase()}/?clickOrigin=searchbar:search:term:${optimizedQuery}`
    });
  }
  
  if (analysis.isFashion) {
    retailers.push({
      name: "ASOS",
      price: `${symbol}${Math.round(basePrice * (0.85 + Math.random() * 0.2))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.asos.com/search/?q=${optimizedQuery}&currentpricerange=0-1000&refine=currentpricerange:0-1000`
    });
    retailers.push({
      name: "Next",
      price: `${symbol}${Math.round(basePrice * (1.1 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.15,
      url: `https://www.next.co.uk/search?w=${optimizedQuery}#1`
    });
  }
  
  if (analysis.isBeauty) {
    retailers.push({
      name: "Boots",
      price: `${symbol}${Math.round(basePrice * (1.05 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.boots.com/search?text=${optimizedQuery}&sort=relevance&pagesize=24`
    });
    retailers.push({
      name: "Superdrug",
      price: `${symbol}${Math.round(basePrice * (0.9 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.15,
      url: `https://www.superdrug.com/search?text=${optimizedQuery}&sort=relevance`
    });
  }
  
  if (analysis.isBooks) {
    retailers.push({
      name: "Waterstones",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.05))}`,
      inStock: Math.random() > 0.05,
      url: `https://www.waterstones.com/books/search/term/${optimizedQuery}?breadcrumb=books`
    });
    retailers.push({
      name: "WHSmith",
      price: `${symbol}${Math.round(basePrice * (1.05 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.whsmith.co.uk/search?w=${optimizedQuery}&af=brand`
    });
  }
  
  if (analysis.isArt) {
    retailers.push({
      name: "Jackson's Art",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.05,
      url: `https://www.jacksonsart.com/search?q=${optimizedQuery}&type=product`
    });
    retailers.push({
      name: "The Works",
      price: `${symbol}${Math.round(basePrice * (0.8 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.theworks.co.uk/search?q=${optimizedQuery}&lang=en_GB`
    });
  }

  // Add John Lewis as premium option with enhanced search
  retailers.push({
    name: "John Lewis",
    price: `${symbol}${Math.round(basePrice * (1.15 + Math.random() * 0.1))}`,
    inStock: Math.random() > 0.2,
    url: `https://www.johnlewis.com/search?search-term=${optimizedQuery}&esid=search_${optimizedQuery.replace(/%20/g, '_')}`
  });

  return retailers;
}

// Generate optimized Amazon UK URLs
function generateAmazonUKURL(productName: string, optimizedQuery: string) {
  // Similar brand detection for UK Amazon
  const brandSections: { [key: string]: string } = {
    'apple': '&rh=n%3A560798', // Apple store UK
    'nike': '&rh=n%3A11052591', // Nike UK
    'adidas': '&rh=n%3A11052592', // Adidas UK
    'lululemon': '&rh=n%3A83450031',
    'coach': '&rh=n%3A11052671',
    'kate spade': '&rh=n%3A11052671',
    'stanley': '&rh=n%3A11052798',
    'yeti': '&rh=n%3A11052798',
    'instant pot': '&rh=n%3A11052799',
    'kindle': '&rh=n%3A341689031'
  };
  
  const lowerName = productName.toLowerCase();
  let categoryFilter = '';
  
  for (const [brand, filter] of Object.entries(brandSections)) {
    if (lowerName.includes(brand)) {
      categoryFilter = filter;
      break;
    }
  }
  
  const baseUrl = 'https://www.amazon.co.uk/s';
  const params = [
    `k=${optimizedQuery}`,
    'crid=1234567890ABC',
    'sprefix=' + optimizedQuery.split('+')[0] + '%2Caps%2C123',
    'ref=nb_sb_noss_2'
  ];
  
  if (categoryFilter) {
    params.push(categoryFilter.substring(1));
  }
  
  return baseUrl + '?' + params.join('&');
}

// US-specific retailer mapping with enhanced URL targeting
function getUSRetailers(analysis: any, productName: string, basePrice: number, symbol: string) {
  const retailers: any[] = [];
  const searchQuery = encodeURIComponent(productName.replace(/\s+/g, ' ').trim());
  const optimizedQuery = optimizeSearchQuery(productName);
  
  // Safety check for NaN
  if (isNaN(basePrice)) {
    console.warn('NaN basePrice in getUSRetailers, using fallback value');
    basePrice = 50;
  }
  
  // Always include Amazon as primary with optimized search
  retailers.push({
    name: "Amazon",
    price: `${symbol}${Math.round(basePrice * (0.95 + Math.random() * 0.1))}`,
    inStock: Math.random() > 0.05,
    url: generateAmazonURL(productName, optimizedQuery)
  });

  // Category-specific retailers with better URLs
  if (analysis.isElectronics) {
    retailers.push({
      name: "Best Buy",
      price: `${symbol}${Math.round(basePrice * (1.05 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.15,
      url: `https://www.bestbuy.com/site/searchpage.jsp?st=${optimizedQuery}&_dyncharset=UTF-8&_dynSessConf=&id=pcat17071&type=page&sc=Global&cp=1&nrp=&sp=&qp=&list=n&af=true&iht=y&usc=All+Categories&ks=960&keys=keys`
    });
    retailers.push({
      name: "B&H Photo",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.bhphotovideo.com/c/search?Ntt=${optimizedQuery}&N=0&InitialSearch=yes&sts=ma`
    });
  }
  
  if (analysis.isFashion) {
    retailers.push({
      name: "Nordstrom",
      price: `${symbol}${Math.round(basePrice * (1.2 + Math.random() * 0.2))}`,
      inStock: Math.random() > 0.15,
      url: `https://www.nordstrom.com/sr?keyword=${optimizedQuery}&origin=keywordsearch&autosuggestion=true`
    });
    retailers.push({
      name: "Macy's",
      price: `${symbol}${Math.round(basePrice * (0.9 + Math.random() * 0.2))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.macys.com/shop/search?keyword=${optimizedQuery}&cm_kws=${optimizedQuery}`
    });
  }
  
  if (analysis.isBeauty) {
    retailers.push({
      name: "Sephora",
      price: `${symbol}${Math.round(basePrice * (1.1 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.sephora.com/search?keyword=${optimizedQuery}&pageSize=60&content=product&currentPage=1`
    });
    retailers.push({
      name: "Ulta Beauty",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.15,
      url: `https://www.ulta.com/search?query=${optimizedQuery}&sort=relevance`
    });
  }
  
  if (analysis.isBooks) {
    retailers.push({
      name: "Barnes & Noble",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.05))}`,
      inStock: Math.random() > 0.05,
      url: `https://www.barnesandnoble.com/s/${optimizedQuery}?Ntk=P_key_Contributor_List&Ns=P_Sales_Rank&Ntx=mode+matchall`
    });
  }
  
  if (analysis.isArt) {
    retailers.push({
      name: "Blick Art Materials",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.05,
      url: `https://www.dickblick.com/search/?q=${optimizedQuery}&x=0&y=0`
    });
    retailers.push({
      name: "Michaels",
      price: `${symbol}${Math.round(basePrice * (0.85 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.michaels.com/search?q=${optimizedQuery}&pmpt=qualifying&promotioncode=&start=0`
    });
  }
  
  if (analysis.isSports) {
    retailers.push({
      name: "Dick's Sporting Goods",
      price: `${symbol}${Math.round(basePrice * (0.95 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.dickssportinggoods.com/search/SearchDisplay?categoryId=&storeId=15108&catalogId=12301&langId=-1&sType=SimpleSearch&resultCatEntryType=2&showResultsPage=true&searchSource=Q&pageView=&beginIndex=0&pageSize=48&searchTerm=${optimizedQuery}`
    });
  }

  // Add Target as general retailer with enhanced search
  retailers.push({
    name: "Target",
    price: `${symbol}${Math.round(basePrice * (0.9 + Math.random() * 0.1))}`,
    inStock: Math.random() > 0.15,
    url: `https://www.target.com/s?searchTerm=${optimizedQuery}&category=0%7CAll%7Cmatchallpartial%7Call+categories&tref=typeahead%7Cterm%7C0%7C${optimizedQuery}%7C%7C%7Cservice`
  });

  return retailers;
}

// Optimize search queries for better product matching
function optimizeSearchQuery(productName: string) {
  // Extract key terms from product name, prioritizing brand and model
  const words = productName.toLowerCase().split(/\s+/);
  
  // Define important brand terms that should be prioritized
  const importantBrands = [
    'apple', 'samsung', 'sony', 'nintendo', 'microsoft', 'google',
    'nike', 'adidas', 'lululemon', 'under armour',
    'coach', 'kate spade', 'michael kors', 'gucci', 'louis vuitton',
    'stanley', 'yeti', 'hydroflask', 'contigo',
    'instant pot', 'kitchenaid', 'cuisinart', 'vitamix',
    'kindle', 'ipad', 'macbook', 'airpods',
    'winsor newton', 'prismacolor', 'wacom', 'copic'
  ];
  
  // Define model/type indicators
  const modelIndicators = [
    'pro', 'max', 'mini', 'air', 'plus', 'ultra', 'oled', 'elite',
    'generation', 'gen', '2nd', '3rd', '4th', '5th',
    'duo', 'essential', 'deluxe', 'premium', 'standard'
  ];
  
  // Extract brand if present
  let brand = '';
  let model = '';
  let productType = '';
  
  for (const word of words) {
    if (importantBrands.some(b => b.includes(word) || word.includes(b))) {
      brand = word;
      break;
    }
  }
  
  // Extract model indicators
  for (const word of words) {
    if (modelIndicators.includes(word) || /\d+(st|nd|rd|th|oz|inch|gb|tb)/.test(word)) {
      model += word + ' ';
    }
  }
  
  // For products with clear brand and model, use those primarily
  if (brand && model.trim()) {
    return encodeURIComponent(`${brand} ${model.trim()}`);
  }
  
  // For products with brand but no clear model, include product type
  if (brand) {
    const remainingWords = words.filter(w => w !== brand && !modelIndicators.includes(w));
    const keyWords = remainingWords.slice(0, 2); // Take first 2 non-brand words
    return encodeURIComponent(`${brand} ${keyWords.join(' ')}`);
  }
  
  // Fallback: use the most important words (first 3-4 words, excluding common words)
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'with', 'for', 'by'];
  const filteredWords = words.filter(w => !stopWords.includes(w)).slice(0, 4);
  
  return encodeURIComponent(filteredWords.join(' '));
}

// Generate optimized Amazon URLs with better targeting
function generateAmazonURL(productName: string, optimizedQuery: string) {
  // Detect if it's a specific brand that has a dedicated Amazon store/section
  const brandSections: { [key: string]: string } = {
    'apple': '&rh=n%3A2407747011', // Apple store on Amazon
    'nike': '&rh=n%3A7147440011', // Nike store
    'adidas': '&rh=n%3A14553805011', // Adidas store
    'lululemon': '&rh=n%3A2353394011', // Athletic apparel
    'coach': '&rh=n%3A7147441011', // Handbags & accessories
    'kate spade': '&rh=n%3A7147441011',
    'michael kors': '&rh=n%3A7147441011',
    'stanley': '&rh=n%3A3741341', // Kitchen & dining
    'yeti': '&rh=n%3A3741341',
    'instant pot': '&rh=n%3A289851',
    'kitchenaid': '&rh=n%3A289851',
    'kindle': '&rh=n%3A6669702011', // Kindle store
    'nintendo': '&rh=n%3A468642', // Video games
    'sony': '&rh=n%3A172282'
  };
  
  const lowerName = productName.toLowerCase();
  let categoryFilter = '';
  
  for (const [brand, filter] of Object.entries(brandSections)) {
    if (lowerName.includes(brand)) {
      categoryFilter = filter;
      break;
    }
  }
  
  // Build enhanced Amazon URL
  const baseUrl = 'https://www.amazon.com/s';
  const params = [
    `k=${optimizedQuery}`,
    'crid=1234567890ABC', // Helps with tracking
    'sprefix=' + optimizedQuery.split('+')[0] + '%2Caps%2C123',
    'ref=nb_sb_noss_2'
  ];
  
  if (categoryFilter) {
    params.push(categoryFilter.substring(1)); // Remove the & at the beginning
  }
  
  return baseUrl + '?' + params.join('&');
}

export async function generateGiftRecommendations(
  personalityTraits: string[],
  interests: string[],
  budget: number,
  friendName: string,
  currency: string = "USD",
  country: string = "United States",
  notes?: string,
  gender?: string,
  ageRange?: string
): Promise<GiftRecommendation[]> {
  try {
    const symbol = getCurrencySymbol(currency);
    const additionalContext = notes ? `\n\nAdditional context about ${friendName}: ${notes}` : '';
    const genderContext = gender ? `\n\nGender: ${gender}` : '';
    const ageContext = ageRange ? `\n\nAge range: ${ageRange}` : '';
    
    console.log(`Generating AI-powered gifts for ${friendName} with traits: ${personalityTraits.join(', ')}, interests: ${interests.join(', ')}, budget: ${symbol}${budget}, currency: ${currency}${gender ? `, gender: ${gender}` : ''}${ageRange ? `, age: ${ageRange}` : ''}${additionalContext ? '. Additional notes: ' + notes : ''}`);

    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      console.warn('OpenAI client unavailable; falling back to template recommendations.');
      return generateFallbackRecommendations(personalityTraits, interests, budget, friendName, currency, country, notes, gender, ageRange);
    }
    
    const prompt = `You are a thoughtful gift recommendation expert who specializes in finding REAL, commercially available products. Generate 5-6 personalized gift ideas for ${friendName} based on their profile:

Personality Traits: ${personalityTraits.join(', ')}
Interests: ${interests.join(', ')}
Budget: ${symbol}${budget} (MAXIMUM - do not exceed this amount)
Currency: ${currency}${additionalContext}${genderContext}${ageContext}

CRITICAL REQUIREMENTS:
- All gift prices must be within the budget of ${symbol}${budget}. Do not recommend anything that costs more than this amount.
- Recommend ONLY real, commercially available products with specific brand names and models
- Use popular, well-known brands that are widely available at major retailers
- For luxury brands (Gucci, Louis Vuitton, etc.), suggest their most accessible items within budget

PRODUCT SELECTION GUIDELINES:
1. For tech products: Use current, popular models from Apple, Samsung, Sony, Nintendo, etc.
2. For fashion: Use accessible lines from well-known brands (Coach outlet items, Kate Spade, Michael Kors, etc.)
3. For beauty: Use popular products from Sephora/Ulta brands (Fenty, Urban Decay, Charlotte Tilotte, etc.)
4. For home items: Use popular brands like Stanley, Yeti, Le Creuset, KitchenAid, etc.
5. For books: Use bestsellers or popular titles, include author names
6. For art supplies: Use established brands like Winsor & Newton, Prismacolor, Wacom, etc.
7. For sports: Use Nike, Adidas, Under Armour, Lululemon, etc.

For each gift recommendation, provide:
1. A SPECIFIC, REAL product name with exact brand and model (e.g. "Coach Outlet Madison Leather Handbag", "Apple AirPods Pro 2nd Generation", "Stanley Adventure Quencher Tumbler 40oz", "Nintendo Switch OLED Console")
2. A detailed description (2-3 sentences) explaining why it's perfect for them
3. An estimated price range WITHIN the ${symbol}${budget} budget (never exceed this amount)
4. A match percentage (how well it fits their profile)
5. Which specific traits/interests it matches
6. A realistic product search term for images
7. A specific product search term for shopping (use exact product names and model numbers)

EXCELLENT EXAMPLES of specific, real products:
- "Apple AirPods Pro 2nd Generation with MagSafe Case" (not just "wireless earbuds")
- "Coach Outlet Crossgrain Leather City Zip Tote" (not just "handbag")
- "Stanley Adventure Quencher Travel Tumbler 40oz Charcoal" (not just "water bottle") 
- "Nintendo Switch OLED Console with Neon Blue and Red Joy-Con" (not just "gaming console")
- "Lululemon Align High-Rise Pant 28" in Black" (not just "yoga pants")
- "Instant Pot Duo 7-in-1 Electric Pressure Cooker 6-Quart" (not just "pressure cooker")
- "Kindle Paperwhite 11th Generation 6.8 inch Display" (not just "e-reader")
- "Yeti Rambler 20oz Tumbler with MagSlider Lid" (not just "tumbler")

BRAND TIER GUIDANCE:
- Luxury (over $200): Gucci, Louis Vuitton, Chanel (suggest their most affordable items)
- Premium ($50-200): Coach, Kate Spade, Michael Kors, Apple, Lululemon, Yeti
- Mid-range ($20-50): Nike, Adidas, Stanley, Instant Pot, Kindle
- Affordable (under $20): Books, small accessories, beauty items

Consider their personality and interests deeply. Be creative and think of unique, thoughtful gifts that someone with these specific traits would genuinely appreciate and that they can actually find and purchase.

Respond in JSON format with this structure:
{
  "recommendations": [
    {
      "name": "Exact Brand Product Name with Specific Model/Size/Color",
      "description": "Why this gift is perfect for them...",
      "price": "${symbol}XX - ${symbol}XX",
      "matchPercentage": 85,
      "matchingTraits": ["trait1", "trait2"],
      "imageSearchTerm": "brand product name model",
      "shopSearchTerm": "Exact Brand Model Product Name with specifications"
    }
  ]
}`;

  const response = await openaiClient.chat.completions.create({
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
      // Use OpenAI's price if provided, otherwise generate realistic shop pricing
      let basePrice: number;
      let priceRange: string;
      
      if (rec.price && rec.price.includes(symbol)) {
        // Use OpenAI's suggested price but validate against budget
        priceRange = rec.price;
        // Extract base price from OpenAI's range for shop generation
        const priceNumbers = rec.price.replace(/[^\d\-]/g, '').split('-');
        if (priceNumbers.length >= 2) {
          const minPrice = parseInt(priceNumbers[0]);
          const maxPrice = parseInt(priceNumbers[1]);
          
          // Validate that prices don't exceed budget
          if (maxPrice > budget) {
            console.warn(`OpenAI suggested price ${rec.price} exceeds budget ${symbol}${budget}, adjusting...`);
            const adjustedMax = Math.min(budget, maxPrice);
            const adjustedMin = Math.min(minPrice, adjustedMax * 0.8);
            priceRange = `${symbol}${Math.round(adjustedMin)} - ${symbol}${Math.round(adjustedMax)}`;
            basePrice = (adjustedMin + adjustedMax) / 2;
          } else {
            basePrice = (minPrice + maxPrice) / 2;
          }
        } else {
          const singlePrice = parseInt(priceNumbers[0]) || (Math.random() * (budget * 0.8) + (budget * 0.2));
          if (singlePrice > budget) {
            basePrice = budget * 0.8;
            priceRange = `${symbol}${Math.round(basePrice * 0.9)} - ${symbol}${budget}`;
          } else {
            basePrice = singlePrice;
            priceRange = rec.price;
          }
        }
      } else {
        // Fallback to generated pricing
        basePrice = Math.random() * (budget * 0.8) + (budget * 0.2);
        priceRange = `${symbol}${Math.round(basePrice * 0.8)} - ${symbol}${Math.round(basePrice * 1.2)}`;
      }
      
      // Use specific search term if provided, otherwise fall back to product name
      const searchTerm = rec.shopSearchTerm || rec.name || "gift";
      
      // Generate reliable image URL using new priority system
      const imageKeywords = rec.imageSearchTerm || rec.name || 'gift';
      let imageUrl: string = ""; // Initialize with empty string

      // Generate shops with aligned pricing
      const shops = await generateShopsWithRange(basePrice, priceRange, currency, rec.name || 'gift', country);

      // Check for database match first (simplified for dev environment)
      const productKey = findBestProductMatch(rec.name || '');
      
      if (productKey && PRODUCT_DATABASE[productKey]) {
        // Database match found - use database price range and image
        const product = PRODUCT_DATABASE[productKey];
        priceRange = `${symbol}${product.price_range[0]} - ${symbol}${product.price_range[1]}`;
        // Update basePrice to align with database pricing for shop generation
        basePrice = (product.price_range[0] + product.price_range[1]) / 2;
        // Use the database image directly
        imageUrl = product.image;
      }

      // If we don't have a valid imageUrl yet (either no database match or database validation failed), use simplified priority system
      if (!imageUrl || imageUrl.trim() === "") {
        
        // PRIORITY 1: Google Images scraper (primary method in dev)
        try {
          const imageStartTime = Date.now();
          const googleImage = await getProductImageFromGoogle(rec.name || '', rec.description);
          const imageResponseTime = Date.now() - imageStartTime;
          
          if (googleImage) {
            imageUrl = googleImage;
            // Track successful image search performance
            console.log(`Image search succeeded in ${imageResponseTime}ms for "${rec.name}"`);
          } else {
            console.log(`Google image search returned null in ${imageResponseTime}ms for "${rec.name}"`);
            
            // PRIORITY 2: Generic fallback images (ultimate fallback)
            try {
              const fallbackStartTime = Date.now();
              imageUrl = await getProductImage(imageKeywords, rec.description);
              const fallbackResponseTime = Date.now() - fallbackStartTime;
              console.log(`Fallback image search completed in ${fallbackResponseTime}ms for "${rec.name}"`);
            } catch (error) {
              console.error(`Generic image service failed:`, error);
              // Ultimate fallback to a reliable generic image
              imageUrl = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300';
            }
          }
        } catch (googleError) {
          console.error(`Google Images search failed:`, googleError);
          
          // PRIORITY 2: Generic fallback images (ultimate fallback)
          try {
            const fallbackStartTime = Date.now();
            imageUrl = await getProductImage(imageKeywords, rec.description);
            const fallbackResponseTime = Date.now() - fallbackStartTime;
            console.log(`Fallback image search completed in ${fallbackResponseTime}ms for "${rec.name}"`);
          } catch (error) {
            console.error(`Generic image service failed:`, error);
            // Ultimate fallback to a reliable generic image
            imageUrl = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300';
          }
        }
        
        // Price range is already set above based on OpenAI response or database match
      }

    recommendations.push({
      name: rec.name || "Personalized Gift",
      description: rec.description || "A thoughtful gift recommendation.",
      price: priceRange,
      matchPercentage: Math.min(95, Math.max(60, rec.matchPercentage || 75)),
      matchingTraits: rec.matchingTraits || [],
      image: imageUrl,
      shops: shops
    });
    
    }

    console.log(`Generated ${recommendations.length} AI-powered recommendations for ${friendName}`);
    
    // Final budget validation - filter out any recommendations that exceed budget
    const validRecommendations = recommendations.filter(rec => {
      try {
        const priceNumbers = rec.price.replace(/[£€¥₩₹₽₺฿zł]|[CARMN]?\$|[CR]?\$|CHF|kr/g, '').split(/\s*-\s*/).map(p => parseFloat(p.trim()));
        const maxPrice = priceNumbers.length >= 2 ? priceNumbers[1] : priceNumbers[0];
        
        if (maxPrice > budget) {
          console.warn(`Filtering out recommendation "${rec.name}" - price ${rec.price} exceeds budget ${symbol}${budget}`);
          return false;
        }
        return true;
      } catch (error) {
        console.warn(`Could not validate price for "${rec.name}": ${rec.price}`);
        return true; // Keep it if we can't parse the price
      }
    });
    
    console.log(`${validRecommendations.length} recommendations within budget after filtering`);
    
    return validRecommendations;

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback to enhanced template-based recommendations
    return generateFallbackRecommendations(personalityTraits, interests, budget, friendName, currency, country, notes, gender, ageRange);
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
  notes?: string,
  gender?: string,
  ageRange?: string
): Promise<GiftRecommendation[]> {
  console.log(`Using fallback recommendations for ${friendName}${gender ? ` (${gender})` : ''}${ageRange ? ` (${ageRange})` : ''}`);
  
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
          
          // Ensure price range doesn't exceed budget
          const maxAllowedPrice = Math.min(budget, gift.basePrice * 1.2);
          const minPrice = Math.round(gift.basePrice * 0.8);
          const priceRange = `${symbol}${minPrice} - ${symbol}${Math.round(maxAllowedPrice)}`;
          
          let enhancedDescription = gift.description;
          if (notes) {
            enhancedDescription += ` This would be especially meaningful for ${friendName} who ${notes.toLowerCase()}.`;
          }

          const giftShops = await generateShopsWithRange(gift.basePrice, priceRange, currency, gift.name, country);

          recommendations.push({
            name: gift.name,
            description: enhancedDescription,
            price: priceRange,
            matchPercentage,
            matchingTraits: gift.matchingTraits,
            image: gift.image,
            shops: giftShops
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
    
    // Ensure price range doesn't exceed budget
    const maxAllowedPrice = Math.min(budget, randomGift.basePrice * 1.2);
    const minPrice = Math.round(randomGift.basePrice * 0.8);
    const priceRange = `${symbol}${minPrice} - ${symbol}${Math.round(maxAllowedPrice)}`;
    
    const randomGiftShops = await generateShopsWithRange(randomGift.basePrice, priceRange, currency, randomGift.name, country);
    
    recommendations.push({
      name: randomGift.name,
      description: randomGift.description,
      price: priceRange,
      matchPercentage,
      matchingTraits: randomGift.matchingTraits,
      image: randomGift.image,
      shops: randomGiftShops
    });
  }

  // Final budget validation for fallback recommendations
  const validRecommendations = recommendations.filter(rec => {
    try {
      const priceNumbers = rec.price.replace(/[£€¥₩₹₽₺฿zł]|[CARMN]?\$|[CR]?\$|CHF|kr/g, '').split(/\s*-\s*/).map(p => parseFloat(p.trim()));
      const maxPrice = priceNumbers.length >= 2 ? priceNumbers[1] : priceNumbers[0];
      
      if (maxPrice > budget) {
        console.warn(`Filtering out fallback recommendation "${rec.name}" - price ${rec.price} exceeds budget ${getCurrencySymbol(currency)}${budget}`);
        return false;
      }
      return true;
    } catch (error) {
      console.warn(`Could not validate fallback price for "${rec.name}": ${rec.price}`);
      return true; // Keep it if we can't parse the price
    }
  });
  
  console.log(`${validRecommendations.length} fallback recommendations within budget after filtering`);
  
  return validRecommendations;
}
