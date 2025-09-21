#!/usr/bin/env node

import { neon } from "@neondatabase/serverless";
import dotenv from 'dotenv';

dotenv.config();

async function checkBlogPosts() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log("🔍 Checking blog posts...");

    const posts = await sql`
      SELECT 
        bp.id, 
        bp.title, 
        bp.published,
        bp.created_at,
        u.username as author
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      ORDER BY bp.created_at DESC
    `;

    console.log(`📝 Found ${posts.length} blog posts:`);
    posts.forEach((post, index) => {
      console.log(`  ${index + 1}. "${post.title}" by ${post.author} (${post.published ? 'Published' : 'Draft'})`);
    });

  } catch (error) {
    console.error("❌ Failed to check blog posts:", error);
  }
}

checkBlogPosts();