#!/usr/bin/env node

/**
 * Test script to simulate multiple browser sessions accessing the web app
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function simulateBrowserSessions() {
  console.log('🌐 Simulating Multiple Browser Sessions\n');

  try {
    // Simulate different browser sessions by not sharing cookies
    const sessions = [];

    for (let i = 1; i <= 3; i++) {
      console.log(`🔗 Session ${i}: Simulating new browser tab/window...`);
      
      // Each session creates a friend without using previous session cookies
      const friendResponse = await fetch(`${BASE_URL}/api/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Session ${i} User`,
          personalityTraits: ['Creative'],
          interests: ['Technology'],
          currency: 'USD',
          country: 'United States'
        })
      });

      if (!friendResponse.ok) {
        console.error(`❌ Session ${i} failed:`, await friendResponse.text());
        continue;
      }

      const friend = await friendResponse.json();
      const sessionCookie = friendResponse.headers.get('set-cookie')?.split(';')[0];
      
      sessions.push({
        id: i,
        friend,
        cookie: sessionCookie
      });

      console.log(`✅ Session ${i} created friend: ${friend.name} (ID: ${friend.id})`);
    }

    console.log('\n📊 Testing session isolation...');

    // Each session should only see their own friend
    for (const session of sessions) {
      const friendsResponse = await fetch(`${BASE_URL}/api/friends`, {
        headers: session.cookie ? { 'Cookie': session.cookie } : {}
      });

      if (friendsResponse.ok) {
        const friends = await friendsResponse.json();
        console.log(`Session ${session.id}: Sees ${friends.length} friend(s) - ${friends.map(f => f.name).join(', ')}`);
        
        if (friends.length !== 1 || friends[0].id !== session.friend.id) {
          console.log(`❌ Session ${session.id} has incorrect data isolation!`);
        } else {
          console.log(`✅ Session ${session.id} isolation working correctly`);
        }
      }
    }

    console.log('\n🔒 Testing cross-session access prevention...');

    // Try to access other sessions' data
    for (let i = 0; i < sessions.length; i++) {
      for (let j = 0; j < sessions.length; j++) {
        if (i !== j) {
          const response = await fetch(`${BASE_URL}/api/friends/${sessions[j].friend.id}`, {
            headers: sessions[i].cookie ? { 'Cookie': sessions[i].cookie } : {}
          });
          
          if (response.status === 404) {
            console.log(`✅ Session ${sessions[i].id} cannot access Session ${sessions[j].id}'s data`);
          } else {
            console.log(`❌ Security breach: Session ${sessions[i].id} can access Session ${sessions[j].id}'s data!`);
          }
        }
      }
    }

    console.log('\n🎯 Test Summary:');
    console.log('This test simulates what happens when multiple people access');
    console.log('your GiftGenie web app link from different browsers/devices.');
    console.log('Each person should only see their own friends and saved gifts.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
simulateBrowserSessions();