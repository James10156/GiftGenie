#!/bin/bash

# GiftGenie Web App Status Script
# This script checks the status of the development servers and tunnel

set -e

LOG_DIR="logs"
DEV_PID_FILE="$LOG_DIR/webapp.pid"
TUNNEL_PID_FILE="$LOG_DIR/tunnel.pid"
FRONTEND_PORT=3000
BACKEND_PORT=5000

# Function to check if process is running
check_process_status() {
    local pid_file=$1
    local process_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "✅ $process_name is running (PID: $pid)"
            return 0
        else
            echo "❌ $process_name is not running (stale PID file)"
            return 1
        fi
    else
        echo "❌ $process_name is not running (no PID file)"
        return 1
    fi
}

echo "📊 GiftGenie Web App Status (Development Mode)"
echo "=============================================="

# Check development servers status
dev_servers_running=false
if check_process_status "$DEV_PID_FILE" "Development servers"; then
    dev_servers_running=true
    
    # Test if both servers are responding
    backend_responding=false
    frontend_responding=false
    
    if curl -s -f "http://localhost:$BACKEND_PORT/api/friends" > /dev/null 2>&1; then
        echo "✅ Backend API is responding on http://localhost:$BACKEND_PORT"
        backend_responding=true
    else
        echo "❌ Backend API is not responding on http://localhost:$BACKEND_PORT"
    fi
    
    if curl -s -f "http://localhost:$FRONTEND_PORT/" > /dev/null 2>&1; then
        echo "✅ Frontend is responding on http://localhost:$FRONTEND_PORT"
        frontend_responding=true
    else
        echo "❌ Frontend is not responding on http://localhost:$FRONTEND_PORT"
    fi
    
    if [ "$backend_responding" = false ] || [ "$frontend_responding" = false ]; then
        echo "⚠️  Some services are not responding properly"
    fi
fi

# Check tunnel status
tunnel_running=false
if check_process_status "$TUNNEL_PID_FILE" "Serveo tunnel"; then
    tunnel_running=true
    
    # Show public URL if available
    if [ -f "$LOG_DIR/public_url.txt" ]; then
        echo "🌐 Public URL: $(cat "$LOG_DIR/public_url.txt")"
    else
        echo "⚠️  Tunnel is running but public URL not available"
    fi
fi

echo ""

# Overall status
if [ "$dev_servers_running" = true ] && [ "$tunnel_running" = true ]; then
    echo "🚀 GiftGenie is fully operational!"
elif [ "$dev_servers_running" = true ]; then
    echo "⚠️  GiftGenie development servers are running but tunnel is down"
    echo "   Run: ./scripts/start-webapp.sh to start tunnel"
elif [ "$tunnel_running" = true ]; then
    echo "⚠️  Tunnel is running but development servers are down"
    echo "   Run: ./scripts/start-webapp.sh to start servers"
else
    echo "❌ GiftGenie is not running"
    echo "   Run: ./scripts/start-webapp.sh to start"
fi

echo ""
echo "📋 Available commands:"
echo "   Start:   ./scripts/start-webapp.sh"
echo "   Stop:    ./scripts/stop-webapp.sh"
echo "   Restart: ./scripts/restart-webapp.sh"
echo "   Status:  ./scripts/status-webapp.sh"

if [ -d "$LOG_DIR" ]; then
    echo "   Logs:    tail -f logs/server.log logs/tunnel.log"
fi
echo ""
