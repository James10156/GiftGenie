#!/usr/bin/env node

/**
 * Database migration script to fix existing users without isAdmin field
 * Run this after schema changes to update existing data
 */

import http from 'http';

console.log('🔧 GiftGenie Database Migration Tool\n');

// Check if server is running first
function checkServer() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => resolve(false));
    req.end();
  });
}

async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running on localhost:5000');
    console.log('Please start the server first:');
    console.log('   npm run dev');
    console.log('   # or');
    console.log('   ./scripts/start-webapp.sh');
    return;
  }

  console.log('✅ Server detected on localhost:5000\n');
  
  console.log('🔍 Diagnosis for authentication issues:\n');
  
  console.log('1. **Schema Changes**: We added isAdmin field to users table');
  console.log('2. **Existing Users**: Your "admin" and "demo" users might not have this field');
  console.log('3. **Storage Type**: Check if you\'re using memory or database storage\n');
  
  console.log('🛠️  Solutions to try:\n');
  
  console.log('**Option 1: Fresh Start (Easiest)**');
  console.log('If using memory storage (no DATABASE_URL):');
  console.log('  1. Restart server (this clears memory storage)');
  console.log('  2. Register new accounts');
  console.log('  3. Use admin helper to promote users\n');
  
  console.log('**Option 2: Database Migration (If using PostgreSQL)**');
  console.log('If using DATABASE_URL:');
  console.log('  1. Connect to your database');
  console.log('  2. Run: UPDATE users SET isAdmin = false WHERE isAdmin IS NULL;');
  console.log('  3. Restart server\n');
  
  console.log('**Option 3: Manual Test**');
  console.log('  1. Try registering a completely new user:');
  console.log('     curl -X POST http://localhost:5000/api/auth/register \\');
  console.log('       -H "Content-Type: application/json" \\');
  console.log('       -d \'{"username": "testuser123", "password": "password123"}\'');
  console.log('');
  console.log('  2. If new registration works, the issue is with existing users');
  console.log('  3. If new registration fails, there\'s a deeper schema issue\n');
  
  console.log('**Option 4: Restart with Clean State**');
  console.log('  1. Stop the server');
  console.log('  2. If using memory storage, just restart');
  console.log('  3. If using database, optionally clear users table:');
  console.log('     DELETE FROM users; (⚠️  This removes all users!)');
  console.log('  4. Restart server');
  console.log('  5. Register fresh accounts\n');
  
  console.log('🧪 **Recommended Testing Steps:**');
  console.log('  1. Try Option 3 (manual test) first');
  console.log('  2. If that fails, try Option 1 (fresh start)');
  console.log('  3. Then use: node scripts/admin-helper.js login-and-promote <username> <password>');
}

main().catch(console.error);