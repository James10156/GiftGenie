#!/usr/bin/env node

import { neon } from "@neondatabase/serverless";
import dotenv from 'dotenv';

dotenv.config();

async function convertBlogPostsToMarkdown() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log("🔄 Converting blog posts to markdown format...");

    // Meet the Team blog post - convert to markdown
    const meetTheTeamContent = `![Gift Genie Team](https://lh3.googleusercontent.com/d/1Q-ajDpjTJ89u7eetmPpPyPHVRv5uu9ny)

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

    // Halloween blog post - convert to markdown
    const halloweenContent = `![Halloween Gifts](https://lh3.googleusercontent.com/d/1PkjqVrjRa1akP-gs6wyDF101Gr5WhEas)

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

    // Update Meet the Team post
    await sql`
      UPDATE blog_posts 
      SET content = ${meetTheTeamContent},
          updated_at = CURRENT_TIMESTAMP
      WHERE title = 'Meet the Gift Genie Team!'
    `;

    // Update Halloween post
    await sql`
      UPDATE blog_posts 
      SET content = ${halloweenContent},
          updated_at = CURRENT_TIMESTAMP
      WHERE title = 'Spooktacular Gift Ideas for Halloween!'
    `;

    console.log("✅ Blog posts converted to markdown format successfully!");
    console.log("📝 Updated 'Meet the Gift Genie Team!' blog post");
    console.log("🎃 Updated 'Spooktacular Gift Ideas for Halloween!' blog post");

  } catch (error) {
    console.error("❌ Failed to convert blog posts:", error);
    process.exit(1);
  }
}

convertBlogPostsToMarkdown();