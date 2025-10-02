import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Avatar definitions (same as in the component)
const avatarDefinitions = {
  cartoon: [
    {
      id: 'cartoon-1',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4&clothingColor=262e33',
      filename: 'cartoon-felix',
      alt: 'Cute cartoon girl with ponytails'
    },
    {
      id: 'cartoon-2',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede&clothingColor=3c4f5c',
      filename: 'cartoon-aneka',
      alt: 'Friendly cartoon boy with glasses'
    },
    {
      id: 'cartoon-3',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=ffd93d&clothingColor=65c9ff',
      filename: 'cartoon-luna',
      alt: 'Cartoon girl with curly hair'
    },
    {
      id: 'cartoon-4',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=ffdfbf&clothingColor=ff488e',
      filename: 'cartoon-max',
      alt: 'Cartoon boy with cap'
    },
    {
      id: 'cartoon-5',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&backgroundColor=d1d4f9&clothingColor=74d680',
      filename: 'cartoon-zoe',
      alt: 'Cartoon girl with braids'
    },
    {
      id: 'cartoon-6',
      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=ffd1dc&clothingColor=fd9644',
      filename: 'cartoon-oliver',
      alt: 'Cartoon boy with hoodie'
    }
  ],
  realistic: [
    {
      id: 'realistic-1',
      url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=b6e3f4',
      filename: 'realistic-sarah',
      alt: 'Professional woman headshot'
    },
    {
      id: 'realistic-2',
      url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Michael&backgroundColor=c0aede',
      filename: 'realistic-michael',
      alt: 'Professional man headshot'
    },
    {
      id: 'realistic-3',
      url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Emma&backgroundColor=ffd93d',
      filename: 'realistic-emma',
      alt: 'Young woman smiling'
    },
    {
      id: 'realistic-4',
      url: 'https://api.dicebear.com/7.x/notionists/svg?seed=David&backgroundColor=ffdfbf',
      filename: 'realistic-david',
      alt: 'Young man casual'
    },
    {
      id: 'realistic-5',
      url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Jessica&backgroundColor=d1d4f9',
      filename: 'realistic-jessica',
      alt: 'Woman with glasses'
    },
    {
      id: 'realistic-6',
      url: 'https://api.dicebear.com/7.x/notionists/svg?seed=James&backgroundColor=ffd1dc',
      filename: 'realistic-james',
      alt: 'Man with beard'
    }
  ],
  popCulture: [
    {
      id: 'pop-1',
      url: 'https://api.dicebear.com/7.x/bottts/svg?seed=superhero&backgroundColor=b6e3f4&colors=ffdfbf,ffd93d,65c9ff',
      filename: 'pop-superhero',
      alt: 'Robot superhero avatar'
    },
    {
      id: 'pop-2',
      url: 'https://api.dicebear.com/7.x/personas/svg?seed=anime&backgroundColor=c0aede&colors=ff488e,74d680',
      filename: 'pop-anime',
      alt: 'Anime-style character'
    },
    {
      id: 'pop-3',
      url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=retro&backgroundColor=ffd93d&colors=262e33,3c4f5c',
      filename: 'pop-retro',
      alt: 'Pixel art character'
    },
    {
      id: 'pop-4',
      url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=party&backgroundColor=ffdfbf&colors=fd9644,ff488e',
      filename: 'pop-party',
      alt: 'Fun emoji style'
    },
    {
      id: 'pop-5',
      url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=fantasy&backgroundColor=d1d4f9&colors=74d680,65c9ff',
      filename: 'pop-fantasy',
      alt: 'Fantasy adventurer'
    },
    {
      id: 'pop-6',
      url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=happy&backgroundColor=ffd1dc&colors=ffd93d,ff488e',
      filename: 'pop-happy',
      alt: 'Happy character'
    }
  ]
};

async function downloadAndUploadAvatar(avatar, category) {
  try {
    console.log(`Downloading ${avatar.filename}...`);
    
    // Download the SVG
    const response = await fetch(avatar.url);
    if (!response.ok) {
      throw new Error(`Failed to download ${avatar.filename}: ${response.statusText}`);
    }
    
    const svgContent = await response.text();
    
    // Save temporarily
    const tempPath = path.join(__dirname, `temp_${avatar.filename}.svg`);
    fs.writeFileSync(tempPath, svgContent);
    
    console.log(`Uploading ${avatar.filename} to Cloudinary...`);
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(tempPath, {
      folder: 'giftgenie/profile-gallery',
      public_id: avatar.filename,
      resource_type: 'image',
      format: 'png', // Convert SVG to PNG for better compatibility
      transformation: [
        { width: 150, height: 150, crop: 'fill' }
      ]
    });
    
    // Clean up temp file
    fs.unlinkSync(tempPath);
    
    console.log(`✅ Uploaded ${avatar.filename}: ${result.secure_url}`);
    
    return {
      id: avatar.id,
      url: result.secure_url,
      filename: avatar.filename
    };
    
  } catch (error) {
    console.error(`❌ Error uploading ${avatar.filename}:`, error.message);
    return null;
  }
}

async function uploadAllAvatars() {
  console.log('Starting avatar upload to Cloudinary...\n');
  
  const results = {
    cartoon: [],
    realistic: [],
    popCulture: []
  };
  
  // Upload each category
  for (const [category, avatars] of Object.entries(avatarDefinitions)) {
    console.log(`\n📂 Uploading ${category} avatars...`);
    
    for (const avatar of avatars) {
      const result = await downloadAndUploadAvatar(avatar, category);
      if (result) {
        results[category].push(result);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n🎉 Upload complete! Here are your new URLs:\n');
  
  // Generate the updated gallery object
  const galleryObject = {
    cartoon: results.cartoon.map(item => ({
      id: item.id,
      url: item.url,
      alt: avatarDefinitions.cartoon.find(a => a.id === item.id)?.alt || item.filename
    })),
    realistic: results.realistic.map(item => ({
      id: item.id,
      url: item.url,
      alt: avatarDefinitions.realistic.find(a => a.id === item.id)?.alt || item.filename
    })),
    popCulture: results.popCulture.map(item => ({
      id: item.id,
      url: item.url,
      alt: avatarDefinitions.popCulture.find(a => a.id === item.id)?.alt || item.filename
    }))
  };
  
  // Save the results to a file
  const outputPath = path.join(__dirname, 'cloudinary-gallery-urls.json');
  fs.writeFileSync(outputPath, JSON.stringify(galleryObject, null, 2));
  
  console.log(`📄 Gallery object saved to: ${outputPath}`);
  console.log('\nYou can now copy this object to replace PROFILE_PICTURE_GALLERY in your component!');
}

// Check if Cloudinary is configured
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Cloudinary environment variables not found!');
  console.log('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
  process.exit(1);
}

// Run the upload
uploadAllAvatars().catch(console.error);