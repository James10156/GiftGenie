#!/usr/bin/env node

/**
 * Simple script to promote a user to admin status
 * Usage: node scripts/promote-admin.js <username>
 */

const username = process.argv[2];

if (!username) {
  console.error('Usage: node scripts/promote-admin.js <username>');
  process.exit(1);
}

console.log(`\n🔧 To promote user "${username}" to admin status:`);
console.log('\n1. First, register or login as the user you want to promote');
console.log('2. Then make a POST request to /api/auth/promote-admin with the userId');
console.log('\nExample using curl:');
console.log(`curl -X POST http://localhost:5000/api/auth/promote-admin \\
  -H "Content-Type: application/json" \\
  -d '{"userId": "USER_ID_HERE"}' \\
  --cookie-jar cookies.txt \\
  --cookie cookies.txt`);

console.log('\n📝 Note: In production, this endpoint should require existing admin authorization.');
console.log('For demo purposes, any authenticated user can promote others to admin.');

console.log('\n🔍 To find the userId:');
console.log('1. Login to the app');
console.log('2. Check browser dev tools -> Application -> Session Storage -> giftgenie-session-id');
console.log('3. Or make a GET request to /api/auth/me to get current user info');

console.log('\n✨ Once promoted, the user will see an "Analytics" tab in the navigation!');