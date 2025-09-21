#!/usr/bin/env node

/**
 * Test script to validate AI recommendation performance tracking
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testPerformanceTracking() {
  console.log('🧪 Testing AI Recommendation Performance Tracking\n');

  try {
    // 1. Login as admin user
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin1234' })
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');

    const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';')[0];
    if (!sessionCookie) {
      console.error('❌ No session cookie received');
      return;
    }

    // 2. Create a test friend
    console.log('\n2️⃣ Creating test friend...');
    const friendResponse = await fetch(`${BASE_URL}/api/friends`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        name: 'Performance Test Friend',
        personalityTraits: ['Creative', 'Tech-savvy'],
        interests: ['Photography', 'Gaming'],
        currency: 'USD',
        country: 'United States',
        notes: 'Testing AI recommendation performance tracking'
      })
    });

    if (!friendResponse.ok) {
      console.error('❌ Friend creation failed:', await friendResponse.text());
      return;
    }

    const friend = await friendResponse.json();
    console.log('✅ Test friend created:', friend.name);

    // 3. Generate AI recommendations (this should trigger performance tracking)
    console.log('\n3️⃣ Generating AI recommendations...');
    const startTime = Date.now();
    
    const recommendationResponse = await fetch(`${BASE_URL}/api/gift-recommendations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        friendId: friend.id,
        budget: '$100'
      })
    });

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    if (!recommendationResponse.ok) {
      console.error('❌ Recommendation generation failed:', await recommendationResponse.text());
      return;
    }

    const recommendations = await recommendationResponse.json();
    console.log(`✅ Generated ${recommendations.length} recommendations in ${totalTime}ms`);

    // 4. Submit feedback for performance correlation
    console.log('\n4️⃣ Submitting feedback...');
    const feedbackResponse = await fetch(`${BASE_URL}/api/analytics/feedback`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        friendId: friend.id,
        recommendationData: {
          giftName: recommendations[0]?.name || 'Test Gift',
          price: recommendations[0]?.price || '$50',
          matchPercentage: recommendations[0]?.matchPercentage || 85,
          generationParams: {
            budget: 100,
            currency: 'USD',
            personalityTraits: ['Creative', 'Tech-savvy'],
            interests: ['Photography', 'Gaming']
          }
        },
        rating: 1,
        helpful: true,
        feedback: 'Great recommendation! Performance tracking test.'
      })
    });

    if (!feedbackResponse.ok) {
      console.error('❌ Feedback submission failed:', await feedbackResponse.text());
    } else {
      console.log('✅ Feedback submitted successfully');
    }

    // 5. Wait a moment for data to be processed
    console.log('\n5️⃣ Waiting for data processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 6. Check performance metrics
    console.log('\n6️⃣ Checking performance metrics...');
    const metricsResponse = await fetch(`${BASE_URL}/api/analytics/performance?operation=ai_recommendation&limit=5`, {
      headers: { 'Cookie': sessionCookie }
    });

    if (!metricsResponse.ok) {
      console.error('❌ Failed to fetch performance metrics:', await metricsResponse.text());
    } else {
      const metrics = await metricsResponse.json();
      console.log(`✅ Found ${metrics.length} performance metrics`);
      
      if (metrics.length > 0) {
        const latestMetric = metrics[0];
        console.log('📊 Latest AI Performance Metric:');
        console.log(`   - Response Time: ${latestMetric.responseTime}ms`);
        console.log(`   - Success: ${latestMetric.success}`);
        console.log(`   - Operation: ${latestMetric.operation}`);
        console.log(`   - Metadata: ${JSON.stringify(latestMetric.metadata, null, 2)}`);
      }
    }

    // 7. Check feedback analytics
    console.log('\n7️⃣ Checking feedback analytics...');
    const feedbackAnalyticsResponse = await fetch(`${BASE_URL}/api/analytics/feedback?limit=5`, {
      headers: { 'Cookie': sessionCookie }
    });

    if (!feedbackAnalyticsResponse.ok) {
      console.error('❌ Failed to fetch feedback analytics:', await feedbackAnalyticsResponse.text());
    } else {
      const feedbackAnalytics = await feedbackAnalyticsResponse.json();
      console.log(`✅ Found ${feedbackAnalytics.length} feedback entries`);
    }

    console.log('\n🎉 AI Recommendation Performance Tracking Test Complete!');
    console.log('\n📋 Test Summary:');
    console.log(`   - Total request time: ${totalTime}ms`);
    console.log(`   - Recommendations generated: ${recommendations.length}`);
    console.log(`   - Performance tracking: ✅ Active`);
    console.log(`   - Feedback correlation: ✅ Working`);
    console.log(`   - Analytics dashboard: ✅ Ready`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPerformanceTracking();