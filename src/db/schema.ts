//src/db/schema.ts

import {
  pgTable,
  pgEnum,
  varchar,
  integer,
  uuid,
  date,
  text,
  timestamp,
  real,
  boolean,
} from "drizzle-orm/pg-core";

/* ENUMS */
export const tagCategoryEnum = pgEnum("tag_category", [
  "interest",
  "context",
  "intention",
]);

/* TABLES */

// Users (updated with new fields)
export const usersTable = pgTable("users", {
  id:               uuid("id").primaryKey().defaultRandom(),
  username:         varchar("username", { length: 100 }).notNull(),
  nickname:         varchar("nickname", { length: 100 }),
  email:            varchar("email", { length: 255 }).notNull(),
  password:         varchar("password", { length: 255 }).notNull(),
  dob:              date("dob").notNull(),
  gender:           varchar("gender", { length: 20 }).notNull(),
  genderPreference: varchar("genderPreference", { length: 20 }).notNull(),
  preferredAgeMin:  integer("preferredAgeMin").notNull(),
  preferredAgeMax:  integer("preferredAgeMax").notNull(),
  proximity:        varchar("proximity", { length: 20 }).notNull(),
  timezone:         varchar("timezone", { length: 100 }).notNull(),
  metro_area:       varchar("metro_area", { length: 100 }).notNull(),
  latitude:         real("latitude").notNull(),
  longitude:        real("longitude").notNull(),
  profileImage:     varchar("profile_image", { length: 500 }),
  about:            text("about"),
  created_at:       timestamp("created_at").defaultNow(),
  updated_at:       timestamp("updated_at").defaultNow(),
  image:            varchar("image", { length: 500 }), 
});


// Tags
export const tagsTable = pgTable("tags", {
  id:       integer().primaryKey().generatedAlwaysAsIdentity(),
  name:     varchar({ length: 100 }).notNull().unique(),
  category: tagCategoryEnum("tag_category").notNull(),
});

// User–Tag Mapping
export const userTagsTable = pgTable("user_tags", {
  id:     integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("userId").notNull().references(() => usersTable.id),
  tagId:  integer("tag_id").notNull().references(() => tagsTable.id),
});

// Thoughts
export const thoughtsTable = pgTable("thoughts", {
  id:        integer().primaryKey().generatedAlwaysAsIdentity(),
  userId:    uuid("userId").notNull().references(() => usersTable.id),
  content:   text().notNull(),
  embedding: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Posts
export const postsTable = pgTable("posts", {
  id:        integer().primaryKey().generatedAlwaysAsIdentity(),
  userId:    uuid("userId").notNull().references(() => usersTable.id),
  content:   text().notNull(),
  image:     varchar("image", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Post Likes
export const postLikesTable = pgTable("post_likes", {
  id:       integer().primaryKey().generatedAlwaysAsIdentity(),
  postId:   integer("post_id").notNull().references(() => postsTable.id),
  userId:   uuid("userId").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Post Comments
export const postCommentsTable = pgTable("post_comments", {
  id:       integer().primaryKey().generatedAlwaysAsIdentity(),
  postId:   integer("post_id").notNull().references(() => postsTable.id),
  userId:   uuid("userId").notNull().references(() => usersTable.id),
  content:  text().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Followers/Following
export const followersTable = pgTable("followers", {
  id:          integer().primaryKey().generatedAlwaysAsIdentity(),
  followerId:  uuid("follower_id").notNull().references(() => usersTable.id),
  followingId: uuid("following_id").notNull().references(() => usersTable.id),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// Profile Visitors
export const profileVisitorsTable = pgTable("profile_visitors", {
  id:        integer().primaryKey().generatedAlwaysAsIdentity(),
  profileId: uuid("profile_id").notNull().references(() => usersTable.id),
  visitorId: uuid("visitor_id").notNull().references(() => usersTable.id),
  visitedAt: timestamp("visited_at").defaultNow().notNull(),
});