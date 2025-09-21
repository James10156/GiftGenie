#!/usr/bin/env node

/**
 * Test script to verify guest user isolation
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testGuestUserIsolation() {
  console.log('🧪 Testing Guest User Isolation\n');

  try {
    // Simulate two different guest users (different browser sessions)
    console.log('1️⃣ Creating first guest user session...');
    
    // Guest User 1 - Create a friend
    const guest1Response = await fetch(`${BASE_URL}/api/friends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Guest 1 Friend - Alice',
        personalityTraits: ['Creative', 'Thoughtful'],
        interests: ['Reading', 'Art'],
        currency: 'USD',
        country: 'United States'
      })
    });

    if (!guest1Response.ok) {
      console.error('❌ Guest 1 friend creation failed:', await guest1Response.text());
      return;
    }

    const guest1Friend = await guest1Response.json();
    console.log('✅ Guest 1 created friend:', guest1Friend.name);
    
    // Get session cookie for guest 1
    const guest1Cookie = guest1Response.headers.get('set-cookie')?.split(';')[0];

    console.log('\n2️⃣ Creating second guest user session...');
    
    // Guest User 2 - Create a different friend (new session, no cookie)
    const guest2Response = await fetch(`${BASE_URL}/api/friends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Guest 2 Friend - Bob',
        personalityTraits: ['Sporty', 'Adventurous'],
        interests: ['Hiking', 'Sports'],
        currency: 'EUR',
        country: 'Germany'
      })
    });

    if (!guest2Response.ok) {
      console.error('❌ Guest 2 friend creation failed:', await guest2Response.text());
      return;
    }

    const guest2Friend = await guest2Response.json();
    console.log('✅ Guest 2 created friend:', guest2Friend.name);
    
    // Get session cookie for guest 2
    const guest2Cookie = guest2Response.headers.get('set-cookie')?.split(';')[0];

    console.log('\n3️⃣ Testing isolation - Guest 1 should only see their friend...');
    
    // Guest 1 - Fetch all friends (should only see Alice)
    const guest1FriendsResponse = await fetch(`${BASE_URL}/api/friends`, {
      headers: guest1Cookie ? { 'Cookie': guest1Cookie } : {}
    });

    if (!guest1FriendsResponse.ok) {
      console.error('❌ Failed to fetch Guest 1 friends:', await guest1FriendsResponse.text());
      return;
    }

    const guest1Friends = await guest1FriendsResponse.json();
    console.log(`📋 Guest 1 sees ${guest1Friends.length} friend(s):`, guest1Friends.map(f => f.name));

    console.log('\n4️⃣ Testing isolation - Guest 2 should only see their friend...');
    
    // Guest 2 - Fetch all friends (should only see Bob)
    const guest2FriendsResponse = await fetch(`${BASE_URL}/api/friends`, {
      headers: guest2Cookie ? { 'Cookie': guest2Cookie } : {}
    });

    if (!guest2FriendsResponse.ok) {
      console.error('❌ Failed to fetch Guest 2 friends:', await guest2FriendsResponse.text());
      return;
    }

    const guest2Friends = await guest2FriendsResponse.json();
    console.log(`📋 Guest 2 sees ${guest2Friends.length} friend(s):`, guest2Friends.map(f => f.name));

    console.log('\n5️⃣ Testing cross-access prevention...');
    
    // Guest 1 tries to access Guest 2's friend by ID
    const crossAccessResponse = await fetch(`${BASE_URL}/api/friends/${guest2Friend.id}`, {
      headers: guest1Cookie ? { 'Cookie': guest1Cookie } : {}
    });

    if (crossAccessResponse.status === 404) {
      console.log('✅ Cross-access prevention working - Guest 1 cannot see Guest 2\'s friend');
    } else {
      console.log('❌ Security issue - Guest 1 can access Guest 2\'s friend!');
    }

    console.log('\n📊 Test Results:');
    console.log(`   - Guest 1 friends: ${guest1Friends.length} (expected: 1)`);
    console.log(`   - Guest 2 friends: ${guest2Friends.length} (expected: 1)`);
    console.log(`   - Cross-access blocked: ${crossAccessResponse.status === 404 ? '✅' : '❌'}`);
    
    if (guest1Friends.length === 1 && guest2Friends.length === 1 && crossAccessResponse.status === 404) {
      console.log('\n🎉 Guest User Isolation Test PASSED!');
      console.log('✅ Each guest user can only see their own data');
      console.log('✅ Cross-access between guest sessions is prevented');
    } else {
      console.log('\n❌ Guest User Isolation Test FAILED!');
      console.log('⚠️  Data leakage detected between guest users');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testGuestUserIsolation();