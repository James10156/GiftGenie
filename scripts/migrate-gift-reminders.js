#!/usr/bin/env node

/**
 * Safe migration script for adding gift reminders functionality
 * This script adds only the new columns and tables without affecting existing data
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  console.log('🔄 Starting gift reminders migration...\n');

  try {
    // 1. Add notification preferences to users table (if not exists)
    console.log('📧 Adding notification preferences to users table...');
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS notification_preferences JSONB 
      DEFAULT '{
        "email": {"enabled": false, "address": ""},
        "sms": {"enabled": false, "phoneNumber": ""},
        "push": {"enabled": false},
        "defaultAdvanceDays": 7
      }'::jsonb;
    `;
    console.log('✅ Users notification preferences added');

    // 2. Create gift_reminders table (if not exists)
    console.log('⏰ Creating gift_reminders table...');
    await sql`
      CREATE TABLE IF NOT EXISTS gift_reminders (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id VARCHAR NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
        saved_gift_id VARCHAR REFERENCES saved_gifts(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        reminder_date TEXT NOT NULL,
        occasion_date TEXT,
        occasion_type TEXT,
        notification_methods JSONB NOT NULL,
        message TEXT,
        advance_days INTEGER DEFAULT 7,
        status TEXT NOT NULL DEFAULT 'active',
        is_recurring BOOLEAN DEFAULT false,
        last_sent_at TEXT,
        snooze_until TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Gift reminders table created');

    // 3. Create indexes (if not exists)
    console.log('📊 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_reminders_user_id ON gift_reminders(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_reminders_friend_id ON gift_reminders(friend_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_reminders_reminder_date ON gift_reminders(reminder_date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_reminders_status ON gift_reminders(status);`;
    console.log('✅ Indexes created');

    // 4. Verify the migration
    console.log('🔍 Verifying migration...');
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'gift_reminders'
      );
    `;
    
    const columnCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'notification_preferences'
      );
    `;

    if (tableCheck[0].exists && columnCheck[0].exists) {
      console.log('✅ Migration verification successful!');
      console.log('\n🎉 Gift reminders functionality has been added to the database!');
      console.log('\n📋 Summary:');
      console.log('   • gift_reminders table created');
      console.log('   • notification_preferences column added to users');
      console.log('   • Indexes created for performance');
      console.log('   • Ready for Phase 1 implementation');
    } else {
      throw new Error('Migration verification failed');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration().catch(console.error);