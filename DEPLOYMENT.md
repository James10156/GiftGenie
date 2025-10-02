# Deployment guide for GiftGenie

## 🚀 Option 1: Vercel (Recommended for your use case)

### Why Vercel?
- ✅ Free for 3-4 users
- ✅ No server management 
- ✅ Automatic HTTPS/CDN
- ✅ Git-based deployments
- ✅ Works with your existing Neon database

### Steps:
1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   ./scripts/deploy-vercel.sh
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - `DATABASE_URL` (your Neon URL)
   - `OPENAI_API_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY` 
   - `CLOUDINARY_API_SECRET`

4. **Optional Email Variables:**
   - `EMAIL_HOST=smtp.gmail.com`
   - `EMAIL_USER=your-email@gmail.com`
   - `EMAIL_PASS=your-app-password`
   - `EMAIL_FROM=GiftGenie <your-email@gmail.com>`

### Cost: FREE for your use case

---

## 🚂 Option 2: Railway

### Why Railway?
- ✅ Very simple full-stack deployment
- ✅ Built-in PostgreSQL option
- ✅ $5/month hobby plan

### Steps:
1. **Connect GitHub repo to Railway**
2. **Add environment variables**
3. **Deploy automatically**

### Cost: $5/month

---

## 🐳 Option 3: Docker + VPS

### Why Docker?
- ✅ Full control
- ✅ Works on any VPS
- ✅ Easy to scale later

### Steps:
1. **Get a VPS (DigitalOcean, Linode, etc.) - $5-10/month**

2. **Copy your app to server:**
   ```bash
   scp -r . user@your-server:/app
   ```

3. **Deploy with Docker:**
   ```bash
   # On your server
   cd /app
   docker-compose up -d
   ```

4. **Set up reverse proxy (nginx) for HTTPS**

### Cost: $5-10/month + domain

---

## 📊 Comparison

| Option | Cost | Ease | Control | Best For |
|--------|------|------|---------|----------|
| Vercel | FREE | ⭐⭐⭐⭐⭐ | ⭐⭐ | Quick testing |
| Railway | $5/mo | ⭐⭐⭐⭐ | ⭐⭐⭐ | Simple full-stack |
| Docker+VPS | $5-10/mo | ⭐⭐ | ⭐⭐⭐⭐⭐ | Learning/control |

## 🎯 Recommendation

**For your 3-4 user testing: Use Vercel**
- It's free
- No server management
- Your Neon database works perfectly
- Takes 5 minutes to deploy
- Automatic HTTPS and global CDN

Start with Vercel, and if you need more control later, you can always migrate to Docker + VPS.