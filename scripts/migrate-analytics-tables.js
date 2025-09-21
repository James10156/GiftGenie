#!/usr/bin/env node

/**
 * Migration script to create analytics tables in PostgreSQL
 */

import pkg from 'pg';
import dotenv from 'dotenv';

const { Client } = pkg;

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function createAnalyticsTables() {
  console.log('🔧 Creating analytics tables in PostgreSQL database...\n');

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create user_analytics table
    console.log('\n📊 Creating user_analytics table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_analytics (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        page TEXT,
        component TEXT,
        metadata JSONB,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ user_analytics table created');

    // Create recommendation_feedback table
    console.log('\n👍 Creating recommendation_feedback table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS recommendation_feedback (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        friend_id VARCHAR,
        gift_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        feedback TEXT,
        recommendation_data JSONB,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ recommendation_feedback table created');

    // Create performance_metrics table
    console.log('\n⚡ Creating performance_metrics table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        operation TEXT NOT NULL,
        response_time_ms INTEGER NOT NULL,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        metadata JSONB,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ performance_metrics table created');

    // Verify tables exist
    console.log('\n🔍 Verifying table creation...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_analytics', 'recommendation_feedback', 'performance_metrics')
      ORDER BY table_name;
    `);

    console.log('📋 Analytics tables in database:');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    if (result.rows.length === 3) {
      console.log('\n🎉 All analytics tables created successfully!');
    } else {
      console.log('\n⚠️  Some tables may not have been created properly.');
    }

  } catch (error) {
    console.error('❌ Error creating analytics tables:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
createAnalyticsTables().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});