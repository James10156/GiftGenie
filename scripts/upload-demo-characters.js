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

// Demo character portrait definitions using DiceBear avatars
const characterPortraits = [
  {
    name: 'sherlock-holmes',
    description: 'Sherlock Holmes - Victorian detective',
    url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=sherlock&backgroundColor=b6e3f4'
  },
  {
    name: 'snow-white',
    description: 'Snow White - Fair maiden',
    url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=snowwhite&backgroundColor=fef3c7'
  },
  {
    name: 'tarzan',
    description: 'Tarzan - Jungle lord',
    url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=tarzan&backgroundColor=dcfce7'
  },
  {
    name: 'robin-hood',
    description: 'Robin Hood - Medieval archer',
    url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=robinhood&backgroundColor=dcfce7'
  },
  {
    name: 'sleeping-beauty',
    description: 'Sleeping Beauty - Elegant princess',
    url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=aurora&backgroundColor=fce7f3'
  },
  {
    name: 'peter-pan',
    description: 'Peter Pan - Boy who never grows up',
    url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=peterpan&backgroundColor=dcfce7'
  },
  {
    name: 'alice-wonderland',
    description: 'Alice - Curious girl from Wonderland',
    url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=alice&backgroundColor=dbeafe'
  }
];

async function downloadAndUploadImage(imageUrl, filename, folder = 'demo-friends') {
  try {
    console.log(`📥 Downloading ${filename}...`);
    
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    
    // Create temporary file
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    const tempFilePath = path.join(tempDir, `${filename}.svg`);
    fs.writeFileSync(tempFilePath, buffer);
    
    console.log(`☁️  Uploading ${filename} to Cloudinary...`);
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(tempFilePath, {
      folder: `giftgenie/${folder}`,
      public_id: filename,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { format: 'jpg' }
      ]
    });
    
    // Clean up temporary file
    fs.unlinkSync(tempFilePath);
    
    console.log(`✅ Uploaded ${filename}: ${result.secure_url}`);
    return result.secure_url;
    
  } catch (error) {
    console.error(`❌ Error uploading ${filename}:`, error);
    return null;
  }
}

async function uploadAllCharacterPortraits() {
  console.log('🎭 Starting upload of demo character portraits...\n');
  
  const results = {};
  
  for (const character of characterPortraits) {
    const url = await downloadAndUploadImage(character.url, character.name);
    if (url) {
      results[character.name] = url;
    }
    
    // Small delay between uploads
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Clean up temp directory
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  
  console.log('\n🎉 Upload complete! Results:');
  console.log(JSON.stringify(results, null, 2));
  
  // Save results to file for reference
  fs.writeFileSync(
    path.join(__dirname, 'demo-character-urls.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📝 URLs saved to demo-character-urls.json');
  
  return results;
}

// Run the upload
uploadAllCharacterPortraits()
  .then(() => {
    console.log('\n✨ All character portraits uploaded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  });