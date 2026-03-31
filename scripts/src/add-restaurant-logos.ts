import { db } from '@workspace/db';
import { restaurantsTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';

const LOGOS: { id: number; nameEn: string; logoUrl: string }[] = [
  {
    id: 1,
    nameEn: 'Najd Village',
    // Traditional Saudi/Najdi rustic wooden decor — warm tones
    logoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop&crop=center',
  },
  {
    id: 2,
    nameEn: 'Reem Al Bawadi',
    // Lebanese mezze / Middle-Eastern spread
    logoUrl: 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=200&h=200&fit=crop&crop=center',
  },
  {
    id: 3,
    nameEn: 'Sushi Sama',
    // Japanese sushi close-up
    logoUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=200&h=200&fit=crop&crop=center',
  },
  {
    id: 4,
    nameEn: 'Lusin',
    // Armenian / fine-dining plated lamb
    logoUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop&crop=center',
  },
  {
    id: 5,
    nameEn: 'Spice Route',
    // Indian / spice market / biryani
    logoUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop&crop=center',
  },
  {
    id: 6,
    nameEn: 'Al Tazaj',
    // Grilled chicken / BBQ
    logoUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&h=200&fit=crop&crop=center',
  },
  {
    id: 7,
    nameEn: 'Nobu',
    // Japanese fine-dining / black cod / elegant plating
    logoUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=200&h=200&fit=crop&crop=center',
  },
  {
    id: 8,
    nameEn: 'Karak House',
    // Karak tea / chai / hot drink
    logoUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=200&h=200&fit=crop&crop=center',
  },
];

async function main() {
  console.log('Adding logo URLs to restaurants...');
  for (const { id, nameEn, logoUrl } of LOGOS) {
    await db
      .update(restaurantsTable)
      .set({ logoUrl })
      .where(eq(restaurantsTable.id, id));
    console.log(`  ✓ ${nameEn} (${id})`);
  }
  console.log('Done.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
