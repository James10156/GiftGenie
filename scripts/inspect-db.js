#!/usr/bin/env node

/**
 * Direct database inspection script
 * This bypasses the API to check the database directly
 */

import { MemStorage } from '../server/storage.js';
import { storageAdapter } from '../server/storage-adapter.js';

console.log('🔍 Direct Database Inspection\n');

try {
  // Try to inspect the storage directly
  console.log('📊 Storage Adapter Info:');
  console.log('- Storage type: ' + (process.env.DATABASE_URL ? 'PostgreSQL' : 'Memory'));
  
  if (process.env.DATABASE_URL) {
    console.log('- Database URL: ' + process.env.DATABASE_URL.substring(0, 20) + '...');
  }
  
  console.log('\n🧪 Testing storage operations...\n');
  
  // Test user creation directly
  try {
    const testUser = await storageAdapter.createUser({
      username: 'direct_test_' + Date.now(),
      password: 'hashedpassword123',
      isAdmin: false
    });
    
    console.log('✅ Direct user creation successful:');
    console.log('  ID:', testUser.id);
    console.log('  Username:', testUser.username);
    console.log('  isAdmin:', testUser.isAdmin);
    
    // Try to get the user back
    const retrievedUser = await storageAdapter.getUser(testUser.id);
    if (retrievedUser) {
      console.log('✅ User retrieval successful');
    } else {
      console.log('❌ User retrieval failed');
    }
    
  } catch (error) {
    console.log('❌ Direct storage operation failed:');
    console.log('  Error:', error.message);
    console.log('  Stack:', error.stack);
  }
  
} catch (error) {
  console.log('❌ Failed to access storage:');
  console.log('  Error:', error.message);
  console.log('  This might indicate a module loading issue');
}

console.log('\n💡 If direct storage works but API fails:');
console.log('  - The issue is in the API layer (auth.ts, routes.ts)');
console.log('  - Check for runtime errors in server logs');
console.log('  - Server needs to be restarted to pick up changes');
console.log('\n💡 If direct storage fails:');
console.log('  - The issue is in the storage/database layer');
console.log('  - Schema changes may not be properly applied');
console.log('  - Database migration may be needed');