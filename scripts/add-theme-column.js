#!/usr/bin/env node

/**
 * Add theme column to friends table
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_3s9kISMirPwE@ep-winter-lake-abs0i486-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

console.log('🔧 GiftGenie Database Migration: Adding theme column to friends table\n');

async function runMigration() {
  try {
    console.log('🔌 Connecting to Neon PostgreSQL database...');
    const sql = neon(DATABASE_URL);
    
    console.log('✅ Connected successfully\n');
    
    // Check if theme column exists
    console.log('🔍 Checking if theme column exists...');
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'friends' AND column_name = 'theme'
    `;
    
    if (columnCheck.length > 0) {
      console.log('✅ theme column already exists');
      return;
    }
    
    console.log('➕ Adding theme column to friends table...');
    await sql`ALTER TABLE friends ADD COLUMN theme text DEFAULT 'default'`;
    
    console.log('✅ Migration completed successfully!');
    console.log('Theme column added to friends table with default value "default"');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
runMigration().catch(console.error);