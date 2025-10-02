# Upload Avatar Gallery to Cloudinary

This script downloads the current avatar gallery images from DiceBear API and uploads them to your Cloudinary account for permanent hosting.

## Prerequisites

1. **Cloudinary Account**: Make sure you have a Cloudinary account
2. **Environment Variables**: Ensure your `.env` file contains:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

## How to Run

1. **Run the upload script**:
   ```bash
   npm run upload:avatars
   ```

2. **Wait for completion**: The script will:
   - Download each avatar from DiceBear API
   - Convert SVG to PNG (150x150)
   - Upload to Cloudinary in folder `giftgenie/profile-gallery`
   - Generate new URLs
   - Save results to `scripts/cloudinary-gallery-urls.json`

3. **Update the component**: Copy the generated gallery object from the JSON file and replace the `PROFILE_PICTURE_GALLERY` constant in `/client/src/components/FriendForm.tsx`

## What Gets Uploaded

- **18 total avatars** across 3 categories:
  - 🎨 **Cartoon** (6 avatars): Cute cartoon-style characters
  - 📸 **Realistic** (6 avatars): Professional-looking avatars  
  - 🎬 **Pop Culture** (6 avatars): Fun themed characters (robots, pixel art, etc.)

## Output

The script creates:
- **Cloudinary Images**: Hosted at `https://res.cloudinary.com/YOUR_CLOUD/image/upload/giftgenie/profile-gallery/[filename].png`
- **JSON File**: `scripts/cloudinary-gallery-urls.json` with the complete gallery object ready to copy-paste

## Benefits

- ✅ **Permanent hosting** - images won't break or disappear
- ✅ **Fast loading** - Cloudinary CDN optimization
- ✅ **Consistent quality** - all images standardized to 150x150 PNG
- ✅ **Your control** - hosted on your own Cloudinary account

## Troubleshooting

- **Missing env vars**: Make sure all 3 Cloudinary variables are in your `.env`
- **Rate limiting**: The script includes 1-second delays between uploads
- **Upload failures**: Check your Cloudinary quotas and permissions