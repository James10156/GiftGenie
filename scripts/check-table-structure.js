#!/usr/bin/env node

/**
 * Check the friends table structure
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_3s9kISMirPwE@ep-winter-lake-abs0i486-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkTableStructure() {
  try {
    console.log('🔌 Connecting to database...');
    const sql = neon(DATABASE_URL);
    
    console.log('📋 Checking friends table structure...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'friends'
      ORDER BY ordinal_position
    `;
    
    console.log('\nColumns in friends table:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    console.log('\nSample friend record:');
    const sample = await sql`SELECT * FROM friends LIMIT 1`;
    if (sample.length > 0) {
      console.log(sample[0]);
    } else {
      console.log('No friends found in table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTableStructure();