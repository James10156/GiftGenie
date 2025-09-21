// Test authentication error feedback
// This script demonstrates the improved error messages

console.log("🧪 Testing Authentication Error Feedback\n");

const BASE_URL = "http://localhost:5000";

async function testLogin(username, password, description) {
  console.log(`📝 Test: ${description}`);
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success: ${result.username} logged in`);
    } else {
      console.log(`❌ Error (${response.status}): ${result.message}`);
    }
  } catch (error) {
    console.log(`💥 Network Error: ${error.message}`);
  }
  console.log("");
}

async function runTests() {
  // Test 1: Empty credentials
  await testLogin("", "", "Empty username and password");
  
  // Test 2: Nonexistent user
  await testLogin("nonexistent", "password123", "User that doesn't exist");
  
  // Test 3: Existing user with wrong password (using the test user we created)
  await testLogin("testuser", "wrongpassword", "Existing user with wrong password");
  
  // Test 4: Successful login
  await testLogin("testuser", "testpass123", "Correct credentials");
}

runTests().catch(console.error);