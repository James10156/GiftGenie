import OpenAI from "openai";
import type { GiftRecommendation } from "@shared/schema";
import { getProductImage } from "./imageService.ts";
import { extractBestProductImage } from "./imageExtractor.ts";
import { getAmazonProductImage, getAmazonImageFromUrl } from "./amazonAffiliate.ts";
import { generateRealProductUrls, findBestProductMatch, PRODUCT_DATABASE } from "./productDatabase.ts";

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
    console.log(`Found database URLs for: ${productName}`);
    return realProductUrls;
  }

  // Final fallback to search-based URLs
  console.log(`Using search-based URLs for: ${productName}`);
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

// UK-specific retailer mapping with real product links
function getUKRetailers(analysis: any, productName: string, basePrice: number, symbol: string) {
  const retailers: any[] = [];
  const searchQuery = encodeURIComponent(productName.replace(/\s+/g, ' ').trim());
  
  // Safety check for NaN
  if (isNaN(basePrice)) {
    console.warn('NaN basePrice in getUKRetailers, using fallback value');
    basePrice = 50;
  }
  
  // Always include Amazon UK as primary
  retailers.push({
    name: "Amazon UK",
    price: `${symbol}${Math.round(basePrice * (0.95 + Math.random() * 0.1))}`,
    inStock: Math.random() > 0.1,
    url: `https://www.amazon.co.uk/s?k=${searchQuery}&ref=nb_sb_noss`
  });

  // Category-specific retailers
  if (analysis.isElectronics) {
    retailers.push({
      name: "Currys PC World",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.15,
      url: `https://www.currys.co.uk/search?q=${searchQuery}`
    });
    retailers.push({
      name: "Argos",
      price: `${symbol}${Math.round(basePrice * (0.9 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.2,
      url: `https://www.argos.co.uk/search/${productName.replace(/\s+/g, '-').toLowerCase()}/`
    });
  }
  
  if (analysis.isFashion) {
    retailers.push({
      name: "ASOS",
      price: `${symbol}${Math.round(basePrice * (0.85 + Math.random() * 0.2))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.asos.com/search/?q=${searchQuery}`
    });
    retailers.push({
      name: "Next",
      price: `${symbol}${Math.round(basePrice * (1.1 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.15,
      url: `https://www.next.co.uk/search?w=${searchQuery}`
    });
  }
  
  if (analysis.isBeauty) {
    retailers.push({
      name: "Boots",
      price: `${symbol}${Math.round(basePrice * (1.05 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.boots.com/search?text=${searchQuery}`
    });
    retailers.push({
      name: "Superdrug",
      price: `${symbol}${Math.round(basePrice * (0.9 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.15,
      url: `https://www.superdrug.com/search?text=${searchQuery}`
    });
  }
  
  if (analysis.isBooks) {
    retailers.push({
      name: "Waterstones",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.05))}`,
      inStock: Math.random() > 0.05,
      url: `https://www.waterstones.com/books/search/term/${searchQuery}`
    });
    retailers.push({
      name: "WHSmith",
      price: `${symbol}${Math.round(basePrice * (1.05 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.whsmith.co.uk/search?w=${searchQuery}`
    });
  }
  
  if (analysis.isArt) {
    retailers.push({
      name: "Jackson's Art",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.05,
      url: `https://www.jacksonsart.com/search?q=${searchQuery}`
    });
    retailers.push({
      name: "The Works",
      price: `${symbol}${Math.round(basePrice * (0.8 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.theworks.co.uk/search?q=${searchQuery}`
    });
  }

  // Add John Lewis as premium option
  retailers.push({
    name: "John Lewis",
    price: `${symbol}${Math.round(basePrice * (1.15 + Math.random() * 0.1))}`,
    inStock: Math.random() > 0.2,
    url: `https://www.johnlewis.com/search?search-term=${searchQuery}`
  });

  return retailers;
}

// US-specific retailer mapping
function getUSRetailers(analysis: any, productName: string, basePrice: number, symbol: string) {
  const retailers: any[] = [];
  const searchQuery = encodeURIComponent(productName.replace(/\s+/g, ' ').trim());
  
  // Safety check for NaN
  if (isNaN(basePrice)) {
    console.warn('NaN basePrice in getUSRetailers, using fallback value');
    basePrice = 50;
  }
  
  // Always include Amazon as primary
  retailers.push({
    name: "Amazon",
    price: `${symbol}${Math.round(basePrice * (0.95 + Math.random() * 0.1))}`,
    inStock: Math.random() > 0.05,
    url: `https://www.amazon.com/s?k=${searchQuery}&ref=nb_sb_noss`
  });

  // Category-specific retailers
  if (analysis.isElectronics) {
    retailers.push({
      name: "Best Buy",
      price: `${symbol}${Math.round(basePrice * (1.05 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.15,
      url: `https://www.bestbuy.com/site/searchpage.jsp?st=${searchQuery}`
    });
    retailers.push({
      name: "B&H Photo",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.bhphotovideo.com/c/search?Ntt=${searchQuery}`
    });
  }
  
  if (analysis.isFashion) {
    retailers.push({
      name: "Nordstrom",
      price: `${symbol}${Math.round(basePrice * (1.2 + Math.random() * 0.2))}`,
      inStock: Math.random() > 0.15,
      url: `https://www.nordstrom.com/sr?keyword=${searchQuery}`
    });
    retailers.push({
      name: "Macy's",
      price: `${symbol}${Math.round(basePrice * (0.9 + Math.random() * 0.2))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.macys.com/shop/search?keyword=${searchQuery}`
    });
  }
  
  if (analysis.isBeauty) {
    retailers.push({
      name: "Sephora",
      price: `${symbol}${Math.round(basePrice * (1.1 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.sephora.com/search?keyword=${searchQuery}`
    });
    retailers.push({
      name: "Ulta Beauty",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.15,
      url: `https://www.ulta.com/search?query=${searchQuery}`
    });
  }
  
  if (analysis.isBooks) {
    retailers.push({
      name: "Barnes & Noble",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.05))}`,
      inStock: Math.random() > 0.05,
      url: `https://www.barnesandnoble.com/s/${searchQuery}`
    });
  }
  
  if (analysis.isArt) {
    retailers.push({
      name: "Blick Art Materials",
      price: `${symbol}${Math.round(basePrice * (1.0 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.05,
      url: `https://www.dickblick.com/search/?q=${searchQuery}`
    });
    retailers.push({
      name: "Michaels",
      price: `${symbol}${Math.round(basePrice * (0.85 + Math.random() * 0.1))}`,
      inStock: Math.random() > 0.1,
      url: `https://www.michaels.com/search?q=${searchQuery}`
    });
  }

  // Add Target as general retailer
  retailers.push({
    name: "Target",
    price: `${symbol}${Math.round(basePrice * (0.9 + Math.random() * 0.1))}`,
    inStock: Math.random() > 0.15,
    url: `https://www.target.com/s?searchTerm=${searchQuery}`
  });

  return retailers;
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
1. A creative, SPECIFIC gift name with exact brands/models when possible (e.g. "Nike Elite All-Court Basketball", "Apple AirPods Pro", "Winsor & Newton Cotman Watercolor Set", "Stanley Adventure Quencher Tumbler", "Lululemon Align Leggings")
2. A detailed description (2-3 sentences) explaining why it's perfect for them
3. An estimated price range within budget  
4. A match percentage (how well it fits their profile)
5. Which specific traits/interests it matches
6. A realistic product search term for images
7. A specific product search term for shopping (use exact product names, model numbers, or specific descriptive terms)

IMPORTANT: Use specific, well-known product names and brands. Examples of good specific names:
- "Nike Elite All-Court Basketball" (not just "basketball")
- "Apple AirPods Pro 2nd Generation" (not just "wireless earbuds") 
- "Instant Pot Duo 7-in-1 Pressure Cooker" (not just "pressure cooker")
- "Lululemon Align High-Rise Leggings" (not just "yoga pants")
- "Stanley Adventure Quencher Tumbler 40oz" (not just "water bottle")
- "Nintendo Switch OLED Model" (not just "gaming console")
- "Winsor & Newton Cotman Watercolor Set" (not just "paint set")

Consider their personality and interests deeply. Be creative and think of unique, thoughtful gifts that someone with these specific traits would genuinely appreciate. Use specific product names and models for better shopping results.

Respond in JSON format with this structure:
{
  "recommendations": [
    {
      "name": "Specific Brand Product Name with Model",
      "description": "Why this gift is perfect for them...",
      "price": "${symbol}XX - ${symbol}XX",
      "matchPercentage": 85,
      "matchingTraits": ["trait1", "trait2"],
      "imageSearchTerm": "specific product name",
      "shopSearchTerm": "Exact Brand Model Product Name for shopping"
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
      console.log(`[DIAGNOSTIC] AI recommendation received: "${rec.name}"`);
      // Generate realistic shop pricing
      const basePrice = Math.random() * (budget * 0.8) + (budget * 0.2);
      
      // Use specific search term if provided, otherwise fall back to product name
      const searchTerm = rec.shopSearchTerm || rec.name || "gift";
      
      // Generate reliable image URL using new priority system
      const imageKeywords = rec.imageSearchTerm || rec.name || 'gift';
      let imageUrl: string;
      let priceRange: string;

      // Generate shops first (needed for image extraction)
      const shops = await generateShops(basePrice, budget, currency, rec.name || 'gift', country);
      console.log(`[DIAGNOSTIC] Generated ${shops.length} shops. First URL: ${shops[0]?.url}`);

      // PRIORITY 1: Try Amazon Affiliate API first
      console.log(`[DIAGNOSTIC] Priority 1: Trying Amazon Affiliate API for "${rec.name}"`);
      let amazonImage: string | null = null;
      try {
        amazonImage = await getAmazonProductImage(rec.name || '', basePrice * 1.5); // Allow 50% over base price
        if (amazonImage) {
          console.log(`[DIAGNOSTIC] ✅ Amazon API returned image: ${amazonImage}`);
        } else {
          console.log(`[DIAGNOSTIC] ❌ Amazon API returned no results`);
          
          // Fallback: Try to extract Amazon image from shop URLs
          for (const shop of shops) {
            if (shop.url.includes('amazon.com') && !shop.url.includes('/s?k=')) {
              amazonImage = getAmazonImageFromUrl(shop.url);
              if (amazonImage) {
                console.log(`[DIAGNOSTIC] ✅ Extracted Amazon image from URL: ${amazonImage}`);
                break;
              }
            }
          }
        }
      } catch (error) {
        console.log(`[DIAGNOSTIC] ❌ Amazon API error: ${error instanceof Error ? error.message : String(error)}`);
      }

      if (amazonImage) {
        imageUrl = amazonImage;
        console.log(`[DIAGNOSTIC] Using Amazon image: ${imageUrl}`);
      } else {
        // PRIORITY 2: Try metadata extractor from product URLs
        console.log(`[DIAGNOSTIC] Priority 2: Trying metadata extraction from product URLs`);
        let extractedImage: string | null = null;
        if (shops.length > 0) {
          // Try to extract from direct product URLs (skip search URLs)
          for (const shop of shops) {
            if (!shop.url.includes('/s?k=') && !shop.url.includes('/search')) {
              try {
                extractedImage = await extractBestProductImage(shop.url);
                if (extractedImage) {
                  console.log(`[DIAGNOSTIC] ✅ Extracted image from ${shop.name}: ${extractedImage}`);
                  break;
                }
              } catch (error) {
                console.log(`[DIAGNOSTIC] ❌ Image extraction failed for ${shop.name}: ${error instanceof Error ? error.message : String(error)}`);
              }
            }
          }
        }

        if (extractedImage) {
          imageUrl = extractedImage;
          console.log(`[DIAGNOSTIC] Using extracted product image: ${imageUrl}`);
        } else {
          // PRIORITY 3: Try database match
          console.log(`[DIAGNOSTIC] Priority 3: Checking product database`);
          const productKey = findBestProductMatch(rec.name || '');
          if (productKey && PRODUCT_DATABASE[productKey]) {
            const product = PRODUCT_DATABASE[productKey];
            console.log(`[DIAGNOSTIC] ✅ Found DB match. Key: "${productKey}", Name: "${product.name}"`);
            imageUrl = product.image;
            console.log(`[DIAGNOSTIC] Using DB image: ${imageUrl}`);
          } else {
            // PRIORITY 4: Generic fallback images
            console.log(`[DIAGNOSTIC] Priority 4: Using generic fallback images`);
            try {
              imageUrl = await getProductImage(imageKeywords, rec.description);
              console.log(`[DIAGNOSTIC] ✅ Generic image service returned: ${imageUrl}`);
            } catch (error) {
              console.error(`[DIAGNOSTIC] ❌ Generic image service failed:`, error);
              // Ultimate fallback to a reliable generic image
              imageUrl = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300';
              console.log(`[DIAGNOSTIC] Using ultimate fallback image: ${imageUrl}`);
            }
          }
        }
      }

      // Set price range (prefer database if we have a match, otherwise calculate)
      const productKey = findBestProductMatch(rec.name || '');
      if (productKey && PRODUCT_DATABASE[productKey]) {
        const product = PRODUCT_DATABASE[productKey];
        priceRange = `${symbol}${product.price_range[0]} - ${symbol}${product.price_range[1]}`;
        console.log(`[DIAGNOSTIC] Using DB price range: ${priceRange}`);
      } else {
        priceRange = rec.price || `${symbol}${Math.round(basePrice * 0.8)} - ${symbol}${Math.round(basePrice * 1.2)}`;
        console.log(`[DIAGNOSTIC] Using calculated price range: ${priceRange}`);
      }

    recommendations.push({
      name: rec.name || "Personalized Gift",
      description: rec.description || "A thoughtful gift recommendation.",
      price: priceRange,
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

          const giftShops = await generateShops(gift.basePrice, budget, currency, gift.name, country);

          recommendations.push({
            name: gift.name,
            description: enhancedDescription,
            price: priceRange,
            matchPercentage,
            matchingTraits: gift.matchingTraits.filter(t => personalityTraits.includes(t)),
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
    const priceRange = `${symbol}${Math.round(randomGift.basePrice * 0.8)} - ${symbol}${Math.round(randomGift.basePrice * 1.2)}`;
    const randomGiftShops = await generateShops(randomGift.basePrice, budget, currency, randomGift.name, country);
    
    recommendations.push({
      name: randomGift.name,
      description: randomGift.description,
      price: priceRange,
      matchPercentage,
      matchingTraits: randomGift.matchingTraits.filter(t => personalityTraits.includes(t)),
      image: randomGift.image,
      shops: randomGiftShops
    });
  }

  return recommendations;
}
