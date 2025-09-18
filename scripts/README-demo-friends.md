# Database Demo Friends Population Script

This script populates the GiftGenie database with default demo friends that are shown to guest users (visitors who haven't logged in).

## Demo Friends

The script creates three default friends for guest users:

1. **Alex Johnson** 
   - Personality: Creative, Outdoorsy, Thoughtful
   - Interests: Art, Hiking, Photography
   - Notes: Loves outdoor art sessions and nature photography
   - Country: United States (USD)

2. **Sarah Chen**
   - Personality: Artistic, Tech-savvy, Innovative  
   - Interests: Digital Art, Gadgets, Gaming
   - Notes: Always exploring new digital art tools and techniques
   - Country: Canada (CAD)

3. **Mike Torres**
   - Personality: Sporty, Social, Energetic
   - Interests: Basketball, Fitness, Music
   - Notes: Very active, loves team sports and working out
   - Country: United States (USD)

## Usage

### Using NPM (Recommended)
```bash
npm run db:populate-demo
```

### Using the Script Directly
```bash
./scripts/populate-demo-friends.sh
```

## Requirements

- PostgreSQL client (`psql`) installed
- `.env` file with valid `DATABASE_URL` 
- Neon PostgreSQL database (or compatible)

## Features

- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Smart Detection**: Checks if friends already exist
- ✅ **Auto-cleanup**: Removes partial data before inserting
- ✅ **Error Handling**: Proper error messages and exit codes
- ✅ **Neon Compatible**: Handles endpoint parameters for Neon database

## When to Use

Run this script when:
- Setting up a new environment
- Demo friends get accidentally deleted
- Resetting guest user experience
- After database migrations or resets

## Technical Details

The script:
1. Loads environment variables from `.env`
2. Connects to the Neon PostgreSQL database
3. Checks for existing demo friends
4. Cleans up partial data if needed
5. Inserts fresh demo friends with `user_id = NULL`
6. Verifies the insertion was successful

Guest users (not logged in) will see these friends when they visit the app, providing an immediate demo experience without requiring account creation.