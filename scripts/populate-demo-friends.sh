#!/bin/bash

# GiftGenie Demo Friends Population Script
# This script populates the database with default guest friends (Alex, Sarah, Mike)
# These friends are shown to users who visit the app without logging in

set -e

echo "🎁 Populating GiftGenie with demo friends..."

# Load environment variables from .env file
if [ -f ".env" ]; then
    # Source the .env file to load variables
    set -a  # automatically export all variables
    source .env
    set +a
    echo "✅ Loaded environment variables from .env"
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "   Make sure you have a .env file with your Neon database connection string"
    exit 1
fi

# Parse the DATABASE_URL to extract connection parameters
echo "🔗 Connecting to database..."

# Use the full DATABASE_URL but handle the channel_binding parameter issue
DB_URL_FIXED=$(echo $DATABASE_URL | sed 's/&channel_binding=require//')

# For Neon, we need to add the endpoint parameter
if [[ $DB_URL_FIXED == *"neon.tech"* ]]; then
    # Extract endpoint ID from hostname
    ENDPOINT_ID=$(echo $DB_URL_FIXED | sed 's/.*@\([^.]*\)\..*/\1/')
    if [[ $DB_URL_FIXED == *"options=endpoint"* ]]; then
        # Already has endpoint parameter
        PSQL_URL="$DB_URL_FIXED"
    else
        # Add endpoint parameter
        PSQL_URL="${DB_URL_FIXED}&options=endpoint%3D${ENDPOINT_ID}"
    fi
else
    PSQL_URL="$DB_URL_FIXED"
fi

# Check if demo friends already exist
echo "🔍 Checking existing demo friends..."
EXISTING_COUNT=$(psql "$PSQL_URL" -t -c "
SET statement_timeout = '10s';
SELECT COUNT(*) FROM friends WHERE user_id IS NULL AND name IN ('Alex Johnson', 'Sarah Chen', 'Mike Torres');
" 2>/dev/null | tr -d ' ')

if [ -z "$EXISTING_COUNT" ]; then
    echo "⚠️  Could not connect to database or query failed. Proceeding anyway..."
    EXISTING_COUNT=0
fi

if [ "$EXISTING_COUNT" -eq "3" ]; then
    echo "✅ All demo friends already exist in the database"
    echo "   Found: Alex Johnson, Sarah Chen, Mike Torres"
    exit 0
elif [ "$EXISTING_COUNT" -gt "0" ]; then
    echo "⚠️  Found $EXISTING_COUNT existing demo friends. Cleaning up first..."
    psql "$PSQL_URL" -c "
    DELETE FROM friends WHERE user_id IS NULL AND name IN ('Alex Johnson', 'Sarah Chen', 'Mike Torres');
    " > /dev/null
    echo "✅ Cleaned up existing demo friends"
fi

echo "📝 Inserting demo friends..."

# Insert the demo friends
psql "$PSQL_URL" -c "
INSERT INTO friends (user_id, name, personality_traits, interests, notes, country, currency, profile_picture, created_at) VALUES 
(NULL, 'Alex Johnson', '[\"Creative\", \"Outdoorsy\", \"Thoughtful\"]'::jsonb, '[\"Art\", \"Hiking\", \"Photography\"]'::jsonb, 'Loves outdoor art sessions and nature photography', 'United States', 'USD', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', NOW() - INTERVAL '14 days'),
(NULL, 'Sarah Chen', '[\"Artistic\", \"Tech-savvy\", \"Innovative\"]'::jsonb, '[\"Digital Art\", \"Gadgets\", \"Gaming\"]'::jsonb, 'Always exploring new digital art tools and techniques', 'Canada', 'CAD', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', NOW() - INTERVAL '30 days'),
(NULL, 'Mike Torres', '[\"Sporty\", \"Social\", \"Energetic\"]'::jsonb, '[\"Basketball\", \"Fitness\", \"Music\"]'::jsonb, 'Very active, loves team sports and working out', 'United States', 'USD', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', NOW() - INTERVAL '3 days');
" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Successfully inserted demo friends:"
    echo "   • Alex Johnson (Creative, Outdoorsy, Thoughtful)"
    echo "   • Sarah Chen (Artistic, Tech-savvy, Innovative)" 
    echo "   • Mike Torres (Sporty, Social, Energetic)"
    echo ""
    echo "🎉 Demo friends are now available for guest users!"
    echo "   Guests visiting the app will see these friends without needing to log in."
else
    echo "❌ Failed to insert demo friends"
    exit 1
fi

# Verify the insertion
FINAL_COUNT=$(psql "$PSQL_URL" -t -c "
SELECT COUNT(*) FROM friends WHERE user_id IS NULL;
" 2>/dev/null | tr -d ' ')

echo "📊 Total guest friends in database: $FINAL_COUNT"