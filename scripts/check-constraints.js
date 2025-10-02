#!/usr/bin/env node

/**
 * Check constraints on friends table
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_3s9kISMirPwE@ep-winter-lake-abs0i486-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkConstraints() {
  try {
    console.log('🔌 Connecting to database...');
    const sql = neon(DATABASE_URL);
    
    console.log('📋 Checking constraints on friends table...');
    const constraints = await sql`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'friends'::regclass
    `;
    
    console.log('\nConstraints:');
    constraints.forEach(constraint => {
      console.log(`- ${constraint.conname}: ${constraint.definition}`);
    });
    
    console.log('\nSample age_range values from existing friends:');
    const ageRanges = await sql`
      SELECT DISTINCT age_range 
      FROM friends 
      WHERE age_range IS NOT NULL
      ORDER BY age_range
    `;
    
    ageRanges.forEach(range => {
      console.log(`- "${range.age_range}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkConstraints();