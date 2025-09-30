# GiftGenie 🎁

An AI-powered gift recommendation app that helps you find the perfect gifts for your friends based on their personality traits and interests.

## Features

- **Friend Profiles**: Create detailed profiles with personality traits, interests, and preferences
- **AI Gift Recommendations**: Get personalized gift suggestions powered by OpenAI
- **Multi-Currency Support**: Handle different currencies based on friend locations
- **Budget Slider**: Interactive budget selection with visual controls
- **Gift Management**: Save and organize your favorite gift ideas

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd GiftGenie
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY="your-actual-openai-api-key-here"
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser to `http://localhost:5000`

## Environment Variables

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
