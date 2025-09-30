#!/bin/bash

echo "🔄 GiftGenie Server Restart Helper"
echo ""

echo "📋 Current process status:"
# Check if server is running on port 5000
if lsof -i :5000 >/dev/null 2>&1; then
    echo "✅ Server is running on port 5000"
    echo ""
    echo "🔍 Process details:"
    lsof -i :5000
    echo ""
    
    echo "🛑 Stopping current server processes..."
    # Kill any process using port 5000
    lsof -ti :5000 | xargs kill -9 2>/dev/null || true
    
    echo "⏳ Waiting for port to be free..."
    sleep 2
    
    if lsof -i :5000 >/dev/null 2>&1; then
        echo "⚠️  Port 5000 is still in use. You may need to manually kill processes."
        echo "   Run: lsof -i :5000"
        echo "   Then: kill -9 <PID>"
    else
        echo "✅ Port 5000 is now free"
    fi
else
    echo "ℹ️  No server detected on port 5000"
fi

echo ""
echo "🚀 Starting fresh server..."
echo ""

# Change to project directory
cd "$(dirname "$0")/.."

# Start the server
echo "▶️  Running: npm run dev"
npm run dev