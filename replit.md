# Overview

GiftMate is a modern web application designed to help users find personalized gift recommendations for their friends. The application allows users to manage a list of friends with their personality traits, interests, country, currency, and additional notes, then leverages AI-powered recommendations to suggest thoughtful gifts based on those characteristics. Built with a React frontend and Express backend, it features a clean, intuitive interface for adding/editing friends, generating gift suggestions with location and currency-specific pricing, profile picture uploads, and saving favorite recommendations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application is built with React and TypeScript, using Vite as the build tool. The UI framework is based on shadcn/ui components built on top of Radix UI primitives, providing a consistent and accessible design system. The application uses Wouter for client-side routing and TanStack Query for server state management and caching. The styling is implemented with Tailwind CSS using a custom design system with CSS variables for theming.

## Backend Architecture
The server is built with Express.js and TypeScript, following a modular structure with separate route handlers and storage abstractions. The application currently uses an in-memory storage implementation but is designed with a storage interface pattern that allows for easy migration to persistent databases. The API follows RESTful conventions for managing friends and saved gifts.

## Data Storage Solutions
The application uses Drizzle ORM configured for PostgreSQL with a schema that includes tables for users, friends, and saved gifts. The current implementation includes an in-memory storage layer for development, with the database schema ready for production deployment. Database migrations are managed through Drizzle Kit.

## State Management
Client-side state is managed through TanStack Query for server state and React's built-in state management for local UI state. The application implements optimistic updates and proper error handling for all API interactions.

## UI Component System
The frontend uses a comprehensive component library based on shadcn/ui, which provides pre-built, accessible components including forms, dialogs, buttons, cards, and data display components. The design system uses CSS custom properties for consistent theming and supports responsive design patterns.

# External Dependencies

## AI Integration
- **OpenAI API**: Powers the gift recommendation engine using GPT-4o model to generate personalized suggestions based on friend profiles, including personality traits, interests, and additional notes
- **Configuration**: Expects OPENAI_API_KEY environment variable for API authentication
- **Current Implementation**: Uses simulated AI recommendations for development/testing without requiring API keys

## Database Services
- **Neon Database**: Configured as the primary PostgreSQL provider through @neondatabase/serverless
- **Connection**: Uses DATABASE_URL environment variable for database connection string

## UI Framework Dependencies
- **Radix UI**: Complete set of unstyled, accessible UI components
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: Pre-built component library combining Radix UI with Tailwind CSS

## Development Tools
- **Vite**: Build tool and development server with React plugin
- **TypeScript**: Static type checking across the entire application
- **Drizzle ORM**: Type-safe database toolkit with schema management

## Image Services
- **Unsplash**: Used for generating product images in gift recommendations through their API
- **Profile Pictures**: Base64 image upload and storage for friend profiles with 50MB payload limit support

## Form Management
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation for type-safe form handling and API data validation

## Additional Services
- **Express Session**: Session management (configured for PostgreSQL session storage)
- **CORS**: Cross-origin resource sharing configuration for API access
- **Currency Support**: Multi-currency pricing display with 10 supported currencies (USD, EUR, GBP, CAD, AUD, JPY, KRW, BRL, MXN, INR)
- **Country Selection**: Location-based gift filtering with 14 supported countries
- **Enhanced Request Handling**: 50MB payload limit for profile picture uploads and large request bodies