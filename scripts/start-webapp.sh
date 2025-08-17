#!/bin/bash

# GiftGenie Web App Startup Script
# This script starts the webapp if it's not already running and exposes it via serveo

set -e

PORT=5000
LOG_DIR="logs"
SERVER_LOG="$LOG_DIR/server.log"
TUNNEL_LOG="$LOG_DIR/tunnel.log"
PID_FILE="$LOG_DIR/webapp.pid"
TUNNEL_PID_FILE="$LOG_DIR/tunnel.pid"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to check if server is running
check_server() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0  # Server is running
        else
            rm -f "$PID_FILE"  # Remove stale PID file
            return 1  # Server is not running
        fi
    else
        return 1  # PID file doesn't exist
    fi
}

# Function to check if tunnel is running
check_tunnel() {
    if [ -f "$TUNNEL_PID_FILE" ]; then
        local pid=$(cat "$TUNNEL_PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0  # Tunnel is running
        else
            rm -f "$TUNNEL_PID_FILE"  # Remove stale PID file
            return 1  # Tunnel is not running
        fi
    else
        return 1  # PID file doesn't exist
    fi
}

# Function to start the server
start_server() {
    echo "Starting GiftGenie server on port $PORT..."
    
    # Kill any existing server processes
    pkill -f "tsx server/index.ts" 2>/dev/null || true
    pkill -f "node.*server/index.ts" 2>/dev/null || true
    
    # Start the server in background
    cd "$(dirname "$0")/.."
    NODE_ENV=development node --import tsx/esm server/index.ts > "$SERVER_LOG" 2>&1 &
    local server_pid=$!
    
    echo $server_pid > "$PID_FILE"
    echo "Server started with PID: $server_pid"
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if server is actually running
    if ! kill -0 "$server_pid" 2>/dev/null; then
        echo "Error: Server failed to start. Check $SERVER_LOG for details."
        cat "$SERVER_LOG"
        exit 1
    fi
    
    # Test if server is responding
    if curl -s -f "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
        echo "Server is responding on http://localhost:$PORT"
    else
        echo "Warning: Server started but may not be fully ready yet"
    fi
}

# Function to start the tunnel
start_tunnel() {
    echo "Starting serveo tunnel..."
    
    # Kill any existing SSH tunnel processes to serveo
    pkill -f "ssh.*serveo.net" 2>/dev/null || true
    
    # Start the tunnel in background
    ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no -R 80:localhost:$PORT serveo.net > "$TUNNEL_LOG" 2>&1 &
    local tunnel_pid=$!
    
    echo $tunnel_pid > "$TUNNEL_PID_FILE"
    echo "Tunnel started with PID: $tunnel_pid"
    
    # Wait for tunnel to establish
    echo "Waiting for tunnel to establish..."
    sleep 5
    
    # Check if tunnel is still running
    if ! kill -0 "$tunnel_pid" 2>/dev/null; then
        echo "Error: Tunnel failed to start. Check $TUNNEL_LOG for details."
        cat "$TUNNEL_LOG"
        exit 1
    fi
    
    # Extract the URL from the tunnel log
    echo "Checking tunnel status..."
    sleep 2
    if [ -f "$TUNNEL_LOG" ]; then
        local url=$(grep -o 'https://[a-zA-Z0-9]*.serveo.net' "$TUNNEL_LOG" | head -1)
        if [ -n "$url" ]; then
            echo "✅ GiftGenie is now available at: $url"
            echo "URL: $url" > "$LOG_DIR/public_url.txt"
        else
            echo "Tunnel is running but URL not yet available. Check $TUNNEL_LOG"
        fi
    fi
}

# Main execution
echo "🎁 Starting GiftGenie Web App..."

# Check if server is already running
if check_server; then
    echo "✅ Server is already running (PID: $(cat "$PID_FILE"))"
else
    start_server
fi

# Check if tunnel is already running
if check_tunnel; then
    echo "✅ Tunnel is already running (PID: $(cat "$TUNNEL_PID_FILE"))"
    if [ -f "$LOG_DIR/public_url.txt" ]; then
        echo "✅ Public URL: $(cat "$LOG_DIR/public_url.txt")"
    fi
else
    start_tunnel
fi

echo ""
echo "🚀 GiftGenie is running!"
echo "   Local:  http://localhost:$PORT"
if [ -f "$LOG_DIR/public_url.txt" ]; then
    echo "   Public: $(cat "$LOG_DIR/public_url.txt")"
fi
echo ""
echo "📋 Management commands:"
echo "   Stop:    ./scripts/stop-webapp.sh"
echo "   Restart: ./scripts/restart-webapp.sh"
echo "   Logs:    tail -f logs/server.log logs/tunnel.log"
echo ""
