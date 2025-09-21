#!/usr/bin/env node

import { neon } from "@neondatabase/serverless";
import dotenv from 'dotenv';

dotenv.config();

async function addBlogPostsTable() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log("🔄 Adding blog_posts table...");

    // Create the blog_posts table
    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        author_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        published BOOLEAN NOT NULL DEFAULT true,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log("✅ blog_posts table created successfully");

    // Check if we have any existing admin users to create a sample blog post
    const adminUsers = await sql`SELECT id, username FROM users WHERE is_admin = true LIMIT 1`;
    
    if (adminUsers.length > 0) {
      const adminUser = adminUsers[0];
      
      // Create a sample blog post
      await sql`
        INSERT INTO blog_posts (title, content, author_id, published)
        VALUES (
          'Welcome to Gift Genie!',
          'Welcome to the Gift Genie blog! We''re excited to share updates, gift-giving tips, and insights about finding the perfect presents for your loved ones.

Gift Genie uses AI to help you discover thoughtful gifts that match your friends'' personalities and interests. Whether you''re shopping for a birthday, holiday, or just because, we''re here to make gift-giving easier and more meaningful.

Stay tuned for more updates as we continue to improve your gift-giving experience!',
          $1,
          true
        )
        ON CONFLICT DO NOTHING
      ` [adminUser.id];
      
      console.log(`✅ Sample blog post created by admin user: ${adminUser.username}`);
    } else {
      console.log("ℹ️  No admin users found. Sample blog post not created.");
    }

    console.log("🎉 Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

addBlogPostsTable();