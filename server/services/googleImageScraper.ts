import fetch from 'node-fetch';

/**
 * Google Images scraper - extracts the most relevant image from Google Images search
 * This serves as a penultimate fallback before generic Unsplash images
 */
export async function getGoogleImageResult(searchTerm: string): Promise<string | null> {
  try {
    console.log(`[GOOGLE_IMAGES] Searching for: "${searchTerm}"`);
    
    // Clean and encode the search term
    const cleanSearchTerm = searchTerm.replace(/[^\w\s-]/g, '').trim();
    const encodedTerm = encodeURIComponent(cleanSearchTerm);
    
    // Use Google Images search URL
    const searchUrl = `https://www.google.com/search?q=${encodedTerm}&tbm=isch&tbs=isz:m`;
    
    console.log(`[GOOGLE_IMAGES] Fetching: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      console.log(`[GOOGLE_IMAGES] HTTP error: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Extract image URLs from Google Images results
    // Look for various patterns that Google uses for image data
    const imagePatterns = [
      // Pattern 1: Direct image URLs in data attributes
      /"(https:\/\/[^"]*\.(?:jpg|jpeg|png|webp|gif))[^"]*"/gi,
      // Pattern 2: Encoded image URLs in JavaScript
      /\["(https:\/\/[^"]*\.(?:jpg|jpeg|png|webp|gif)[^"]*)",\d+,\d+\]/gi,
      // Pattern 3: Base64 or escaped URLs
      /data-src="([^"]*\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/gi,
    ];

    const foundImages: string[] = [];
    
    for (const pattern of imagePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && foundImages.length < 10) {
        let imageUrl = match[1];
        
        // Decode URL if needed
        try {
          imageUrl = decodeURIComponent(imageUrl);
        } catch (e) {
          // Continue if decoding fails
        }
        
        // Filter out unwanted images
        if (imageUrl && 
            !imageUrl.includes('data:') && 
            !imageUrl.includes('base64') &&
            !imageUrl.includes('google.com') &&
            !imageUrl.includes('gstatic.com') &&
            !imageUrl.includes('googleusercontent.com') &&
            imageUrl.length > 20 &&
            (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') || imageUrl.includes('.png') || imageUrl.includes('.webp'))) {
          
          foundImages.push(imageUrl);
        }
      }
    }

    // Remove duplicates and get the first few results
    const uniqueImages = Array.from(new Set(foundImages));
    
    console.log(`[GOOGLE_IMAGES] Found ${uniqueImages.length} potential images`);
    
    // Try to validate and return the first working image
    for (const imageUrl of uniqueImages.slice(0, 5)) {
      try {
        console.log(`[GOOGLE_IMAGES] Testing image: ${imageUrl.substring(0, 100)}...`);
        const imageResponse = await fetch(imageUrl, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (imageResponse.ok && imageResponse.headers.get('content-type')?.startsWith('image/')) {
          console.log(`[GOOGLE_IMAGES] ✅ Found valid image: ${imageUrl}`);
          return imageUrl;
        }
      } catch (error) {
        // Continue to next image if this one fails
        continue;
      }
    }

    console.log(`[GOOGLE_IMAGES] ❌ No valid images found for: "${searchTerm}"`);
    return null;

  } catch (error) {
    console.error(`[GOOGLE_IMAGES] Error searching for "${searchTerm}":`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Enhanced product-specific Google Images search with better search terms
 */
export async function getProductImageFromGoogle(productName: string, productDescription?: string): Promise<string | null> {
  // Try different search strategies
  const searchStrategies = [
    // Strategy 1: Product name + "product"
    `${productName} product`,
    // Strategy 2: Product name + "buy"
    `${productName} buy`,
    // Strategy 3: Just the product name
    productName,
    // Strategy 4: If description is available, use key terms
    productDescription ? extractKeyTerms(productName, productDescription) : null
  ].filter(Boolean) as string[];

  for (const searchTerm of searchStrategies) {
    console.log(`[GOOGLE_IMAGES] Trying search strategy: "${searchTerm}"`);
    const result = await getGoogleImageResult(searchTerm);
    if (result) {
      return result;
    }
    
    // Small delay between searches to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return null;
}

/**
 * Extract key terms from product name and description for better search
 */
function extractKeyTerms(name: string, description?: string): string {
  const text = `${name} ${description || ''}`.toLowerCase();
  
  // Extract brand names (often capitalized words)
  const brandPattern = /\b[A-Z][a-z]+\b/g;
  const brands = name.match(brandPattern) || [];
  
  // Extract key product words
  const productWords = text.match(/\b(?:pro|max|ultra|premium|elite|standard|classic|edition|series|model|men|women|kids|adult|large|medium|small|xl|xxl)\b/g) || [];
  
  // Combine the most relevant terms
  const keyTerms = [...brands.slice(0, 2), ...productWords.slice(0, 3)].join(' ');
  
  return keyTerms || name;
}
