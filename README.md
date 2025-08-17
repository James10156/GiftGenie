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
