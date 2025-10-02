# Railway Deployment Guide

## 🚂 Quick Railway Deployment (Recommended for your structure)

Railway works better with monorepo structures like yours. Here's how to deploy:

### 1. **Sign up at railway.app**
- Connect your GitHub account
- Import your GiftGenie repository

### 2. **Configure Environment Variables**
Add these in Railway dashboard:
```
DATABASE_URL=your-neon-database-url
OPENAI_API_KEY=your-openai-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
NODE_ENV=production
PORT=3000
```

### 3. **Set Build Command**
- Build command: `npm run build:railway`
- Start command: `npm run start:railway`

### 4. **Deploy**
- Railway will automatically deploy on every git push
- You'll get a live URL like: `https://giftgenie-production.up.railway.app`

## 💰 Cost
- Free tier: $5/month credit (enough for testing)
- After free credit: ~$5/month for your usage

## ✅ Advantages
- ✅ Better monorepo support
- ✅ Automatic deployments
- ✅ Built-in PostgreSQL option
- ✅ Simple environment variable management
- ✅ No complex configuration needed