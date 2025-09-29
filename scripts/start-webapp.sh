#!/bin/bash

# GiftGenie Web App Startup Script with Multiple Tunnel Options
# 
# This script starts both frontend and backend servers and creates a public tunnel
# for external access. It tries multiple tunnel services in order of preference:
#
# 1. Serveo (no installation needed, SSH-based)
# 2. ngrok (requires: https://ngrok.com/download)
# 3. Cloudflared (requires: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
# 4. LocalTunnel (auto-installed via npm if needed)
# 5. localhost.run (no installation needed, SSH-based)
#
# Installation commands for optional tools:
# - ngrok: Download from https://ngrok.com/download or use package manager
# - cloudflared: 
#   Ubuntu/Debian: wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared-linux-amd64.deb
#   Other: See https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

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
    echo "Starting web tunnel for frontend..."
    
    # Try different tunnel services in order of preference
    if start_serveo_tunnel; then
        return 0
    elif start_ngrok_tunnel; then
        return 0
    elif start_cloudflared_tunnel; then
        return 0
    elif start_bore_tunnel; then
        return 0
    elif start_localtunnel; then
        return 0
    elif start_localhost_run_tunnel; then
        return 0
    else
        echo "❌ All tunnel services failed. App is only available locally."
        echo "   Frontend: http://localhost:$FRONTEND_PORT"
        echo "   Backend:  http://localhost:$BACKEND_PORT"
        return 1
    fi
}

# Function to start Serveo tunnel
start_serveo_tunnel() {
    echo "🔗 Trying Serveo tunnel..."
    
    # Kill any existing SSH tunnel processes to serveo
    pkill -f "ssh.*serveo.net" 2>/dev/null || true
    
    # Test if serveo is reachable
    if ! timeout 5 ssh -o ConnectTimeout=5 -o BatchMode=yes serveo.net exit 2>/dev/null; then
        echo "⚠️  Serveo is not reachable, trying alternative..."
        return 1
    fi
    
    # Start the tunnel in background (tunnel the frontend port)
    ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no -R 80:localhost:$FRONTEND_PORT serveo.net > "$TUNNEL_LOG" 2>&1 &
    local tunnel_pid=$!
    
    echo $tunnel_pid > "$TUNNEL_PID_FILE"
    echo "Serveo tunnel started with PID: $tunnel_pid"
    
    # Wait for tunnel to establish
    sleep 5
    
    # Check if tunnel is still running
    if ! kill -0 "$tunnel_pid" 2>/dev/null; then
        echo "❌ Serveo tunnel failed to start"
        return 1
    fi
    
    # Extract the URL from the tunnel log
    sleep 2
    if [ -f "$TUNNEL_LOG" ]; then
        local url=$(grep -o 'https://[a-zA-Z0-9]*.serveo.net' "$TUNNEL_LOG" | head -1)
        if [ -n "$url" ]; then
            echo "✅ GiftGenie is now available at: $url (via Serveo)"
            echo "URL: $url" > "$LOG_DIR/public_url.txt"
            return 0
        fi
    fi
    
    echo "❌ Serveo tunnel failed to get URL"
    return 1
}

# Function to start ngrok tunnel
start_ngrok_tunnel() {
    echo "🔗 Trying ngrok tunnel..."
    
    # Check if ngrok is installed
    if ! command -v ngrok &> /dev/null; then
        echo "⚠️  ngrok not installed, trying alternative..."
        return 1
    fi
    
    # Kill any existing ngrok processes
    pkill -f "ngrok" 2>/dev/null || true
    
    # Start ngrok tunnel
    ngrok http $FRONTEND_PORT --log=stdout > "$TUNNEL_LOG" 2>&1 &
    local tunnel_pid=$!
    
    echo $tunnel_pid > "$TUNNEL_PID_FILE"
    echo "ngrok tunnel started with PID: $tunnel_pid"
    
    # Wait for tunnel to establish
    sleep 10
    
    # Check if tunnel is still running
    if ! kill -0 "$tunnel_pid" 2>/dev/null; then
        echo "❌ ngrok tunnel failed to start"
        return 1
    fi
    
    # Get URL from ngrok API
    local url=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[a-zA-Z0-9-]*.ngrok-free.app' | head -1)
    if [ -n "$url" ]; then
        echo "✅ GiftGenie is now available at: $url (via ngrok)"
        echo "URL: $url" > "$LOG_DIR/public_url.txt"
        return 0
    fi
    
    echo "❌ ngrok tunnel failed to get URL"
    return 1
}

# Function to start Cloudflared tunnel
start_cloudflared_tunnel() {
    echo "🔗 Trying Cloudflared tunnel..."
    
    # Check if cloudflared is installed
    if ! command -v cloudflared &> /dev/null; then
        echo "⚠️  cloudflared not installed, trying alternative..."
        return 1
    fi
    
    # Kill any existing cloudflared processes
    pkill -f "cloudflared" 2>/dev/null || true
    
    # Start cloudflared tunnel
    cloudflared tunnel --url http://localhost:$FRONTEND_PORT > "$TUNNEL_LOG" 2>&1 &
    local tunnel_pid=$!
    
    echo $tunnel_pid > "$TUNNEL_PID_FILE"
    echo "Cloudflared tunnel started with PID: $tunnel_pid"
    
    # Wait for tunnel to establish
    sleep 8
    
    # Check if tunnel is still running
    if ! kill -0 "$tunnel_pid" 2>/dev/null; then
        echo "❌ Cloudflared tunnel failed to start"
        return 1
    fi
    
    # Extract URL from log
    sleep 2
    if [ -f "$TUNNEL_LOG" ]; then
        local url=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" | head -1)
        if [ -n "$url" ]; then
            echo "✅ GiftGenie is now available at: $url (via Cloudflared)"
            echo "URL: $url" > "$LOG_DIR/public_url.txt"
            return 0
        fi
    fi
    
    echo "❌ Cloudflared tunnel failed to get URL"
    return 1
}

# Function to start bore.pub tunnel
start_bore_tunnel() {
    echo "🔗 Trying bore.pub tunnel..."
    
    # Check if bore is installed
    if ! command -v bore &> /dev/null; then
        echo "Installing bore..."
        # Try to install bore using cargo if available
        if command -v cargo &> /dev/null; then
            cargo install bore-cli 2>/dev/null || {
                echo "⚠️  Failed to install bore, trying alternative..."
                return 1
            }
        else
            echo "⚠️  bore not available (requires Rust/cargo), trying alternative..."
            return 1
        fi
    fi
    
    # Kill any existing bore processes
    pkill -f "bore" 2>/dev/null || true
    
    # Start bore tunnel
    bore local $FRONTEND_PORT --to bore.pub > "$TUNNEL_LOG" 2>&1 &
    local tunnel_pid=$!
    
    echo $tunnel_pid > "$TUNNEL_PID_FILE"
    echo "bore tunnel started with PID: $tunnel_pid"
    
    # Wait for tunnel to establish
    sleep 8
    
    # Check if tunnel is still running
    if ! kill -0 "$tunnel_pid" 2>/dev/null; then
        echo "❌ bore tunnel failed to start"
        return 1
    fi
    
    # Extract URL from log
    sleep 2
    if [ -f "$TUNNEL_LOG" ]; then
        local url=$(grep -o 'https://[a-zA-Z0-9-]*\.bore\.pub' "$TUNNEL_LOG" | head -1)
        if [ -n "$url" ]; then
            echo "✅ GiftGenie is now available at: $url (via bore.pub)"
            echo "URL: $url" > "$LOG_DIR/public_url.txt"
            return 0
        fi
    fi
    
    echo "❌ bore tunnel failed to get URL"
    return 1
}

# Function to start LocalTunnel
start_localtunnel() {
    echo "🔗 Trying LocalTunnel..."
    
    # Check if localtunnel is installed globally or install it
    if ! command -v lt &> /dev/null; then
        echo "Installing LocalTunnel..."
        if npm install -g localtunnel 2>/dev/null; then
            echo "✅ LocalTunnel installed"
        else
            echo "⚠️  Failed to install LocalTunnel, trying alternative..."
            return 1
        fi
    fi
    
    # Kill any existing lt processes
    pkill -f "node.*localtunnel" 2>/dev/null || true
    
    # Start LocalTunnel with explicit local host to avoid IP validation issues
    lt --port $FRONTEND_PORT --local-host 127.0.0.1 > "$TUNNEL_LOG" 2>&1 &
    local tunnel_pid=$!
    
    echo $tunnel_pid > "$TUNNEL_PID_FILE"
    echo "LocalTunnel started with PID: $tunnel_pid"
    
    # Wait for tunnel to establish
    sleep 8
    
    # Check if tunnel is still running
    if ! kill -0 "$tunnel_pid" 2>/dev/null; then
        echo "❌ LocalTunnel failed to start"
        # Try without --local-host flag as fallback
        echo "Trying LocalTunnel without --local-host flag..."
        lt --port $FRONTEND_PORT > "$TUNNEL_LOG" 2>&1 &
        tunnel_pid=$!
        echo $tunnel_pid > "$TUNNEL_PID_FILE"
        sleep 8
        
        if ! kill -0 "$tunnel_pid" 2>/dev/null; then
            echo "❌ LocalTunnel failed to start (both attempts)"
            return 1
        fi
    fi
    
    # Extract URL from log
    sleep 2
    if [ -f "$TUNNEL_LOG" ]; then
        local url=$(grep -o 'https://[a-zA-Z0-9-]*\.loca\.lt' "$TUNNEL_LOG" | head -1)
        if [ -n "$url" ]; then
            echo "✅ GiftGenie is now available at: $url (via LocalTunnel)"
            echo "URL: $url" > "$LOG_DIR/public_url.txt"
            return 0
        fi
    fi
    
    echo "❌ LocalTunnel failed to get URL"
    return 1
}

# Function to start localhost.run tunnel
start_localhost_run_tunnel() {
    echo "🔗 Trying localhost.run tunnel..."
    
    # Kill any existing SSH tunnel processes to localhost.run
    pkill -f "ssh.*localhost.run" 2>/dev/null || true
    
    # Test if localhost.run is reachable
    if ! timeout 5 ssh -o ConnectTimeout=5 -o BatchMode=yes localhost.run exit 2>/dev/null; then
        echo "❌ localhost.run is not reachable"
        return 1
    fi
    
    # Start the tunnel in background
    ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no -R 80:localhost:$FRONTEND_PORT localhost.run > "$TUNNEL_LOG" 2>&1 &
    local tunnel_pid=$!
    
    echo $tunnel_pid > "$TUNNEL_PID_FILE"
    echo "localhost.run tunnel started with PID: $tunnel_pid"
    
    # Wait for tunnel to establish
    sleep 8
    
    # Check if tunnel is still running
    if ! kill -0 "$tunnel_pid" 2>/dev/null; then
        echo "❌ localhost.run tunnel failed to start"
        return 1
    fi
    
    # Extract the URL from the tunnel log
    sleep 2
    if [ -f "$TUNNEL_LOG" ]; then
        local url=$(grep -o 'https://[a-zA-Z0-9-]*\.localhost\.run' "$TUNNEL_LOG" | head -1)
        if [ -n "$url" ]; then
            echo "✅ GiftGenie is now available at: $url (via localhost.run)"
            echo "URL: $url" > "$LOG_DIR/public_url.txt"
            return 0
        fi
    fi
    
    echo "❌ localhost.run tunnel failed to get URL"
    return 1
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
