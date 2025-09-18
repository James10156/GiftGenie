import OpenAI from "openai";
import type { GiftRecommendation } from "@shared/schema";
import { getProductImage } from "./imageService.ts";
import { generateRealProductUrls, findBestProductMatch, PRODUCT_DATABASE } from "./productDatabase.ts";
import { getProductImageFromGoogle } from './googleImageScraper.ts';

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
// Enhanced shopping platform detection and URL generation with price range alignment
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
  
  // Use the existing shop generation but override prices to fit range
  const shops = await generateShops(basePrice, maxPrice * 1.5, currency, productName, country);
  
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
Budget: ${symbol}${budget} (MAXIMUM - do not exceed this amount)
Currency: ${currency}${additionalContext}

CRITICAL: All gift prices must be within the budget of ${symbol}${budget}. Do not recommend anything that costs more than this amount.

For each gift recommendation, provide:
1. A creative, SPECIFIC gift name with exact brands/models when possible (e.g. "Nike Elite All-Court Basketball", "Apple AirPods Pro", "Winsor & Newton Cotman Watercolor Set", "Stanley Adventure Quencher Tumbler", "Lululemon Align Leggings")
2. A detailed description (2-3 sentences) explaining why it's perfect for them
3. An estimated price range WITHIN the ${symbol}${budget} budget (never exceed this amount)
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
        // Database match found - use database price range
        const product = PRODUCT_DATABASE[productKey];
        priceRange = `${symbol}${product.price_range[0]} - ${symbol}${product.price_range[1]}`;
        // Update basePrice to align with database pricing for shop generation
        basePrice = (product.price_range[0] + product.price_range[1]) / 2;
      }

      // If we don't have a valid imageUrl yet (either no database match or database validation failed), use simplified priority system
      if (!imageUrl || imageUrl.trim() === "") {
        
        // PRIORITY 1: Google Images scraper (primary method in dev)
        try {
          const googleImage = await getProductImageFromGoogle(rec.name || '', rec.description);
          if (googleImage) {
            imageUrl = googleImage;
          } else {
            
            // PRIORITY 2: Generic fallback images (ultimate fallback)
            try {
              imageUrl = await getProductImage(imageKeywords, rec.description);
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
            imageUrl = await getProductImage(imageKeywords, rec.description);
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
