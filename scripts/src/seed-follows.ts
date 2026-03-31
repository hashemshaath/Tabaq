import { db } from '@workspace/db';
import { userFollowsTable } from '@workspace/db/schema';

// User IDs: 1=food_explorer, 3=noura, 4=faisal, 5=lama, 6=sultan, 7=rawan,
//           8=ahmed, 9=fatima, 10=khalid, 11=sara, 12=omar

const FOLLOWS = [
  // Noura (top critic) is followed by many
  { followerId: 4,  followingId: 3 },
  { followerId: 5,  followingId: 3 },
  { followerId: 6,  followingId: 3 },
  { followerId: 7,  followingId: 3 },
  { followerId: 8,  followingId: 3 },
  { followerId: 9,  followingId: 3 },
  { followerId: 10, followingId: 3 },
  { followerId: 11, followingId: 3 },
  { followerId: 12, followingId: 3 },
  { followerId: 1,  followingId: 3 },

  // Faisal (2nd rank) is followed by many
  { followerId: 3,  followingId: 4 },
  { followerId: 5,  followingId: 4 },
  { followerId: 6,  followingId: 4 },
  { followerId: 7,  followingId: 4 },
  { followerId: 8,  followingId: 4 },
  { followerId: 11, followingId: 4 },
  { followerId: 12, followingId: 4 },
  { followerId: 1,  followingId: 4 },

  // Lama (3rd rank)
  { followerId: 3,  followingId: 5 },
  { followerId: 4,  followingId: 5 },
  { followerId: 7,  followingId: 5 },
  { followerId: 9,  followingId: 5 },
  { followerId: 10, followingId: 5 },
  { followerId: 1,  followingId: 5 },

  // Sultan
  { followerId: 3,  followingId: 6 },
  { followerId: 5,  followingId: 6 },
  { followerId: 8,  followingId: 6 },
  { followerId: 11, followingId: 6 },
  { followerId: 1,  followingId: 6 },

  // Rawan
  { followerId: 3,  followingId: 7 },
  { followerId: 4,  followingId: 7 },
  { followerId: 5,  followingId: 7 },
  { followerId: 6,  followingId: 7 },
  { followerId: 12, followingId: 7 },
  { followerId: 1,  followingId: 7 },

  // Ahmed
  { followerId: 3,  followingId: 8 },
  { followerId: 6,  followingId: 8 },
  { followerId: 9,  followingId: 8 },

  // Fatima
  { followerId: 4,  followingId: 9 },
  { followerId: 7,  followingId: 9 },
  { followerId: 10, followingId: 9 },

  // Khalid
  { followerId: 5,  followingId: 10 },
  { followerId: 8,  followingId: 10 },

  // Sara
  { followerId: 3,  followingId: 11 },
  { followerId: 4,  followingId: 11 },
  { followerId: 9,  followingId: 11 },

  // Omar
  { followerId: 6,  followingId: 12 },
  { followerId: 10, followingId: 12 },
  { followerId: 11, followingId: 12 },
];

async function main() {
  let inserted = 0;
  for (const follow of FOLLOWS) {
    await db.insert(userFollowsTable).values({ ...follow, status: 'accepted' })
      .onConflictDoNothing();
    inserted++;
  }
  console.log(`✓ Inserted ${inserted} follow relationships`);

  // Print summary
  const totals: Record<number, { followers: number; following: number }> = {};
  for (const f of FOLLOWS) {
    if (!totals[f.followingId]) totals[f.followingId] = { followers: 0, following: 0 };
    if (!totals[f.followerId]) totals[f.followerId] = { followers: 0, following: 0 };
    totals[f.followingId].followers++;
    totals[f.followerId].following++;
  }
  const userNames: Record<number, string> = {
    1: 'food_explorer', 3: 'noura', 4: 'faisal', 5: 'lama', 6: 'sultan',
    7: 'rawan', 8: 'ahmed', 9: 'fatima', 10: 'khalid', 11: 'sara', 12: 'omar',
  };
  Object.entries(totals).sort((a,b)=>(b[1].followers-a[1].followers)).forEach(([id,t])=>{
    console.log(`  @${userNames[Number(id)]} — ${t.followers} followers, ${t.following} following`);
  });
}

main().catch(console.error);
