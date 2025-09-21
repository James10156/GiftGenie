#!/usr/bin/env node

/**
 * Script to check users in the database
 * Usage: node scripts/check-users.js
 */

import http from 'http';

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

async function checkServer() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      timeout: 2000
    });
    return response.statusCode !== undefined;
  } catch (error) {
    return false;
  }
}

async function testRegistration() {
  console.log('🧪 Testing registration with a new user...\n');
  
  const testUsername = `testuser_${Date.now()}`;
  const testPassword = 'password123';
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      username: testUsername,
      password: testPassword
    });
    
    if (response.statusCode === 201) {
      console.log(`✅ Registration successful for: ${testUsername}`);
      console.log(`👤 User data:`, response.body);
      console.log(`🔑 Admin status: ${response.body?.isAdmin || false}`);
      return { success: true, user: response.body };
    } else {
      console.log(`❌ Registration failed (${response.statusCode}): ${response.body?.message || response.body}`);
      return { success: false, error: response.body };
    }
  } catch (error) {
    console.log(`❌ Registration error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testLogin(username, password) {
  console.log(`🔐 Testing login for: ${username}...\n`);
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      username,
      password
    });
    
    if (response.statusCode === 200) {
      console.log(`✅ Login successful for: ${username}`);
      console.log(`👤 User data:`, response.body);
      console.log(`🔑 Admin status: ${response.body?.isAdmin || false}`);
      return { success: true, user: response.body };
    } else {
      console.log(`❌ Login failed (${response.statusCode}): ${response.body?.message || response.body}`);
      return { success: false, error: response.body };
    }
  } catch (error) {
    console.log(`❌ Login error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔍 GiftGenie User Database Checker\n');
  
  // Check if server is running
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server is not running on localhost:5000');
    console.log('Please start the server first:');
    console.log('   npm run dev');
    console.log('   # or');
    console.log('   ./scripts/start-webapp.sh');
    return;
  }
  
  console.log('✅ Server is running on localhost:5000\n');
  
  // Check storage type
  console.log('📊 Storage Information:');
  console.log('- If DATABASE_URL is set: Using PostgreSQL');
  console.log('- If no DATABASE_URL: Using in-memory storage (resets on restart)\n');
  
  // Test registration
  const regResult = await testRegistration();
  
  if (regResult.success) {
    console.log('\n🎉 Registration is working! The schema changes are applied correctly.\n');
  } else {
    console.log('\n⚠️  Registration is still failing. Schema issues persist.\n');
  }
  
  // Test existing users
  console.log('🧪 Testing existing users:\n');
  
  const existingUsers = ['admin', 'demo'];
  
  for (const username of existingUsers) {
    console.log(`--- Testing user: ${username} ---`);
    
    // Try common passwords
    const passwords = ['admin1234', 'password', 'demo', username];
    
    let loginSuccess = false;
    for (const password of passwords) {
      const loginResult = await testLogin(username, password);
      if (loginResult.success) {
        loginSuccess = true;
        break;
      }
    }
    
    if (!loginSuccess) {
      console.log(`⚠️  Could not login as ${username} with common passwords`);
      console.log(`   Tried: ${passwords.join(', ')}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('💡 Summary:');
  if (regResult.success) {
    console.log('✅ User registration/login system is working');
    console.log('✅ Schema changes applied successfully');
    console.log('📝 You can create new users and promote them to admin');
    console.log('\n🚀 Next steps:');
    console.log('1. Create a new admin user:');
    console.log('   curl -X POST http://localhost:5000/api/auth/register \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"username": "newadmin", "password": "admin1234"}\'');
    console.log('');
    console.log('2. Promote to admin:');
    console.log('   node scripts/admin-helper.js login-and-promote newadmin admin1234');
  } else {
    console.log('❌ User system is not working properly');
    console.log('📋 Try restarting the server to apply schema changes');
  }
}

main().catch(console.error);