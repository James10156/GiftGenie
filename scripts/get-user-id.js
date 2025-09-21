#!/usr/bin/env node

/**
 * Script to get the USER_ID of a specified user
 * Usage: node scripts/get-user-id.js <username>
 */

const username = process.argv[2];

if (!username) {
  console.error('Usage: node scripts/get-user-id.js <username>');
  console.error('Example: node scripts/get-user-id.js admin');
  process.exit(1);
}

console.log(`\n🔍 Getting USER_ID for username: "${username}"`);
console.log('\n📋 Methods to get USER_ID:\n');

console.log('1️⃣ **If you\'re logged in as this user in the browser:**');
console.log('   curl -X GET http://localhost:5000/api/auth/me \\');
console.log('     --cookie-jar cookies.txt \\');
console.log('     --cookie cookies.txt');

console.log('\n2️⃣ **If you need to login first via API:**');
console.log('   # Login');
console.log('   curl -X POST http://localhost:5000/api/auth/login \\');
console.log('     -H "Content-Type: application/json" \\');
console.log(`     -d '{"username": "${username}", "password": "YOUR_PASSWORD"}' \\`);
console.log('     --cookie-jar cookies.txt');
console.log('');
console.log('   # Then get user info');
console.log('   curl -X GET http://localhost:5000/api/auth/me \\');
console.log('     --cookie cookies.txt');

console.log('\n3️⃣ **Manual method via browser:**');
console.log(`   1. Login as "${username}" in the browser`);
console.log('   2. Open Developer Tools (F12)');
console.log('   3. Go to Network tab');
console.log('   4. Make any request (like switching tabs)');
console.log('   5. Look for any API request headers to see user info');

console.log('\n4️⃣ **Database query (if using PostgreSQL):**');
console.log('   If you have direct database access:');
console.log(`   SELECT id FROM users WHERE username = '${username}';`);

console.log('\n📝 **Once you have the USER_ID, promote to admin with:**');
console.log('   curl -X POST http://localhost:5000/api/auth/promote-admin \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"userId": "PASTE_USER_ID_HERE"}\' \\');
console.log('     --cookie-jar cookies.txt \\');
console.log('     --cookie cookies.txt');

console.log('\n✨ **Quick workflow:**');
console.log(`1. node scripts/get-user-id.js ${username}`);
console.log('2. Copy one of the curl commands above');
console.log('3. Run it to get the USER_ID');
console.log('4. Use that USER_ID in the promote-admin endpoint');
console.log('5. Refresh browser to see Analytics tab!');