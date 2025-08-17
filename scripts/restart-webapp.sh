#!/bin/bash

# GiftGenie Web App Restart Script
# This script stops and then starts the webapp

set -e

SCRIPT_DIR="$(dirname "$0")"

echo "🔄 Restarting GiftGenie Web App..."
echo ""

# Stop the webapp
"$SCRIPT_DIR/stop-webapp.sh"

echo ""
echo "⏳ Waiting a moment before restart..."
sleep 2

# Start the webapp
"$SCRIPT_DIR/start-webapp.sh"
