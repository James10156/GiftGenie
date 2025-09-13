#!/bin/bash

# GiftGenie Web App Startup Script
# This script starts the webapp using the development setup:
# - Frontend (React/Vite) on port 3000
# - Backend (Express API) on port 5000
# - Exposes frontend via serveo tunnel

set -e

FRONTEND_PORT=3000
BACKEND_PORT=5000
LOG_DIR="logs"
SERVER_LOG="$LOG_DIR/server.log"
TUNNEL_LOG="$LOG_DIR/tunnel.log"
DEV_PID_FILE="$LOG_DIR/webapp.pid"
TUNNEL_PID_FILE="$LOG_DIR/tunnel.pid"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to check if development servers are running
check_dev_servers() {
    if [ -f "$DEV_PID_FILE" ]; then
        local pid=$(cat "$DEV_PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0  # Dev servers are running
        else
            rm -f "$DEV_PID_FILE"  # Remove stale PID file
            return 1  # Dev servers are not running
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

# Function to start the development servers
start_dev_servers() {
    echo "Starting GiftGenie development servers..."
    echo "  Frontend: http://localhost:$FRONTEND_PORT"
    echo "  Backend API: http://localhost:$BACKEND_PORT"
    
    # Kill any existing processes
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "concurrently" 2>/dev/null || true
    pkill -f "tsx server/index.ts" 2>/dev/null || true
    pkill -f "vite.*--port 3000" 2>/dev/null || true
    
    # Start the development servers in background
    cd "$(dirname "$0")/.."
    npm run dev > "$SERVER_LOG" 2>&1 &
    local dev_pid=$!
    
    echo $dev_pid > "$DEV_PID_FILE"
    echo "Development servers started with PID: $dev_pid"
    
    # Wait a moment for servers to start
    sleep 5
    
    # Check if development process is still running
    if ! kill -0 "$dev_pid" 2>/dev/null; then
        echo "Error: Development servers failed to start. Check $SERVER_LOG for details."
        cat "$SERVER_LOG"
        exit 1
    fi
    
    # Test if both servers are responding
    echo "Testing server connectivity..."
    local backend_ready=false
    local frontend_ready=false
    
    # Wait up to 30 seconds for servers to be ready
    for i in {1..30}; do
        if curl -s -f "http://localhost:$BACKEND_PORT/api/friends" > /dev/null 2>&1; then
            backend_ready=true
        fi
        if curl -s -f "http://localhost:$FRONTEND_PORT/" > /dev/null 2>&1; then
            frontend_ready=true
        fi
        
        if [ "$backend_ready" = true ] && [ "$frontend_ready" = true ]; then
            break
        fi
        sleep 1
    done
    
    if [ "$backend_ready" = true ]; then
        echo "✅ Backend API is responding on http://localhost:$BACKEND_PORT"
    else
        echo "⚠️  Backend API may not be fully ready yet"
    fi
    
    if [ "$frontend_ready" = true ]; then
        echo "✅ Frontend is responding on http://localhost:$FRONTEND_PORT"
    else
        echo "⚠️  Frontend may not be fully ready yet"
    fi
}

# Function to start the tunnel
start_tunnel() {
    echo "Starting serveo tunnel for frontend..."
    
    # Kill any existing SSH tunnel processes to serveo
    pkill -f "ssh.*serveo.net" 2>/dev/null || true
    
    # Start the tunnel in background (tunnel the frontend port)
    ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no -R 80:localhost:$FRONTEND_PORT serveo.net > "$TUNNEL_LOG" 2>&1 &
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
echo "🎁 Starting GiftGenie Web App (Development Mode)..."

# Check if development servers are already running
if check_dev_servers; then
    echo "✅ Development servers are already running (PID: $(cat "$DEV_PID_FILE"))"
else
    start_dev_servers
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
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo "   Backend:  http://localhost:$BACKEND_PORT"
if [ -f "$LOG_DIR/public_url.txt" ]; then
    echo "   Public:   $(cat "$LOG_DIR/public_url.txt")"
fi
echo ""
echo "📋 Management commands:"
echo "   Stop:    ./scripts/stop-webapp.sh"
echo "   Restart: ./scripts/restart-webapp.sh"
echo "   Status:  ./scripts/status-webapp.sh"
echo "   Logs:    tail -f logs/server.log logs/tunnel.log"
echo ""
