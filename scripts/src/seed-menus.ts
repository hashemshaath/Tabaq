import { db } from "@workspace/db";
import { menusTable, menuSectionsTable, dishesTable } from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  console.log("🗂️  Seeding menus & sections — linking all dishes...\n");

  // ── Step 1: Add missing sections to existing menus ──────────────────────────

  // Menu 1 (Najd Village food menu) — add Desserts section
  console.log("📋 Menu 1: Najd Village — adding Desserts section...");
  const [dessertsSec1] = await db.insert(menuSectionsTable).values({
    menuId: 1, nameEn: "Desserts & Sweets", nameAr: "الحلويات", displayOrder: 3,
  }).returning({ id: menuSectionsTable.id });
  console.log(`  ✅ Section "Desserts & Sweets" → id ${dessertsSec1.id}`);

  // Update section 1 (Starters, menu 1) — add dishes 10 (Mutabbaq) to it
  // Update section 2 (Main Course, menu 1) — add dishes 11 (Saleeg), 12 (Margoog)
  // Desserts: 13 (Muhallabia), 14 (Aseedah)
  await db.update(dishesTable).set({ menuSectionId: 1 }).where(inArray(dishesTable.id, [1, 2, 10]));
  console.log("  ✅ Starters (sec 1): Harees, Jareesh, Mutabbaq");
  await db.update(dishesTable).set({ menuSectionId: 2 }).where(inArray(dishesTable.id, [3, 4, 11, 12]));
  console.log("  ✅ Main Course (sec 2): Kabsa, Mandi, Saleeg, Margoog");
  await db.update(dishesTable).set({ menuSectionId: dessertsSec1.id }).where(inArray(dishesTable.id, [13, 14]));
  console.log("  ✅ Desserts (sec " + dessertsSec1.id + "): Muhallabia, Aseedah");

  // Menu 2 (Sushi Sama food menu) — add Starters and Hot Dishes sections
  console.log("\n📋 Menu 2: Sushi Sama — adding Starters & Hot Dishes...");
  const [startersSec2] = await db.insert(menuSectionsTable).values({
    menuId: 2, nameEn: "Starters", nameAr: "المقبلات", displayOrder: 1,
  }).returning({ id: menuSectionsTable.id });
  const [hotSec2] = await db.insert(menuSectionsTable).values({
    menuId: 2, nameEn: "Hot Dishes", nameAr: "الأطباق الساخنة", displayOrder: 2,
  }).returning({ id: menuSectionsTable.id });
  const [rollsSec2] = await db.insert(menuSectionsTable).values({
    menuId: 2, nameEn: "Nigiri & Bowls", nameAr: "نيغيري وأوعية", displayOrder: 4,
  }).returning({ id: menuSectionsTable.id });

  await db.update(dishesTable).set({ menuSectionId: startersSec2.id }).where(inArray(dishesTable.id, [23, 26]));
  console.log(`  ✅ Starters (sec ${startersSec2.id}): Miso Soup, Edamame`);
  await db.update(dishesTable).set({ menuSectionId: hotSec2.id }).where(inArray(dishesTable.id, [24]));
  console.log(`  ✅ Hot Dishes (sec ${hotSec2.id}): Tempura Prawn`);
  // Signature Rolls (existing sec 3) — add new rolls/nigiri
  await db.update(dishesTable).set({ menuSectionId: 3 }).where(inArray(dishesTable.id, [5, 6, 22]));
  console.log("  ✅ Signature Rolls (sec 3): Dragon Roll, Spicy Tuna, Wagyu Maki");
  await db.update(dishesTable).set({ menuSectionId: rollsSec2.id }).where(inArray(dishesTable.id, [21, 25]));
  console.log(`  ✅ Nigiri & Bowls (sec ${rollsSec2.id}): Salmon Nigiri, Chirashi Bowl`);

  // ── Step 2: Create food menus for restaurants without them ─────────────────

  // Restaurant 2: Reem Al Bawadi
  console.log("\n🏪 Creating food menu for Reem Al Bawadi (R2)...");
  const [menuR2] = await db.insert(menusTable).values({
    restaurantId: 2, nameEn: "Main Menu", nameAr: "القائمة الرئيسية", type: "food", isActive: true, displayOrder: 1,
  }).returning({ id: menusTable.id });
  const [mezzeSecR2] = await db.insert(menuSectionsTable).values({
    menuId: menuR2.id, nameEn: "Mezze & Starters", nameAr: "المزة والمقبلات", displayOrder: 1,
  }).returning({ id: menuSectionsTable.id });
  const [mainsSecR2] = await db.insert(menuSectionsTable).values({
    menuId: menuR2.id, nameEn: "Main Courses", nameAr: "الأطباق الرئيسية", displayOrder: 2,
  }).returning({ id: menuSectionsTable.id });
  const [dessertsSecR2] = await db.insert(menuSectionsTable).values({
    menuId: menuR2.id, nameEn: "Desserts", nameAr: "الحلويات", displayOrder: 3,
  }).returning({ id: menuSectionsTable.id });
  await db.update(dishesTable).set({ menuSectionId: mezzeSecR2.id }).where(inArray(dishesTable.id, [15, 16, 19]));
  await db.update(dishesTable).set({ menuSectionId: mainsSecR2.id }).where(inArray(dishesTable.id, [17, 18]));
  await db.update(dishesTable).set({ menuSectionId: dessertsSecR2.id }).where(inArray(dishesTable.id, [20]));
  console.log(`  ✅ Menu ${menuR2.id} created — 3 sections, 6 dishes linked`);

  // Restaurant 4: Lusin
  console.log("\n🏪 Creating food menu for Lusin (R4)...");
  const [menuR4] = await db.insert(menusTable).values({
    restaurantId: 4, nameEn: "Main Menu", nameAr: "القائمة الرئيسية", type: "food", isActive: true, displayOrder: 1,
  }).returning({ id: menusTable.id });
  const [startersSecR4] = await db.insert(menuSectionsTable).values({
    menuId: menuR4.id, nameEn: "Starters & Mezze", nameAr: "المقبلات والمزة", displayOrder: 1,
  }).returning({ id: menuSectionsTable.id });
  const [mainsSecR4] = await db.insert(menuSectionsTable).values({
    menuId: menuR4.id, nameEn: "Main Courses", nameAr: "الأطباق الرئيسية", displayOrder: 2,
  }).returning({ id: menuSectionsTable.id });
  const [dessertsSecR4] = await db.insert(menuSectionsTable).values({
    menuId: menuR4.id, nameEn: "Desserts", nameAr: "الحلويات", displayOrder: 3,
  }).returning({ id: menuSectionsTable.id });
  await db.update(dishesTable).set({ menuSectionId: startersSecR4.id }).where(inArray(dishesTable.id, [29, 30, 32]));
  await db.update(dishesTable).set({ menuSectionId: mainsSecR4.id }).where(inArray(dishesTable.id, [27, 28]));
  await db.update(dishesTable).set({ menuSectionId: dessertsSecR4.id }).where(inArray(dishesTable.id, [31]));
  console.log(`  ✅ Menu ${menuR4.id} created — 3 sections, 6 dishes linked`);

  // Restaurant 5: Spice Route
  console.log("\n🏪 Creating food menu for Spice Route (R5)...");
  const [menuR5] = await db.insert(menusTable).values({
    restaurantId: 5, nameEn: "Main Menu", nameAr: "القائمة الرئيسية", type: "food", isActive: true, displayOrder: 1,
  }).returning({ id: menusTable.id });
  const [mainsSecR5] = await db.insert(menuSectionsTable).values({
    menuId: menuR5.id, nameEn: "Curries & Mains", nameAr: "الكاري والأطباق الرئيسية", displayOrder: 1,
  }).returning({ id: menuSectionsTable.id });
  const [breadsSecR5] = await db.insert(menuSectionsTable).values({
    menuId: menuR5.id, nameEn: "Breads & Sides", nameAr: "الخبز والمرافقات", displayOrder: 2,
  }).returning({ id: menuSectionsTable.id });
  const [dessertsSecR5] = await db.insert(menuSectionsTable).values({
    menuId: menuR5.id, nameEn: "Desserts", nameAr: "الحلويات", displayOrder: 3,
  }).returning({ id: menuSectionsTable.id });
  await db.update(dishesTable).set({ menuSectionId: mainsSecR5.id }).where(inArray(dishesTable.id, [8, 33, 34, 35, 36]));
  await db.update(dishesTable).set({ menuSectionId: breadsSecR5.id }).where(inArray(dishesTable.id, [37]));
  await db.update(dishesTable).set({ menuSectionId: dessertsSecR5.id }).where(inArray(dishesTable.id, [38]));
  console.log(`  ✅ Menu ${menuR5.id} created — 3 sections, 7 dishes linked`);

  // Restaurant 6: Al Tazaj
  console.log("\n🏪 Creating food menu for Al Tazaj (R6)...");
  const [menuR6] = await db.insert(menusTable).values({
    restaurantId: 6, nameEn: "Main Menu", nameAr: "القائمة الرئيسية", type: "food", isActive: true, displayOrder: 1,
  }).returning({ id: menusTable.id });
  const [chickenSecR6] = await db.insert(menuSectionsTable).values({
    menuId: menuR6.id, nameEn: "Chicken Meals", nameAr: "وجبات الدجاج", displayOrder: 1,
  }).returning({ id: menuSectionsTable.id });
  const [sandwichSecR6] = await db.insert(menuSectionsTable).values({
    menuId: menuR6.id, nameEn: "Sandwiches", nameAr: "الساندويشات", displayOrder: 2,
  }).returning({ id: menuSectionsTable.id });
  const [sidesSecR6] = await db.insert(menuSectionsTable).values({
    menuId: menuR6.id, nameEn: "Sides & Salads", nameAr: "المرافقات والسلطات", displayOrder: 3,
  }).returning({ id: menuSectionsTable.id });
  await db.update(dishesTable).set({ menuSectionId: chickenSecR6.id }).where(inArray(dishesTable.id, [39, 40, 41]));
  await db.update(dishesTable).set({ menuSectionId: sandwichSecR6.id }).where(inArray(dishesTable.id, [42]));
  await db.update(dishesTable).set({ menuSectionId: sidesSecR6.id }).where(inArray(dishesTable.id, [43, 44]));
  console.log(`  ✅ Menu ${menuR6.id} created — 3 sections, 6 dishes linked`);

  // Restaurant 7: Nobu
  console.log("\n🏪 Creating food menu for Nobu (R7)...");
  const [menuR7] = await db.insert(menusTable).values({
    restaurantId: 7, nameEn: "Main Menu", nameAr: "القائمة الرئيسية", type: "food", isActive: true, displayOrder: 1,
  }).returning({ id: menusTable.id });
  const [rawSecR7] = await db.insert(menuSectionsTable).values({
    menuId: menuR7.id, nameEn: "Raw & Cold Dishes", nameAr: "الأطباق الباردة والنيئة", displayOrder: 1,
  }).returning({ id: menuSectionsTable.id });
  const [tempuraSecR7] = await db.insert(menuSectionsTable).values({
    menuId: menuR7.id, nameEn: "Tempura & Hot Dishes", nameAr: "التمبورا والأطباق الساخنة", displayOrder: 2,
  }).returning({ id: menuSectionsTable.id });
  const [fishSecR7] = await db.insert(menuSectionsTable).values({
    menuId: menuR7.id, nameEn: "Signature Fish", nameAr: "أسماك التوقيع", displayOrder: 3,
  }).returning({ id: menuSectionsTable.id });
  await db.update(dishesTable).set({ menuSectionId: rawSecR7.id }).where(inArray(dishesTable.id, [45, 47]));
  await db.update(dishesTable).set({ menuSectionId: tempuraSecR7.id }).where(inArray(dishesTable.id, [46, 49]));
  await db.update(dishesTable).set({ menuSectionId: fishSecR7.id }).where(inArray(dishesTable.id, [7, 48]));
  console.log(`  ✅ Menu ${menuR7.id} created — 3 sections, 6 dishes linked`);

  // Restaurant 8: Karak House
  console.log("\n🏪 Creating food menu for Karak House (R8)...");
  const [menuR8] = await db.insert(menusTable).values({
    restaurantId: 8, nameEn: "Main Menu", nameAr: "القائمة الرئيسية", type: "food", isActive: true, displayOrder: 1,
  }).returning({ id: menusTable.id });
  const [beveragesSecR8] = await db.insert(menuSectionsTable).values({
    menuId: menuR8.id, nameEn: "Hot Beverages", nameAr: "المشروبات الساخنة", displayOrder: 1,
  }).returning({ id: menuSectionsTable.id });
  const [foodSecR8] = await db.insert(menuSectionsTable).values({
    menuId: menuR8.id, nameEn: "Food & Snacks", nameAr: "الطعام والوجبات الخفيفة", displayOrder: 2,
  }).returning({ id: menuSectionsTable.id });
  const [dessertsSecR8] = await db.insert(menuSectionsTable).values({
    menuId: menuR8.id, nameEn: "Desserts", nameAr: "الحلويات", displayOrder: 3,
  }).returning({ id: menuSectionsTable.id });
  await db.update(dishesTable).set({ menuSectionId: beveragesSecR8.id }).where(inArray(dishesTable.id, [9, 50, 51]));
  await db.update(dishesTable).set({ menuSectionId: foodSecR8.id }).where(inArray(dishesTable.id, [52, 53, 54]));
  await db.update(dishesTable).set({ menuSectionId: dessertsSecR8.id }).where(inArray(dishesTable.id, [55]));
  console.log(`  ✅ Menu ${menuR8.id} created — 3 sections, 7 dishes linked`);

  // ── Step 3: Verify linkage ─────────────────────────────────────────────────
  console.log("\n📊 Verification — dishes without menu_section_id:");
  const unlinked = await db
    .select({ id: dishesTable.id, nameEn: dishesTable.nameEn })
    .from(dishesTable)
    .where(eq(dishesTable.menuSectionId, null as any));
  if (unlinked.length === 0) {
    console.log("  ✅ All dishes are linked to a menu section!");
  } else {
    unlinked.forEach(d => console.log(`  ⚠️  Dish #${d.id}: ${d.nameEn}`));
  }

  console.log("\n✅ Menu seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
