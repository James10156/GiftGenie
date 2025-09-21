#!/usr/bin/env node

/**
 * Database migration script to add category column to existing friends table
 * Run this to fix friends table for the new category functionality
 */

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// Load environment variables
config();

console.log('🔧 GiftGenie Database Migration: Adding category column to friends table\n');

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL environment variable not found');
  console.log('This migration is only needed for PostgreSQL databases.');
  console.log('If you\'re using memory storage, restart the server instead.');
  process.exit(1);
}

console.log('✅ Found DATABASE_URL, connecting to PostgreSQL...\n');

try {
  // Initialize database connection
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log('🔍 Checking current friends table structure...\n');

  // Check if category column exists
  const checkColumnQuery = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'friends' 
    AND column_name = 'category';
  `;

  const columnExists = await sql(checkColumnQuery);
  
  if (columnExists.length > 0) {
    console.log('✅ Column category already exists in friends table');
    console.log('The issue might be with the application code or restart needed.\n');
  } else {
    console.log('❌ Column category does not exist. Adding it now...\n');
    
    // Add the category column
    const addColumnQuery = `
      ALTER TABLE friends 
      ADD COLUMN category TEXT DEFAULT 'friend' NOT NULL;
    `;
    
    await sql(addColumnQuery);
    console.log('✅ Successfully added category column to friends table\n');
    
    // Update existing friends to have category = 'friend'
    const updateExistingQuery = `
      UPDATE friends 
      SET category = 'friend' 
      WHERE category IS NULL;
    `;
    
    const updateResult = await sql(updateExistingQuery);
    console.log(`✅ Updated ${updateResult.length} existing friends with category = 'friend'\n`);
  }

  // Show current friends
  console.log('👥 Current friends in database:');
  const friends = await sql('SELECT id, name, category, user_id FROM friends LIMIT 10');
  
  if (friends.length === 0) {
    console.log('   No friends found in database\n');
  } else {
    console.log('');
    friends.forEach(friend => {
      const userId = friend.user_id ? friend.user_id.substring(0, 8) + '...' : 'null';
      console.log(`   • ${friend.name} (Category: ${friend.category}, User: ${userId})`);
    });
    console.log('');
    if (friends.length === 10) {
      console.log('   (Showing first 10 friends...)\n');
    }
  }

  // Check for unique categories
  console.log('🏷️  Existing categories:');
  const categories = await sql('SELECT DISTINCT category FROM friends WHERE category IS NOT NULL ORDER BY category');
  
  if (categories.length === 0) {
    console.log('   No categories found\n');
  } else {
    console.log('');
    categories.forEach(cat => {
      console.log(`   • ${cat.category}`);
    });
    console.log('');
  }

  console.log('🎉 Migration completed successfully!\n');
  console.log('📋 Next steps:');
  console.log('1. Restart your server to pick up the changes');
  console.log('2. Try adding friends with custom categories');
  console.log('3. Test that category suggestions work');
  console.log('\nExample:');
  console.log('   ./scripts/restart-webapp.sh');
  console.log('   # Then test adding friends with categories like "Work Friends", "Family", etc.');

} catch (error) {
  console.error('❌ Migration failed:');
  console.error('Error:', error.message);
  console.error('\n💡 Manual fix:');
  console.error('Connect to your Neon database and run:');
  console.error('   ALTER TABLE friends ADD COLUMN category TEXT DEFAULT \'friend\' NOT NULL;');
  console.error('   UPDATE friends SET category = \'friend\' WHERE category IS NULL;');
  process.exit(1);
}