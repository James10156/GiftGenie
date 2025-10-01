# GiftGenie 🎁

An AI-powered gift recommendation app that helps you find the perfect gifts for your friends based on their personality traits and interests. Built with modern web technologies and powered by OpenAI's GPT models.

## 🚀 Features

- **🤖 AI-Powered Recommendations**: Get personalized gift suggestions using OpenAI's language models
- **👥 Friend Profiles**: Create detailed profiles with personality traits, interests, and preferences
- **💰 Multi-Currency Support**: Handle different currencies based on friend locations (USD, EUR, GBP, etc.)
- **🎚️ Budget Control**: Interactive budget slider with quick preset buttons
- **📱 Modern UI**: Responsive design with Tailwind CSS and Radix UI components
- **🖼️ Image Integration**: Automatic product image fetching from multiple sources
- **🛒 Shop Integration**: Direct links to purchase products from various retailers
- **💾 Gift Management**: Save and organize your favorite gift ideas
- **📊 Analytics Dashboard**: Track usage patterns and user engagement (admin only)
- **👤 Guest Mode**: Full functionality without account creation
- **🔒 User Authentication**: Optional login system with session management

## 🏗️ Architecture

### Frontend (Client)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5 for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Tailwind CSS with Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **Testing**: Vitest with Testing Library

### Backend (Server)
- **Runtime**: Node.js with TypeScript (ESM modules)
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based auth
- **File Uploads**: Multer with Cloudinary integration
- **AI Integration**: OpenAI API for gift recommendations
- **Testing**: Vitest with comprehensive test suites

### Database Schema
- **Users**: User accounts with admin privileges
- **Friends**: Friend profiles with traits and preferences
- **Saved Gifts**: User's saved gift recommendations
- **Analytics**: Usage tracking and performance metrics

## 📦 Dependencies

### Core Dependencies
```json
{
  "express": "^4.21.2",           // Web framework
  "react": "^18.3.1",             // UI library
  "typescript": "5.6.3",          // Type safety
  "drizzle-orm": "^0.39.1",       // Database ORM
  "openai": "^5.12.2",            // AI integration
  "zod": "^3.24.2"                // Schema validation
}
```

### UI & Styling
```json
{
  "@radix-ui/react-*": "Latest",  // Accessible UI primitives
  "tailwindcss": "^3.4.17",      // Utility-first CSS
  "framer-motion": "^11.13.1",    // Animations
  "lucide-react": "^0.453.0"      // Icon library
}
```

### Development Tools
```json
{
  "vite": "^5.4.19",             // Build tool
  "vitest": "^3.2.4",            // Testing framework
  "tsx": "^4.20.4",              // TypeScript execution
  "concurrently": "^9.2.1"       // Run multiple processes
}
```

### External Services
```json
{
  "cloudinary": "^1.41.3",       // Image storage
  "node-fetch": "^3.3.2",        // HTTP client
  "puppeteer": "^24.16.2"        // Web scraping
}
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- PostgreSQL database (optional - uses in-memory storage by default)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GiftGenie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```env
   # Required
   OPENAI_API_KEY="your-openai-api-key"
   
   # Optional - for database persistence
   DATABASE_URL="postgresql://user:password@localhost:5432/giftgenie"
   
   # Optional - for image uploads
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   
   # Optional - for enhanced image search
   UNSPLASH_ACCESS_KEY="your-unsplash-key"
   PEXELS_API_KEY="your-pexels-key"
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

### Database Setup (Optional)

For persistent data storage:

1. **Install and configure PostgreSQL**
2. **Set DATABASE_URL in .env**
3. **Push database schema**
   ```bash
   npm run db:push
   ```

## 📁 Project Structure

```
GiftGenie/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # Radix UI component wrappers
│   │   │   ├── FriendForm.tsx # Friend creation/editing form
│   │   │   └── auth-modal.tsx # Authentication modal
│   │   ├── pages/             # Application pages
│   │   │   ├── home.tsx       # Main application page
│   │   │   ├── blog.tsx       # Blog/about page
│   │   │   └── not-found.tsx  # 404 page
│   │   ├── hooks/             # Custom React hooks
│   │   │   └── use-analytics.ts # Analytics tracking
│   │   ├── lib/               # Utility libraries
│   │   │   ├── queryClient.ts # TanStack Query setup
│   │   │   └── utils.ts       # Helper functions
│   │   ├── App.tsx            # Root application component
│   │   ├── main.tsx           # Application entry point
│   │   └── index.css          # Global styles
│   ├── index.html             # HTML template
│   └── public/                # Static assets
├── server/                     # Backend Express application
│   ├── services/              # Business logic services
│   │   ├── openai.ts          # AI recommendation engine
│   │   ├── imageService.ts    # Image fetching and processing
│   │   ├── googleImageScraper.ts # Google Images integration
│   │   └── productDatabase.ts # Product matching database
│   ├── tests/                 # Test suites
│   ├── auth.ts                # Authentication logic
│   ├── db.ts                  # Database configuration
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # API route definitions
│   ├── storage-adapter.ts     # Data access layer
│   ├── storage.ts             # In-memory storage
│   └── vite.ts                # Vite integration
├── shared/                     # Shared TypeScript types
│   └── schema.ts              # Database schema and types
├── scripts/                    # Utility scripts
├── migrations/                 # Database migrations
├── public/uploads/            # Uploaded files
├── package.json               # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── drizzle.config.ts         # Database ORM configuration
```

## 🔧 Development Scripts

```bash
# Development
npm run dev                    # Start both frontend and backend
npm run dev:client            # Start only frontend (port 3000)
npm run dev:server            # Start only backend (port 5000)

# Building
npm run build                 # Build for production
npm run check                 # TypeScript type checking

# Testing
npm run test                  # Run all tests
npm run test:watch           # Run tests in watch mode
npm run test:server          # Run backend tests only
npm run test:client          # Run frontend tests only
npm run test:coverage        # Run tests with coverage report

# Database
npm run db:push              # Apply schema changes to database
npm run db:populate-demo     # Populate with demo data
```

## 🧪 Testing

The project includes comprehensive test coverage:

- **Backend Tests**: 162 tests covering all API endpoints, services, and utilities
- **Frontend Tests**: Component and integration tests
- **Test Environment**: Vitest with jsdom for browser simulation
- **Mocking**: Complete mocking of external APIs and services
- **Coverage**: High test coverage across critical application paths

Run tests with:
```bash
npm run test              # All tests
npm run test:server      # Backend only
npm run test:watch       # Watch mode
```

## 🌐 API Endpoints

### Friends Management
- `GET /api/friends` - List all friends
- `POST /api/friends` - Create new friend
- `GET /api/friends/:id` - Get specific friend
- `PUT /api/friends/:id` - Update friend
- `DELETE /api/friends/:id` - Delete friend

### Gift Recommendations
- `POST /api/gift-recommendations` - Generate AI recommendations

### Saved Gifts
- `GET /api/saved-gifts` - List saved gifts
- `POST /api/saved-gifts` - Save a gift
- `DELETE /api/saved-gifts/:id` - Remove saved gift

### File Upload
- `POST /api/upload/profile-picture` - Upload friend profile pictures

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Analytics (Admin Only)
- `GET /api/analytics/events` - User analytics data
- `POST /api/analytics/events` - Track analytics events

## 🔐 Security Features

- **Input Validation**: Zod schemas for all API inputs
- **Session Management**: Secure session-based authentication
- **CORS Protection**: Configured for development and production
- **File Upload Security**: Cloudinary integration with type validation
- **Guest Mode**: Isolated session storage for anonymous users
- **SQL Injection Protection**: Drizzle ORM with parameterized queries

## 🎯 AI Integration

The application uses OpenAI's GPT models for generating personalized gift recommendations:

- **Prompt Engineering**: Carefully crafted prompts for optimal results
- **Context Awareness**: Uses friend personality traits and interests
- **Budget Filtering**: AI respects user-defined budget constraints
- **Product Matching**: Integrates with curated product database
- **Image Generation**: Automatic product image sourcing
- **Shop Integration**: Real shopping links for recommended products

## 🖼️ Image Handling

Multi-source image pipeline:
1. **Product Database**: Curated high-quality product images
2. **Google Images**: Dynamic product image scraping
3. **Unsplash/Pexels**: Fallback generic category images
4. **Cloudinary**: User-uploaded profile pictures

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Breakpoints**: Tailwind's responsive breakpoint system
- **Touch-Friendly**: Large touch targets and intuitive gestures
- **Performance**: Optimized images and lazy loading

## 🚀 Performance Optimizations

- **Code Splitting**: Vite's automatic code splitting
- **Image Optimization**: Cloudinary automatic optimization
- **Caching**: React Query for intelligent data caching
- **Bundle Analysis**: Optimized dependencies and bundle size
- **SSG Ready**: Prepared for static site generation

## 🌍 Internationalization

- **Multi-Currency**: Automatic currency detection and conversion
- **Country Support**: Location-based friend profiles
- **Localized Shopping**: Country-specific retailer links

## 📊 Analytics & Monitoring

- **User Analytics**: Track user engagement and behavior
- **Performance Metrics**: Monitor API response times
- **Error Tracking**: Comprehensive error logging
- **Usage Patterns**: Understand how users interact with features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm run test`
5. Commit your changes: `git commit -m 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🔮 Future Enhancements

- **Social Features**: Share gift ideas with friends
- **Calendar Integration**: Birthday and holiday reminders
- **Price Tracking**: Monitor gift price changes
- **Wishlists**: Friend-managed gift wishlists
- **Mobile App**: Native mobile applications
- **Advanced AI**: More sophisticated recommendation algorithms
- **Marketplace**: Direct purchasing integration

---

Built with ❤️ using modern web technologies. Happy gift giving! 🎁

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys) | Yes |
| `DATABASE_URL` | Database connection string (defaults to local SQLite) | No |
| `NODE_ENV` | Environment mode (`development` or `production`) | No |

## Getting an OpenAI API Key

1. Go to [OpenAI's platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Create a new API key
4. Copy the key and paste it into your `.env` file

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: SQLite with Drizzle ORM
- **AI**: OpenAI GPT API
- **State Management**: TanStack Query

## Security Note

⚠️ **Never commit your `.env` file to version control!** 

The `.env` file contains sensitive information like API keys and should remain local to your development environment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## Development Deployment & Setup

### 1. Node & npm Version
- Use Node.js **v20.x** (recommended for compatibility)
- Use npm **v10.x** or higher
- Install Node Version Manager (nvm) if needed: https://github.com/nvm-sh/nvm
- Switch to Node 20:
  ```bash
  nvm install 20
  nvm use 20
  node -v
  npm -v
  ```

### 2. Environment Variables Setup
- Copy `.env.example` to `.env`:
  ```bash
  cp .env.example .env
  ```
- Edit `.env` and set up the following keys:

| Variable | How to Get It | Website |
|----------|--------------|---------|
| OPENAI_API_KEY | Create an API key | https://platform.openai.com/api-keys |
| DATABASE_URL | Neon Postgres: create a database, copy connection string | https://neon.tech |
| UNSPLASH_ACCESS_KEY | Register as a developer, create an app | https://unsplash.com/oauth/applications |
| PEXELS_API_KEY | Register, get API key | https://www.pexels.com/api/ |
| AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG | Sign up for Amazon Associates | https://affiliate-program.amazon.com/ |
| CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET | Create a Cloudinary account | https://cloudinary.com |

- For development, you can leave optional keys blank or use demo/test values.

### 3. Ngrok Setup (for public tunneling)
- Download ngrok: https://ngrok.com/download
- Or install via terminal:
  ```bash
  wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
  tar -xvf ngrok-v3-stable-linux-amd64.tgz
  sudo mv ngrok /usr/local/bin
  ngrok version
  ```
- You do **not** need to sign up for ngrok for basic dev use.

### 4. Running the App
- Start the webapp and tunnel:
  ```bash
  ./scripts/start-webapp.sh
  ```
- The script will:
  - Start frontend and backend servers
  - Attempt to create a public tunnel (ngrok, serveo, etc.)
  - Print the public URL if successful
- If you see errors about missing dependencies, run:
  ```bash
  npm install
  ```

### 5. Troubleshooting
- Make sure your `.env` is filled out
- Use compatible Node/npm versions
- Check `logs/server.log` and `logs/tunnel.log` for errors
- If ngrok fails, try running manually:
  ```bash
  ngrok http 3000
  ```
- For database issues, check Neon dashboard and credentials

### 6. Useful Links
- OpenAI API: https://platform.openai.com/api-keys
- Neon Postgres: https://neon.tech
- Unsplash API: https://unsplash.com/oauth/applications
- Pexels API: https://www.pexels.com/api/
- Amazon Associates: https://affiliate-program.amazon.com/
- Cloudinary: https://cloudinary.com
- Ngrok: https://ngrok.com/download

---

## Repository Structure (Post-Cleanup)
- `README.md` — Main project info
- `docs/` — All documentation and markdown files
- `config/` — All configuration files
- `tests/` — All root-level test scripts and files
- `client/tests/` — Client-side tests
- `server/tests/` — Server-side tests
- `scripts/` — Only essential scripts for dev and deployment
- `archive/` — Old or non-essential scripts
- `public/uploads/` — Not tracked in git (see .gitignore)
- `docs/scripts/` — Archived or reference scripts
- `docs/config/` — Archived or reference config files
- `docs/tests/` — Archived or reference test files

---
