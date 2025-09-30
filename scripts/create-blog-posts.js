#!/usr/bin/env node

import { neon } from "@neondatabase/serverless";
import dotenv from 'dotenv';

dotenv.config();

async function createBlogPosts() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log("🔄 Creating blog posts...");

    // Get admin user
    const adminUsers = await sql`SELECT id, username FROM users WHERE is_admin = true LIMIT 1`;
    
    if (adminUsers.length === 0) {
      console.error("❌ No admin user found. Please create an admin user first.");
      process.exit(1);
    }

    const adminUser = adminUsers[0];

    // Meet the Team blog post
    const meetTheTeamContent = `<div style="text-align: center; margin: 20px 0;">
  <img src="https://lh3.googleusercontent.com/d/1Q-ajDpjTJ89u7eetmPpPyPHVRv5uu9ny" alt="Gift Genie Team" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
</div>

# Meet the Gift Genie Team! 👋

We're thrilled to introduce you to the passionate team behind Gift Genie! Our mission is simple: make gift-giving easier, more thoughtful, and more meaningful for everyone.

## Our Story

Gift Genie was born from a simple observation - finding the perfect gift shouldn't be stressful. We've all been there: standing in a store or scrolling through endless online catalogs, wondering what would truly make our loved ones happy.

## What Drives Us

🎯 **Personalization First**: We believe every gift should reflect the unique personality and interests of the recipient.

🤖 **AI-Powered Intelligence**: Our advanced AI analyzes personality traits and interests to suggest gifts that truly resonate.

💝 **Meaningful Connections**: We're not just about products - we're about strengthening relationships through thoughtful giving.

## Our Vision

We envision a world where gift-giving brings pure joy - both for the giver and receiver. No more last-minute panic purchases or gifts that end up forgotten in a drawer. Every recommendation from Gift Genie is crafted to create those special moments that strengthen our connections with the people we care about.

Thank you for being part of our journey. Together, we're making gift-giving magical again! ✨`;

    // Halloween blog post
    const halloweenContent = `<div style="text-align: center; margin: 20px 0;">
  <img src="https://lh3.googleusercontent.com/d/1PkjqVrjRa1akP-gs6wyDF101Gr5WhEas" alt="Halloween Gifts" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
</div>

# Spooktacular Gift Ideas for Halloween! 🎃👻

Halloween is just around the corner, and it's the perfect time to surprise your friends and family with some delightfully spooky gifts! Whether you're shopping for a horror movie fanatic, a costume enthusiast, or someone who just loves the autumn vibes, we've got you covered.

## For the Horror Enthusiasts 🧛‍♀️

- **Classic Horror Movie Collection**: Curated sets of iconic scary movies
- **Spooky Board Games**: Perfect for Halloween game nights
- **Gothic Home Decor**: Year-round pieces for those who love the dark aesthetic
- **Horror Book Collections**: From Stephen King classics to modern thrillers

## For the Costume Lovers 🎭

- **DIY Costume Kits**: Creative supplies for unique, handmade costumes
- **Professional Makeup Sets**: Special effects makeup for realistic transformations
- **Vintage Costume Accessories**: Authentic pieces that complete any look
- **Costume Storage Solutions**: Keep those amazing outfits organized year-round

## For the Autumn Enthusiasts 🍂

- **Pumpkin Spice Everything**: From candles to gourmet treats
- **Cozy Fall Blankets**: Perfect for chilly October nights
- **Seasonal Craft Kits**: DIY projects for autumn decorating
- **Fall Scented Products**: Candles, diffusers, and bath products with autumn aromas

## Gift Genie's Halloween Magic ✨

Our AI can help you find the perfect Halloween gift by analyzing your friend's personality:

- **For the Creative Type**: Art supplies for spooky crafts and DIY decorations
- **For the Social Butterfly**: Party hosting supplies and group costume ideas
- **For the Homebody**: Cozy Halloween-themed home goods and treats
- **For the Adventurer**: Tickets to haunted attractions and spooky experiences

## Pro Tips for Halloween Gift-Giving 🎁

1. **Consider their comfort level** - Not everyone loves scary things! Some prefer cute over creepy.
2. **Think beyond October** - Choose items they can enjoy year-round, not just during Halloween.
3. **Personal touches matter** - Add a handwritten note with Halloween jokes or memories.
4. **Experience gifts rock** - Sometimes the best gift is making memories together at a haunted house or Halloween party.

Ready to find the perfect Halloween gift? Let Gift Genie's AI help you discover something that matches your friend's personality perfectly. Because the best treats aren't always candy! 🍬

Happy Halloween from all of us at Gift Genie! 👻🎃`;

    // Insert Meet the Team post
    await sql`
      INSERT INTO blog_posts (title, content, excerpt, author_id, published)
      VALUES (
        'Meet the Gift Genie Team!',
        ${meetTheTeamContent},
        'Get to know the passionate team behind Gift Genie and learn about our mission to make gift-giving more meaningful.',
        ${adminUser.id},
        true
      )
      ON CONFLICT DO NOTHING
    `;

    // Insert Halloween post
    await sql`
      INSERT INTO blog_posts (title, content, excerpt, author_id, published)
      VALUES (
        'Spooktacular Gift Ideas for Halloween!',
        ${halloweenContent},
        'Discover amazing Halloween gift ideas for every type of person, from horror enthusiasts to autumn lovers.',
        ${adminUser.id},
        true
      )
      ON CONFLICT DO NOTHING
    `;

    console.log("✅ Blog posts created successfully!");
    console.log("📝 Created 'Meet the Gift Genie Team!' blog post");
    console.log("🎃 Created 'Spooktacular Gift Ideas for Halloween!' blog post");

  } catch (error) {
    console.error("❌ Failed to create blog posts:", error);
    process.exit(1);
  }
}

createBlogPosts();