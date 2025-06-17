import { sql } from "drizzle-orm"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { db } from "../../db"

export async function up() {
  await db.execute(sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
  `)
}

export async function down() {
  await db.execute(sql`
    ALTER TABLE users
    DROP COLUMN IF EXISTS reset_token,
    DROP COLUMN IF EXISTS reset_token_expiry;
  `)
} 