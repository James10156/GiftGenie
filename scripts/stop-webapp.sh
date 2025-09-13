#!/bin/bash

# GiftGenie Web App Stop Script
# This script stops the development servers and tunnel

set -e

LOG_DIR="logs"
DEV_PID_FILE="$LOG_DIR/webapp.pid"
TUNNEL_PID_FILE="$LOG_DIR/tunnel.pid"

# Function to stop process by PID file
stop_process() {
    local pid_file=$1
    local process_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping $process_name (PID: $pid)..."
            kill "$pid"
            
            # Wait for process to stop
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                echo "Force killing $process_name..."
                kill -9 "$pid" 2>/dev/null || true
            fi
            
            echo "✅ $process_name stopped"
        else
            echo "⚠️  $process_name was not running"
        fi
        rm -f "$pid_file"
    else
        echo "⚠️  No PID file found for $process_name"
    fi
}

echo "🛑 Stopping GiftGenie Web App (Development Mode)..."

# Stop tunnel first
stop_process "$TUNNEL_PID_FILE" "Serveo tunnel"

# Also kill any SSH processes to serveo
pkill -f "ssh.*serveo.net" 2>/dev/null && echo "✅ Killed remaining serveo processes" || true

# Stop development servers
stop_process "$DEV_PID_FILE" "Development servers"

# Also kill any remaining development processes
pkill -f "npm run dev" 2>/dev/null && echo "✅ Killed remaining npm dev processes" || true
pkill -f "concurrently" 2>/dev/null && echo "✅ Killed remaining concurrently processes" || true
pkill -f "tsx server/index.ts" 2>/dev/null && echo "✅ Killed remaining tsx processes" || true
pkill -f "vite.*--port 3000" 2>/dev/null && echo "✅ Killed remaining vite processes" || true

# Clean up URL file
rm -f "$LOG_DIR/public_url.txt"

echo ""
echo "✅ GiftGenie has been stopped successfully!"
echo ""
