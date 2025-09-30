#!/usr/bin/env node

/**
 * Database migration script to add isAdmin column to existing users table
 * Run this to fix the "column is_admin does not exist" error
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

console.log('🔧 GiftGenie Database Migration: Adding isAdmin column\n');

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

  console.log('🔍 Checking current table structure...\n');

  // Check if is_admin column exists
  const checkColumnQuery = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'is_admin';
  `;

  const columnExists = await sql(checkColumnQuery);
  
  if (columnExists.length > 0) {
    console.log('✅ Column is_admin already exists in users table');
    console.log('The issue might be with the application code or restart needed.\n');
  } else {
    console.log('❌ Column is_admin does not exist. Adding it now...\n');
    
    // Add the is_admin column
    const addColumnQuery = `
      ALTER TABLE users 
      ADD COLUMN is_admin BOOLEAN DEFAULT false;
    `;
    
    await sql(addColumnQuery);
    console.log('✅ Successfully added is_admin column to users table\n');
    
    // Update existing users to have is_admin = false
    const updateExistingQuery = `
      UPDATE users 
      SET is_admin = false 
      WHERE is_admin IS NULL;
    `;
    
    const updateResult = await sql(updateExistingQuery);
    console.log(`✅ Updated ${updateResult.length} existing users with is_admin = false\n`);
  }

  // Show current users
  console.log('👥 Current users in database:');
  const users = await sql('SELECT id, username, is_admin FROM users');
  
  if (users.length === 0) {
    console.log('   No users found in database\n');
  } else {
    console.log('');
    users.forEach(user => {
      console.log(`   • ${user.username} (ID: ${user.id.substring(0, 8)}..., Admin: ${user.is_admin})`);
    });
    console.log('');
  }

  console.log('🎉 Migration completed successfully!\n');
  console.log('📋 Next steps:');
  console.log('1. Restart your server to pick up the changes');
  console.log('2. Try logging in with existing users');
  console.log('3. Use admin-helper.js to promote users to admin');
  console.log('\nExample:');
  console.log('   ./scripts/restart-server.sh');
  console.log('   node scripts/admin-helper.js login-and-promote admin admin1234');

} catch (error) {
  console.error('❌ Migration failed:');
  console.error('Error:', error.message);
  console.error('\n💡 Manual fix:');
  console.error('Connect to your Neon database and run:');
  console.error('   ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;');
  console.error('   UPDATE users SET is_admin = false WHERE is_admin IS NULL;');
  process.exit(1);
}