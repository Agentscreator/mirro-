import { db } from './index';
import { usersTable, thoughtsTable } from './schema';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';

const GENDERS = ['Male', 'Female', 'Non-Binary'];
const PREFERENCES = ['Male', 'Female', 'No Preference'];
const PROXIMITIES = ['Local', 'Metro', 'Countrywide', 'Global'];

function randomEmbedding(): string {
  const vector = Array.from({ length: 1536 }, () => parseFloat((Math.random() * 2 - 1).toFixed(6)));
  return JSON.stringify(vector);
}

async function seedUsers(count: number) {
  for (let i = 0; i < count; i++) {
    const id = uuidv4();
    const gender = faker.helpers.arrayElement(GENDERS);
    const genderPreference = faker.helpers.arrayElement(PREFERENCES);

const user = {
  username: faker.internet.userName(),
  nickname: faker.person.firstName(), // added nickname
  email: faker.internet.email(),
  password: faker.internet.password(),
  dob: faker.date.birthdate({ min: 20, max: 45, mode: 'age' }).toISOString().split('T')[0],
  gender,
  genderPreference,
  preferredAgeMin: faker.number.int({ min: 20, max: 30 }),
  preferredAgeMax: faker.number.int({ min: 31, max: 45 }),
  proximity: faker.helpers.arrayElement(PROXIMITIES),
  latitude: faker.location.latitude({ max: 50, min: 25 }),
  longitude: faker.location.longitude({ max: -60, min: -125 }),
  timezone: 'America/New_York',
  metro_area: 'New York',
};


    await db.insert(usersTable).values(user);

    await db.insert(thoughtsTable).values({
      userId: id,
      content: faker.lorem.paragraph(),
      embedding: randomEmbedding(),
    });

    console.log(`👤 Seeded user ${user.username}`);
  }

  console.log('✅ All users seeded');
}

seedUsers(10).catch((err) => {
  console.error('❌ Seeding failed:', err);
});
