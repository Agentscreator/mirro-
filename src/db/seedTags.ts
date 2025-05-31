import { db } from "./index"; // your drizzle db instance
import { tagsTable, tagCategoryEnum } from "./schema";

async function seedTags() {
  const tags = [
    // Intention Tags
    { name: "Make meaningful connections", category: "intention" },
    { name: "Share your story", category: "intention" },
    { name: "Reflect & grow", category: "intention" },
    { name: "Navigate change", category: "intention" },
    { name: "Celebrate joy", category: "intention" },
    { name: "Find or offer support", category: "intention" },
    { name: "Explore big ideas", category: "intention" },
    { name: "Be creative together", category: "intention" },
    { name: "Learn from each other", category: "intention" },
    { name: "Uplift and be uplifted", category: "intention" },
    { name: "Build shared purpose", category: "intention" },
    { name: "Simply be yourself", category: "intention" },

    // Context Tags
    { name: "Experiencing burnout", category: "context" },
    { name: "Starting fresh", category: "context" },
    { name: "Navigating change", category: "context" },
    { name: "New to a place", category: "context" },
    { name: "Healing from loss", category: "context" },
    { name: "Looking for meaning", category: "context" },
    { name: "Feeling overwhelmed", category: "context" },
    { name: "Celebrating success", category: "context" },
    { name: "Facing uncertainty", category: "context" },
    { name: "Entering adulthood", category: "context" },
    { name: "Career crossroads", category: "context" },
    { name: "Reinventing my path", category: "context" },
    { name: "Launching a project", category: "context" },
    { name: "Seeking belonging", category: "context" },
    { name: "Feeling disconnected", category: "context" },

    // Interest Tags
    { name: "Life & meaning", category: "interest" },
    { name: "Mental well-being", category: "interest" },
    { name: "Relationships & connection", category: "interest" },
    { name: "Culture & identity", category: "interest" },
    { name: "Spirituality & faith", category: "interest" },
    { name: "Books & stories", category: "interest" },
    { name: "Climate & sustainability", category: "interest" },
    { name: "Music & sound", category: "interest" },
    { name: "Art & creativity", category: "interest" },
    { name: "Science & innovation", category: "interest" },
    { name: "Tech & digital life", category: "interest" },
    { name: "Social impact & justice", category: "interest" },
    { name: "Business & entrepreneurship", category: "interest" },
    { name: "Learning & education", category: "interest" },
    { name: "Philosophy & ideas", category: "interest" },
    { name: "Parenting & caregiving", category: "interest" },
    { name: "Love & heartbreak", category: "interest" },
    { name: "Migration & home", category: "interest" },
    { name: "Food & traditions", category: "interest" },
    { name: "Politics & society", category: "interest" },
  ];

  for (const tag of tags) {
    try {

        await db.insert(tagsTable)
        .values(tags as { name: string; category: 'intention' | 'context' | 'interest' }[])
        .onConflictDoNothing()
        .execute();

    } catch (err) {
      console.error(`Failed to insert tag ${tag.name}:`, err);
    }
  }

  console.log("Tags seed complete!");
}

seedTags();
