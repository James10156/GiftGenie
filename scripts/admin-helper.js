#!/usr/bin/env node

/**
 * Advanced script to find and promote users to admin
 * Usage: node scripts/admin-helper.js <action> <username> [password]
 * 
 * Actions:
 *   lookup <username>           - Get user ID for username
 *   promote <username>          - Promote user to admin (requires login first)
 *   login-and-promote <username> <password> - Login as user and promote them to admin
 */

import http from 'http';
import { fileURLToPath } from 'url';

const action = process.argv[2];
const username = process.argv[3];
const password = process.argv[4];

if (!action || !username) {
  console.log('🛠️  GiftGenie Admin Helper\n');
  console.log('Usage:');
  console.log('  node scripts/admin-helper.js lookup <username>');
  console.log('  node scripts/admin-helper.js promote <username>');
  console.log('  node scripts/admin-helper.js login-and-promote <username> <password>');
  console.log('\nExamples:');
  console.log('  node scripts/admin-helper.js lookup admin');
  console.log('  node scripts/admin-helper.js login-and-promote admin mypassword');
  process.exit(1);
}

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function loginUser(username, password) {
  console.log(`🔐 Attempting to login as "${username}"...`);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options, { username, password });
    
    if (response.statusCode === 200) {
      console.log('✅ Login successful!');
      console.log(`👤 User ID: ${response.body.id}`);
      console.log(`🔑 Admin status: ${response.body.isAdmin || false}`);
      
      // Extract session cookie
      const cookies = response.headers['set-cookie'];
      return {
        success: true,
        userId: response.body.id,
        isAdmin: response.body.isAdmin,
        cookies: cookies
      };
    } else {
      console.log(`❌ Login failed: ${response.body?.message || 'Unknown error'}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ Login error: ${error.message}`);
    return { success: false };
  }
}

async function promoteUser(userId, cookies = null) {
  console.log(`📈 Promoting user ${userId} to admin...`);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/promote-admin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (cookies) {
    options.headers.Cookie = cookies.join('; ');
    console.log(`🍪 Using cookies: ${cookies.join('; ')}`);
  }
  
  console.log(`📤 Sending request to promote user: ${userId}`);
  
  try {
    const response = await makeRequest(options, { userId });
    
    console.log(`📥 Response status: ${response.statusCode}`);
    console.log(`📥 Response body:`, response.body);
    
    if (response.statusCode === 200) {
      console.log('✅ User promoted to admin successfully!');
      console.log(`👑 ${response.body.user.username} is now an admin`);
      console.log('\n🎉 Next steps:');
      console.log('1. Refresh the browser page');
      console.log('2. Look for the "Analytics" tab in navigation');
      console.log('3. Click Analytics to access the dashboard!');
      return { success: true };
    } else {
      console.log(`❌ Promotion failed (${response.statusCode}): ${response.body?.message || response.body || 'Unknown error'}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ Promotion error: ${error.message}`);
    console.log(`❌ Full error:`, error);
    return { success: false };
  }
}

async function main() {
  console.log(`\n🛠️  GiftGenie Admin Helper - ${action.toUpperCase()}\n`);
  
  switch (action) {
    case 'lookup':
      console.log(`🔍 To lookup USER_ID for "${username}":`);
      console.log('\n1. If logged in as this user in browser:');
      console.log('   curl -X GET http://localhost:5000/api/auth/me --cookie-jar cookies.txt --cookie cookies.txt');
      console.log('\n2. Or use the login-and-promote action instead:');
      console.log(`   node scripts/admin-helper.js login-and-promote ${username} <password>`);
      break;
      
    case 'promote':
      console.log(`⚠️  To promote "${username}", you need their USER_ID.`);
      console.log('Either:');
      console.log(`1. Use: node scripts/admin-helper.js login-and-promote ${username} <password>`);
      console.log('2. Or get the USER_ID first and use the curl command from promote-admin.js');
      break;
      
    case 'login-and-promote':
      if (!password) {
        console.log('❌ Password is required for login-and-promote action');
        console.log(`Usage: node scripts/admin-helper.js login-and-promote ${username} <password>`);
        process.exit(1);
      }
      
      const loginResult = await loginUser(username, password);
      if (loginResult.success) {
        if (loginResult.isAdmin) {
          console.log('ℹ️  User is already an admin!');
        } else {
          await promoteUser(loginResult.userId, loginResult.cookies);
        }
      }
      break;
      
    default:
      console.log(`❌ Unknown action: ${action}`);
      console.log('Valid actions: lookup, promote, login-and-promote');
  }
}

// Check if server is running
const serverCheck = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/me',
  method: 'GET',
  timeout: 1000
};

const req = http.request(serverCheck, () => {
  main().catch(console.error);
});

req.on('error', () => {
  console.log('❌ Server not running! Please start the server first:');
  console.log('   npm run dev');
  console.log('\nThen run this script again.');
});

req.end();