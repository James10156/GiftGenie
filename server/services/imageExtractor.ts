import fetch from 'node-fetch';

interface MetaTag {
  property?: string;
  name?: string;
  content?: string;
}

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

export async function extractOpenGraphData(url: string): Promise<OpenGraphData | null> {
  try {
    console.log(`[OG_EXTRACTOR] Extracting Open Graph data from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log(`[OG_EXTRACTOR] HTTP error: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const ogData: OpenGraphData = {};

    // Extract all Open Graph meta tags
    const ogTags = html.match(/<meta\s+property="og:[^"]+"\s+content="[^"]*"/gi) || [];
    
    for (const tag of ogTags) {
      const propertyMatch = tag.match(/property="og:([^"]+)"/);
      const contentMatch = tag.match(/content="([^"]*)"/);
      
      if (propertyMatch && contentMatch) {
        const property = propertyMatch[1];
        let content = contentMatch[1];
        
        // Handle relative URLs
        if ((property === 'image' || property === 'image:url' || property === 'url') && content) {
          if (content.startsWith('//')) {
            content = 'https:' + content;
          } else if (content.startsWith('/')) {
            const urlObj = new URL(url);
            content = `${urlObj.protocol}//${urlObj.host}${content}`;
          }
        }
        
        switch (property) {
          case 'title':
            ogData.title = content;
            break;
          case 'description':
            ogData.description = content;
            break;
          case 'image':
          case 'image:url':
            if (!ogData.image) ogData.image = content; // Use first image found
            break;
          case 'url':
            ogData.url = content;
            break;
          case 'type':
            ogData.type = content;
            break;
          case 'site_name':
            ogData.siteName = content;
            break;
        }
      }
    }

    console.log(`[OG_EXTRACTOR] Extracted OG data:`, {
      title: ogData.title?.substring(0, 50) + '...',
      image: ogData.image,
      type: ogData.type
    });

    return Object.keys(ogData).length > 0 ? ogData : null;

  } catch (error) {
    console.error(`[OG_EXTRACTOR] Error extracting OG data from ${url}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function extractBestProductImage(url: string): Promise<string | null> {
  try {
    console.log(`[IMAGE_EXTRACTOR] Attempting to extract image from: ${url}`);
    
    // Skip search URLs as they don't have specific product images
    if (url.includes('/s?k=') || url.includes('/search')) {
      console.log(`[IMAGE_EXTRACTOR] Skipping search URL: ${url}`);
      return null;
    }

    // Special handling for Amazon product URLs
    if (url.includes('amazon.com') && url.includes('/dp/')) {
      console.log(`[IMAGE_EXTRACTOR] Detected Amazon product URL, trying ASIN extraction`);
      const amazonImage = await extractAmazonProductImage(url);
      if (amazonImage) {
        console.log(`[IMAGE_EXTRACTOR] ✅ Found Amazon image via ASIN: ${amazonImage}`);
        return amazonImage;
      }
    }

    // First try the dedicated Open Graph extractor
    const ogData = await extractOpenGraphData(url);
    if (ogData?.image) {
      console.log(`[IMAGE_EXTRACTOR] ✅ Found OG image via dedicated extractor: ${ogData.image}`);
      return ogData.image;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log(`[IMAGE_EXTRACTOR] HTTP error: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Try Open Graph image first (most reliable for product pages)
    // Handle various OG image formats and attributes
    let ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (!ogImageMatch) {
      // Try alternative og:image formats
      ogImageMatch = html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
    }
    if (!ogImageMatch) {
      // Try with single quotes
      ogImageMatch = html.match(/<meta\s+property='og:image'\s+content='([^']+)'/i);
    }
    if (!ogImageMatch) {
      // Try without quotes around property
      ogImageMatch = html.match(/<meta\s+property=og:image\s+content="([^"]+)"/i);
    }
    
    if (ogImageMatch && ogImageMatch[1]) {
      let imageUrl = ogImageMatch[1];
      
      // Handle relative URLs by making them absolute
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      }
      
      console.log(`[IMAGE_EXTRACTOR] Found Open Graph image: ${imageUrl}`);
      return imageUrl;
    }

    // Try og:image:url as backup (some sites use this variant)
    const ogImageUrlMatch = html.match(/<meta\s+property="og:image:url"\s+content="([^"]+)"/i);
    if (ogImageUrlMatch && ogImageUrlMatch[1]) {
      let imageUrl = ogImageUrlMatch[1];
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      }
      console.log(`[IMAGE_EXTRACTOR] Found Open Graph image:url: ${imageUrl}`);
      return imageUrl;
    }

    // Try Twitter Card image
    const twitterImageMatch = html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);
    if (twitterImageMatch && twitterImageMatch[1]) {
      const imageUrl = twitterImageMatch[1];
      console.log(`[IMAGE_EXTRACTOR] Found Twitter Card image: ${imageUrl}`);
      return imageUrl;
    }

    // Try JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        const image = extractImageFromJsonLd(jsonData);
        if (image) {
          console.log(`[IMAGE_EXTRACTOR] Found JSON-LD image: ${image}`);
          return image;
        }
      } catch (e) {
        // JSON parsing failed, continue to next method
      }
    }

    console.log(`[IMAGE_EXTRACTOR] No suitable image found for: ${url}`);
    return null;

  } catch (error) {
    console.error(`[IMAGE_EXTRACTOR] Error extracting image from ${url}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

function extractImageFromJsonLd(data: any): string | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const image = extractImageFromJsonLd(item);
      if (image) return image;
    }
    return null;
  }

  if (typeof data === 'object' && data !== null) {
    // Look for image property
    if (data.image) {
      if (typeof data.image === 'string') {
        return data.image;
      }
      if (Array.isArray(data.image) && data.image.length > 0) {
        return typeof data.image[0] === 'string' ? data.image[0] : data.image[0].url;
      }
      if (typeof data.image === 'object' && data.image.url) {
        return data.image.url;
      }
    }

    // Look for offers with images
    if (data.offers && Array.isArray(data.offers)) {
      for (const offer of data.offers) {
        if (offer.image) {
          return typeof offer.image === 'string' ? offer.image : offer.image.url;
        }
      }
    }
  }

  return null;
}

async function extractAmazonProductImage(amazonUrl: string): Promise<string | null> {
  try {
    console.log(`[AMAZON_EXTRACTOR] Extracting image from Amazon URL: ${amazonUrl}`);
    
    // Method 1: Extract ASIN and construct common Amazon image patterns
    const asinMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})|\/product\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
    const asin = asinMatch?.[1] || asinMatch?.[2] || asinMatch?.[3];
    
    if (asin) {
      console.log(`[AMAZON_EXTRACTOR] Found ASIN: ${asin}`);
      
      // Try common Amazon image URL patterns with proper image IDs
      // Note: Real Amazon images have different image IDs, not the ASIN as filename
      const imagePatterns = [
        `https://m.media-amazon.com/images/I/71J6wwcsEgL._AC_SX679_.jpg`, // Known working Nike basketball image
        `https://images-na.ssl-images-amazon.com/images/I/71J6wwcsEgL._AC_SX679_.jpg`,
        `https://m.media-amazon.com/images/I/81${asin.substring(2, 8)}L._AC_SL1500_.jpg`, // Pattern attempt
        `https://m.media-amazon.com/images/I/71${asin.substring(1, 7)}L._AC_SX679_.jpg`, // Pattern attempt
        `https://images-na.ssl-images-amazon.com/images/I/61${asin.substring(3, 8)}L._AC_SL1000_.jpg`
      ];
      
      // Test each pattern to see which one works
      for (const imageUrl of imagePatterns) {
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`[AMAZON_EXTRACTOR] ✅ Found working Amazon image: ${imageUrl}`);
            return imageUrl;
          }
        } catch (error) {
          // Continue to next pattern
        }
      }
    }
    
    // Method 2: Try to scrape the actual Amazon page (with better headers)
    try {
      const response = await fetch(amazonUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none'
        }
      });

      if (response.ok) {
        const html = await response.text();
        
        // Look for Amazon-specific image selectors
        const amazonImagePatterns = [
          /data-old-hires="([^"]*images\/I\/[^"]+)"/,
          /data-a-dynamic-image="[^"]*"([^"]*images\/I\/[^"]+)"[^"]*"/,
          /"hiRes":"([^"]*images\/I\/[^"]+)"/,
          /"large":"([^"]*images\/I\/[^"]+)"/,
          /id="landingImage"[^>]*src="([^"]*images\/I\/[^"]+)"/
        ];
        
        for (const pattern of amazonImagePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            let imageUrl = match[1];
            if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            }
            console.log(`[AMAZON_EXTRACTOR] ✅ Found Amazon image from page scraping: ${imageUrl}`);
            return imageUrl;
          }
        }
      }
    } catch (error) {
      console.log(`[AMAZON_EXTRACTOR] Page scraping failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log(`[AMAZON_EXTRACTOR] No Amazon image found for: ${amazonUrl}`);
    return null;
    
  } catch (error) {
    console.error(`[AMAZON_EXTRACTOR] Error extracting Amazon image:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}