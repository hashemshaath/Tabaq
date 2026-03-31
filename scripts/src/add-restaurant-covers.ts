import { db } from '@workspace/db';
import { restaurantsTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';

const COVERS: Record<number, string> = {
  // Najd Village — traditional Saudi majlis/heritage interior
  1: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop',
  // Reem Al Bawadi — warm Levantine dining hall, mezze spread
  2: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=800&fit=crop',
  // Sushi Sama — elegant Japanese sushi counter
  3: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=1200&h=800&fit=crop',
  // Lusin — upscale Mediterranean/Armenian restaurant interior
  4: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=800&fit=crop',
  // Spice Route — vibrant Indian/Asian spices and dishes
  5: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=1200&h=800&fit=crop',
  // Al Tazaj — charcoal grilled chicken, casual Saudi eatery
  6: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&h=800&fit=crop',
  // Nobu — high-end modern Japanese dining room
  7: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&h=800&fit=crop',
  // Karak House — warm tea-house atmosphere, karak chai
  8: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&h=800&fit=crop',
};

async function main() {
  console.log('Updating restaurant cover images...');
  for (const [id, url] of Object.entries(COVERS)) {
    await db.update(restaurantsTable)
      .set({ coverImageUrl: url })
      .where(eq(restaurantsTable.id, Number(id)));
    console.log(`  ✓ Restaurant ${id} → ${url.slice(0, 60)}…`);
  }
  console.log(`\nDone — ${Object.keys(COVERS).length} restaurants updated.`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
