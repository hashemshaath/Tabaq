import { Router } from "express";
import { db } from "@workspace/db";
import {
  restaurantsTable,
  restaurantCategoriesTable,
  categoriesTable,
} from "@workspace/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.get("/recommendations", async (req, res) => {
  try {
    const cityId = req.query.cityId ? Number(req.query.cityId) : undefined;
    const lang = (req.query.lang as string) || "en";
    const prefRaw = req.query.preferences as string | undefined;
    const preferences: string[] = prefRaw ? prefRaw.split(",").map(s => s.trim()).filter(Boolean) : [];

    const baseQuery = db
      .select({
        id: restaurantsTable.id,
        nameEn: restaurantsTable.nameEn,
        nameAr: restaurantsTable.nameAr,
        descriptionEn: restaurantsTable.descriptionEn,
        avgRating: restaurantsTable.avgRating,
        reviewCount: restaurantsTable.reviewCount,
        priceTier: restaurantsTable.priceTier,
        coverImageUrl: restaurantsTable.coverImageUrl,
        cityId: restaurantsTable.cityId,
      })
      .from(restaurantsTable);

    const rows = await (cityId
      ? baseQuery.where(eq(restaurantsTable.cityId, cityId))
      : baseQuery
    )
      .orderBy(desc(restaurantsTable.avgRating))
      .limit(30);

    if (rows.length === 0) {
      return res.json({ recommendations: [] });
    }

    const ids = rows.map(r => r.id);
    const cats = await db
      .select({
        restaurantId: restaurantCategoriesTable.restaurantId,
        nameEn: categoriesTable.nameEn,
        nameAr: categoriesTable.nameAr,
      })
      .from(restaurantCategoriesTable)
      .leftJoin(categoriesTable, eq(restaurantCategoriesTable.categoryId, categoriesTable.id))
      .where(inArray(restaurantCategoriesTable.restaurantId, ids));

    const catMap = new Map<number, string[]>();
    for (const c of cats) {
      if (!catMap.has(c.restaurantId)) catMap.set(c.restaurantId, []);
      if (c.nameEn) catMap.get(c.restaurantId)!.push(c.nameEn);
    }

    const context = rows.slice(0, 20).map(r => ({
      id: r.id,
      name: r.nameEn,
      nameAr: r.nameAr,
      rating: r.avgRating?.toFixed(1),
      reviews: r.reviewCount,
      price: r.priceTier,
      description: r.descriptionEn?.slice(0, 200),
      cuisines: catMap.get(r.id) ?? [],
    }));

    const preferenceNote = preferences.length
      ? `User preferences: ${preferences.join(", ")}.`
      : "No specific preferences provided — select broadly appealing options.";

    const prompt = `You are a food recommendation assistant for Tabaq, a Saudi Arabian dining platform.
Given these restaurants, select exactly 3 to recommend. Return ONLY valid JSON, no extra text.

${preferenceNote}

Restaurants:
${JSON.stringify(context, null, 2)}

Return this exact JSON structure (no markdown, no backticks):
{
  "recommendations": [
    {
      "id": <restaurant id as number>,
      "reasonEn": "<1 concise sentence in English explaining why this restaurant is recommended, max 15 words>",
      "reasonAr": "<1 concise sentence in Arabic explaining why, max 15 words>"
    }
  ]
}
Select 3 restaurants that best match the preferences, have high ratings, and offer variety. Prioritize quality and user fit.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 512,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    (req as any).log?.debug?.({ raw }, "AI recommendations raw response");

    let parsed: { recommendations?: Array<{ id: number; reasonEn: string; reasonAr: string }> };
    try {
      // Strip markdown code fences if present
      const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { recommendations: [] };
    }

    const validIds = new Set(rows.map(r => r.id));
    let filtered = (parsed.recommendations ?? []).filter(r => validIds.has(Number(r.id))).slice(0, 3);

    // Fallback: if AI returned nothing valid, use top 3 by rating
    if (filtered.length === 0) {
      const fallbackReasons: Record<string, { reasonEn: string; reasonAr: string }> = {
        en: { reasonEn: "Highly rated and popular among diners", reasonAr: "مُقيَّم بدرجة عالية ومشهور بين رواد المطاعم" },
        ar: { reasonEn: "Highly rated and popular among diners", reasonAr: "مُقيَّم بدرجة عالية ومشهور بين رواد المطاعم" },
      };
      filtered = rows.slice(0, 3).map(r => ({
        id: r.id,
        ...fallbackReasons[lang] ?? fallbackReasons.en,
      }));
    }

    const restaurantMap = new Map(rows.map(r => [r.id, r]));
    const result = filtered.map(rec => ({
      ...restaurantMap.get(rec.id)!,
      reasonEn: rec.reasonEn,
      reasonAr: rec.reasonAr,
    }));

    res.json({ recommendations: result });
  } catch (err) {
    (req as any).log?.error?.({ err }, "Failed to generate recommendations");
    res.status(500).json({ error: "internal_error", message: "Failed to generate recommendations" });
  }
});

export { router as recommendationsRouter };
