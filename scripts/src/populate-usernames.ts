import { db } from '@workspace/db';
import { usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';

const USERNAMES: Record<number, string> = {
  1: 'food_explorer',
  2: 'tabaq_user2',
  3: 'noura_alrashid',
  4: 'faisal_alsaud',
  5: 'lama_alotaibi',
  6: 'sultan_alghamdi',
  7: 'rawan_alharbi',
  8: 'ahmed_aldosari',
  9: 'fatima_alzahrani',
  10: 'khalid_almalki',
  11: 'sara_almutairi',
  12: 'omar_alshehri',
};

async function main() {
  for (const [idStr, username] of Object.entries(USERNAMES)) {
    const id = Number(idStr);
    await db.update(usersTable).set({ username }).where(eq(usersTable.id, id));
    console.log(`✓ id=${id} → @${username}`);
  }
  console.log('\nAll usernames populated!');
}

main().catch(console.error);
