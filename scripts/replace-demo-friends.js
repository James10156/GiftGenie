#!/usr/bin/env node

/**
 * Replace existing demo friends with new pop culture characters
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_3s9kISMirPwE@ep-winter-lake-abs0i486-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

console.log('🎭 Replacing demo friends with pop culture characters...\n');

async function replaceDemoFriends() {
  try {
    console.log('🔌 Connecting to Neon PostgreSQL database...');
    const sql = neon(DATABASE_URL);
    
    console.log('✅ Connected successfully\n');
    
    // First, clear existing demo friends (where user_id is NULL)
    console.log('🧹 Clearing existing demo friends...');
    await sql`DELETE FROM friends WHERE user_id IS NULL`;
    console.log('✅ Existing demo friends cleared\n');
    
    // Insert new pop culture character friends
    console.log('🎪 Inserting pop culture character friends...');
    
    const characters = [
      {
        name: 'Sherlock Holmes',
        personalityTraits: ['Analytical', 'Observant', 'Logical'],
        interests: ['Mystery solving', 'Violin', 'Chemistry'],
        category: 'friend',
        notes: 'The world\'s greatest consulting detective, known for his keen deductive reasoning and attention to detail',
        country: 'United Kingdom',
        currency: 'GBP',
        profilePicture: 'https://res.cloudinary.com/dwno2tfxm/image/upload/v1759418318/giftgenie/demo-friends/sherlock-holmes.svg',
        gender: 'Male',
        ageRange: '31-35',
        theme: 'elegant',
        daysAgo: 14
      },
      {
        name: 'Snow White',
        personalityTraits: ['Kind', 'Gentle', 'Optimistic'],
        interests: ['Nature', 'Cooking', 'Animals'],
        category: 'friend',
        notes: 'Known for her pure heart and ability to befriend all woodland creatures. Loves baking and forest walks',
        country: 'Germany',
        currency: 'EUR',
        profilePicture: 'https://res.cloudinary.com/dwno2tfxm/image/upload/v1759418320/giftgenie/demo-friends/snow-white.svg',
        gender: 'Female',
        ageRange: '18-25',
        theme: 'cherry-blossom',
        daysAgo: 30
      },
      {
        name: 'Tarzan',
        personalityTraits: ['Adventurous', 'Strong', 'Protective'],
        interests: ['Jungle exploration', 'Wildlife', 'Vine swinging'],
        category: 'friend',
        notes: 'Lord of the jungle who communicates with animals and protects the forest. Incredibly athletic and brave',
        country: 'United States',
        currency: 'USD',
        profilePicture: 'https://res.cloudinary.com/dwno2tfxm/image/upload/v1759418322/giftgenie/demo-friends/tarzan.svg',
        gender: 'Male',
        ageRange: '26-30',
        theme: 'jungle-vibes',
        daysAgo: 3
      },
      {
        name: 'Robin Hood',
        personalityTraits: ['Heroic', 'Generous', 'Clever'],
        interests: ['Archery', 'Forest life', 'Justice'],
        category: 'friend',
        notes: 'The legendary outlaw who steals from the rich to help the poor. Master archer and leader of the Merry Men',
        country: 'United Kingdom',
        currency: 'GBP',
        profilePicture: 'https://res.cloudinary.com/dwno2tfxm/image/upload/v1759418324/giftgenie/demo-friends/robin-hood.svg',
        gender: 'Male',
        ageRange: '26-30',
        theme: 'forest-green',
        daysAgo: 7
      },
      {
        name: 'Sleeping Beauty',
        personalityTraits: ['Graceful', 'Patient', 'Dreamy'],
        interests: ['Dancing', 'Spinning', 'Garden walks'],
        category: 'friend',
        notes: 'Known as Aurora or Briar Rose, she has a gift for bringing beauty and peace wherever she goes',
        country: 'France',
        currency: 'EUR',
        profilePicture: 'https://res.cloudinary.com/dwno2tfxm/image/upload/v1759418326/giftgenie/demo-friends/sleeping-beauty.svg',
        gender: 'Female',
        ageRange: '18-25',
        theme: 'rose-gold',
        daysAgo: 10
      },
      {
        name: 'Peter Pan',
        personalityTraits: ['Playful', 'Brave', 'Mischievous'],
        interests: ['Flying', 'Adventure', 'Storytelling'],
        category: 'friend',
        notes: 'The boy who never grows up, leader of the Lost Boys in Neverland. Can fly and loves exciting adventures',
        country: 'United Kingdom',
        currency: 'GBP',
        profilePicture: 'https://res.cloudinary.com/dwno2tfxm/image/upload/v1759418329/giftgenie/demo-friends/peter-pan.svg',
        gender: 'Male',
        ageRange: '18-25',
        theme: 'forest-green',
        daysAgo: 5
      }
    ];
    
    for (const character of characters) {
      await sql`
        INSERT INTO friends (
          user_id, name, personality_traits, interests, notes, 
          country, currency, profile_picture, category, gender, age_range, theme
        ) VALUES (
          NULL,
          ${character.name},
          ${JSON.stringify(character.personalityTraits)},
          ${JSON.stringify(character.interests)},
          ${character.notes},
          ${character.country},
          ${character.currency},
          ${character.profilePicture},
          ${character.category},
          ${character.gender},
          ${character.ageRange},
          ${character.theme}
        )
      `;
      console.log(`✅ Added ${character.name}`);
    }
    
    console.log('\n🎉 Successfully replaced demo friends with pop culture characters!');
    console.log('\nNew demo characters:');
    characters.forEach(char => {
      console.log(`   • ${char.name} (${char.personalityTraits.join(', ')})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the replacement
replaceDemoFriends().catch(console.error);