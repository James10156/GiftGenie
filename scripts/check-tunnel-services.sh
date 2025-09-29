#!/bin/bash

# GiftGenie Tunnel Services Checker
# This script checks which tunnel services are available on your system

echo "🔍 Checking available tunnel services..."
echo ""

# Check Serveo (SSH-based, no installation needed)
echo "1. Serveo (SSH-based):"
if timeout 5 ssh -o ConnectTimeout=5 -o BatchMode=yes serveo.net exit 2>/dev/null; then
    echo "   ✅ Available - SSH connection successful"
else
    echo "   ❌ Not available - SSH connection failed"
fi
echo ""

# Check ngrok
echo "2. ngrok:"
if command -v ngrok &> /dev/null; then
    echo "   ✅ Installed - $(ngrok version 2>/dev/null | head -1 || echo 'version unknown')"
else
    echo "   ❌ Not installed - Install from: https://ngrok.com/download"
fi
echo ""

# Check Cloudflared
echo "3. Cloudflared:"
if command -v cloudflared &> /dev/null; then
    echo "   ✅ Installed - $(cloudflared version 2>/dev/null || echo 'version unknown')"
else
    echo "   ❌ Not installed - Install from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
fi
echo ""

# Check bore
echo "4. bore.pub:"
if command -v bore &> /dev/null; then
    echo "   ✅ Installed - $(bore --version 2>/dev/null || echo 'version unknown')"
elif command -v cargo &> /dev/null; then
    echo "   ⚠️  Not installed but Rust/cargo is available - Will be auto-installed if needed"
else
    echo "   ❌ Not available - Requires Rust and cargo (install from: https://rustup.rs/)"
fi
echo ""

# Check LocalTunnel (npm-based)
echo "5. LocalTunnel:"
if command -v lt &> /dev/null; then
    echo "   ✅ Installed - $(lt --version 2>/dev/null || echo 'version unknown')"
elif command -v npm &> /dev/null; then
    echo "   ⚠️  Not installed but npm is available - Will be auto-installed if needed"
else
    echo "   ❌ Not available - Requires Node.js and npm"
fi
echo ""

# Check localhost.run
echo "6. localhost.run (SSH-based):"
if timeout 5 ssh -o ConnectTimeout=5 -o BatchMode=yes localhost.run exit 2>/dev/null; then
    echo "   ✅ Available - SSH connection successful"
else
    echo "   ❌ Not available - SSH connection failed"
fi
echo ""

echo "📋 Summary:"
echo "The start-webapp.sh script will try these services in order until one works."
echo "For best reliability, consider installing ngrok or cloudflared as backups."
echo ""