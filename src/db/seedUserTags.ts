import { db } from './index'; // adjust if your db client is named differently
import { usersTable, tagsTable, userTagsTable } from './schema';
import { eq } from 'drizzle-orm';

async function seedUserTags() {
  try {
    const users = await db.select().from(usersTable);
    const tags = await db.select().from(tagsTable);

    if (tags.length < 3) {
      throw new Error('Not enough tags in database. Need at least 3.');
    }

    const userTagInserts = [];

    for (const user of users) {
      // Randomly select 3 unique tags
      const selectedTags = [...tags].sort(() => 0.5 - Math.random()).slice(0, 3);

      for (const tag of selectedTags) {
        userTagInserts.push({
          userId: user.id,
          tagId: tag.id,
        });
      }
    }

    await db.insert(userTagsTable).values(userTagInserts);
    console.log('✅ UserTags seed complete');
  } catch (err) {
    console.error('❌ UserTags seed failed:', err);
  }
}

seedUserTags();
