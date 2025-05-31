import 'dotenv/config';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { usersTable } from './db/schema';

async function main() {
const user = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'test1234',
  dob: '1995-05-16',
  gender: 'Male',
  genderPreference: 'Female',
  preferredAgeMin: 25,
  preferredAgeMax: 35,
  proximity: 'Metro Area',
  timezone: 'America/New_York',     // or another valid IANA timezone
  metro_area: 'New York',           // or another city name
  latitude: 40.7128,                // a float for geolocation
  longitude: -74.0060,              // a float for geolocation
};

  await db.insert(usersTable).values(user);

  const users = await db.select().from(usersTable);
  console.log(users);

  await db.update(usersTable)
    .set({ preferredAgeMin: 27 })
    .where(eq(usersTable.email, user.email));

  await db.delete(usersTable).where(eq(usersTable.email, user.email));
}
main();
