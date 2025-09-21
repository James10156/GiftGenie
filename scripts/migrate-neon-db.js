#!/usr/bin/env node

/**
 * Direct database migration script using your specific DATABASE_URL
 * This will add the missing is_admin column to your Neon PostgreSQL database
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_3s9kISMirPwE@ep-winter-lake-abs0i486-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

console.log('🔧 GiftGenie Database Migration: Adding isAdmin column\n');

async function runMigration() {
  try {
    console.log('🔌 Connecting to Neon PostgreSQL database...');
    const sql = neon(DATABASE_URL);
    
    console.log('✅ Connected successfully\n');
    
    // Check if is_admin column exists
    console.log('🔍 Checking if is_admin column exists...');
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_admin'
    `;
    
    if (columnCheck.length > 0) {
      console.log('✅ is_admin column already exists');
      console.log('📊 Checking existing users...\n');
    } else {
      console.log('➕ Adding is_admin column to users table...');
      
      // Add the is_admin column with default value false
      await sql`
        ALTER TABLE users 
        ADD COLUMN is_admin BOOLEAN DEFAULT false
      `;
      
      console.log('✅ is_admin column added successfully\n');
    }
    
    // Update any existing users to have is_admin = false (in case they were NULL)
    console.log('🔄 Ensuring all existing users have is_admin set...');
    const updateResult = await sql`
      UPDATE users 
      SET is_admin = false 
      WHERE is_admin IS NULL
    `;
    
    console.log(`✅ Updated ${updateResult.length} users with default is_admin value\n`);
    
    // Show current users
    console.log('👥 Current users in database:');
    const users = await sql`
      SELECT id, username, is_admin, 
             SUBSTRING(id, 1, 8) || '...' as short_id
      FROM users 
      ORDER BY username
    `;
    
    if (users.length === 0) {
      console.log('   No users found in database');
    } else {
      console.log('   ┌─────────────┬──────────────┬─────────┐');
      console.log('   │ Username    │ Short ID     │ isAdmin │');
      console.log('   ├─────────────┼──────────────┼─────────┤');
      
      users.forEach(user => {
        const username = user.username.padEnd(11);
        const shortId = user.short_id.padEnd(12);
        const isAdmin = user.is_admin ? '✅ Yes' : '❌ No ';
        console.log(`   │ ${username} │ ${shortId} │ ${isAdmin}  │`);
      });
      
      console.log('   └─────────────┴──────────────┴─────────┘');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your server to ensure changes are picked up');
    console.log('2. Test login with existing users');
    console.log('3. Use admin-helper.js to promote users to admin');
    console.log('\nExample:');
    console.log('  node scripts/admin-helper.js login-and-promote admin admin1234');
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error('Error:', error.message);
    console.error('\nPossible solutions:');
    console.error('1. Check if DATABASE_URL is correct');
    console.error('2. Ensure database connection is working');
    console.error('3. Verify you have permissions to ALTER TABLE');
  }
}

runMigration();