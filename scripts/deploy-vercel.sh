#!/bin/bash

echo "🚀 Deploying GiftGenie to Vercel..."

# Build the client
echo "📦 Building client..."
cd client
npm run build
cd ..

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "🔧 Don't forget to set these environment variables in Vercel dashboard:"
echo "   • DATABASE_URL"
echo "   • OPENAI_API_KEY" 
echo "   • CLOUDINARY_CLOUD_NAME"
echo "   • CLOUDINARY_API_KEY"
echo "   • CLOUDINARY_API_SECRET"
echo ""
echo "📋 Optional email environment variables:"
echo "   • EMAIL_HOST"
echo "   • EMAIL_USER"
echo "   • EMAIL_PASS"
echo "   • EMAIL_FROM"