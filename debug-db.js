import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

// Load environment variables
config();

const sql = neon(process.env.DATABASE_URL);

async function checkDatabase() {
  try {
    console.log('🔍 Checking database structure and data...');
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? 'Connected' : 'Not found');
    
    // Check what columns exist in users table
    console.log('\n📋 Users table structure:');
    const userColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    console.log('Users columns:', userColumns);
    
    // Check what columns exist in friends table
    console.log('\n📋 Friends table structure:');
    const friendColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'friends'
      ORDER BY ordinal_position
    `;
    console.log('Friends columns:', friendColumns);
    
    // Check all users (without specifying columns first)
    console.log('\n👥 All users:');
    const allUsers = await sql`SELECT * FROM users LIMIT 5`;
    console.log('Users:', allUsers);
    
    // Check all friends
    console.log('\n👫 All friends:');
    const allFriends = await sql`SELECT * FROM friends LIMIT 10`;
    console.log('Friends:', allFriends);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

checkDatabase();