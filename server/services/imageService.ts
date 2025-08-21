interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
}

interface UnsplashResponse {
  results: UnsplashImage[];
}

// Fallback images - high quality, specific product images
const FALLBACK_IMAGES: Record<string, string> = {
  // Electronics & Tech
  'headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
  'laptop': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
  'phone': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
  'tablet': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
  'camera': 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400',
  'smartwatch': 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400',
  'bluetooth speaker': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
  'gaming mouse': 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400',
  'keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
  
  // Fashion & Accessories
  'watch': 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400',
  'sunglasses': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
  'bag': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
  'wallet': 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
  'jewelry': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
  'necklace': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
  'bracelet': 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400',
  'earrings': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
  
  // Home & Living
  'candle': 'https://images.unsplash.com/photo-1602974508525-dd80dc41b4be?w=400',
  'plant': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
  'mug': 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400',
  'pillow': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
  'blanket': 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400',
  'lamp': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  'vase': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  
  // Books & Media
  'book': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  'notebook': 'https://images.unsplash.com/photo-1517971129774-3b2e64e60a8e?w=400',
  'pen': 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400',
  
  // Sports & Fitness
  'yoga mat': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
  'water bottle': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
  'dumbbells': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
  'running shoes': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
  
  // Beauty & Care
  'perfume': 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
  'skincare': 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400',
  'makeup': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
  
  // Food & Drinks
  'coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
  'tea': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400',
  'wine': 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400',
  'chocolate': 'https://images.unsplash.com/photo-1549007908-b80825ae1bab?w=400',
  
  // Generic fallback
  'gift': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
  'present': 'https://images.unsplash.com/photo-1607884863050-f6b8c02b3342?w=400'
};

export async function getProductImage(productName: string, productDescription?: string): Promise<string> {
  try {
    // Clean and prepare search terms
    const searchTerms = cleanProductName(productName);
    const query = encodeURIComponent(searchTerms);
    
    // Try Unsplash API first (free tier)
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${query}&per_page=5&orientation=squarish`;
    
    const response = await fetch(unsplashUrl, {
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY || 'your-unsplash-access-key'}`
      }
    });

    if (response.ok) {
      const data: UnsplashResponse = await response.json();
      if (data.results && data.results.length > 0) {
        // Return the best quality image that's not too large
        return data.results[0].urls.regular;
      }
    }
  } catch (error) {
    console.error('Error fetching from Unsplash:', error);
  }

  // Fallback to our curated images
  return getFallbackImage(productName, productDescription);
}

function cleanProductName(productName: string): string {
  // Remove common prefixes/suffixes and clean the name for better search
  let cleaned = productName.toLowerCase()
    .replace(/^(a |an |the )/i, '')
    .replace(/ (for .+|with .+|in .+)$/i, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // If it's a long description, take key terms
  const words = cleaned.split(' ');
  if (words.length > 3) {
    // Take the first 2-3 most meaningful words
    cleaned = words.slice(0, 3).join(' ');
  }
  
  return cleaned;
}

function getFallbackImage(productName: string, productDescription?: string): string {
  const searchText = `${productName} ${productDescription || ''}`.toLowerCase();
  
  // Try to match against our fallback categories
  for (const [category, imageUrl] of Object.entries(FALLBACK_IMAGES)) {
    if (searchText.includes(category)) {
      return imageUrl;
    }
  }
  
  // Category-based matching for common product types
  if (searchText.match(/\b(phone|mobile|smartphone|iphone|android)\b/)) return FALLBACK_IMAGES['phone'];
  if (searchText.match(/\b(laptop|computer|macbook|pc)\b/)) return FALLBACK_IMAGES['laptop'];
  if (searchText.match(/\b(headphone|earphone|airpods|earbud)\b/)) return FALLBACK_IMAGES['headphones'];
  if (searchText.match(/\b(watch|timepiece)\b/)) return FALLBACK_IMAGES['watch'];
  if (searchText.match(/\b(bag|purse|backpack|handbag)\b/)) return FALLBACK_IMAGES['bag'];
  if (searchText.match(/\b(book|novel|journal|diary)\b/)) return FALLBACK_IMAGES['book'];
  if (searchText.match(/\b(plant|flower|succulent|garden)\b/)) return FALLBACK_IMAGES['plant'];
  if (searchText.match(/\b(candle|scented|aromatherapy)\b/)) return FALLBACK_IMAGES['candle'];
  if (searchText.match(/\b(perfume|fragrance|cologne)\b/)) return FALLBACK_IMAGES['perfume'];
  if (searchText.match(/\b(coffee|espresso|latte|brew)\b/)) return FALLBACK_IMAGES['coffee'];
  if (searchText.match(/\b(wine|alcohol|bottle|drink)\b/)) return FALLBACK_IMAGES['wine'];
  if (searchText.match(/\b(chocolate|candy|sweet|dessert)\b/)) return FALLBACK_IMAGES['chocolate'];
  if (searchText.match(/\b(jewelry|ring|pendant|charm)\b/)) return FALLBACK_IMAGES['jewelry'];
  if (searchText.match(/\b(shoe|sneaker|boot|footwear)\b/)) return FALLBACK_IMAGES['running shoes'];
  if (searchText.match(/\b(camera|photo|photography)\b/)) return FALLBACK_IMAGES['camera'];
  if (searchText.match(/\b(speaker|audio|music|sound)\b/)) return FALLBACK_IMAGES['bluetooth speaker'];
  
  // Default fallback
  return FALLBACK_IMAGES['gift'];
}

// Alternative image sources if Unsplash fails
export async function getAlternativeProductImage(productName: string): Promise<string> {
  try {
    // Try Pexels API as backup (also free)
    const query = encodeURIComponent(cleanProductName(productName));
    const pexelsUrl = `https://api.pexels.com/v1/search?query=${query}&per_page=5&orientation=square`;
    
    const response = await fetch(pexelsUrl, {
      headers: {
        'Authorization': process.env.PEXELS_API_KEY || 'your-pexels-api-key'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        return data.photos[0].src.medium;
      }
    }
  } catch (error) {
    console.error('Error fetching from Pexels:', error);
  }

  return getFallbackImage(productName);
}
