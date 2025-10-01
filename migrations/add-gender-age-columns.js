#!/usr/bin/env node

/**
 * Database migration script to add gender and ageRange columns to the friends table
 * Run this script to add the new optional fields for improved gift recommendations
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function addGenderAgeColumns() {
  try {
    console.log("🔄 Starting migration: Adding gender and ageRange columns to friends table...");

    // Add gender column (can be "Male", "Female", or null)
    await pool.query(`
      ALTER TABLE friends 
      ADD COLUMN IF NOT EXISTS gender TEXT;
    `);
    console.log("✅ Added gender column to friends table");

    // Add ageRange column (can be age ranges like "18-25", "26-30", etc., or null)
    await pool.query(`
      ALTER TABLE friends 
      ADD COLUMN IF NOT EXISTS age_range TEXT;
    `);
    console.log("✅ Added age_range column to friends table");

    // Add check constraints for valid values
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'friends_gender_check') THEN
          ALTER TABLE friends ADD CONSTRAINT friends_gender_check CHECK (gender IS NULL OR gender IN ('Male', 'Female'));
        END IF;
      END $$;
    `);
    console.log("✅ Added gender validation constraint");

    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'friends_age_range_check') THEN
          ALTER TABLE friends ADD CONSTRAINT friends_age_range_check CHECK (age_range IS NULL OR age_range IN (
            '18-25', '26-30', '31-35', '36-40', '41-45', 
            '46-50', '51-55', '56-60', '61-65', '66-70', '70+'
          ));
        END IF;
      END $$;
    `);
    console.log("✅ Added age range validation constraint");

    // Verify the columns were added
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'friends' 
      AND column_name IN ('gender', 'age_range')
      ORDER BY column_name;
    `);

    console.log("\n📋 New columns added:");
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log("\n🎉 Migration completed successfully!");
    console.log("   The friends table now supports optional gender and age range fields.");
    console.log("   Existing friends will have NULL values for these fields by default.");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  addGenderAgeColumns().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}

export { addGenderAgeColumns };