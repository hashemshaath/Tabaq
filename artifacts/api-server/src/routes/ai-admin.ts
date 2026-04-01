import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAuth } from "../middleware/requireAuth.js";
import { aiRateLimiter } from "../middleware/rateLimiter.js";

const router: IRouter = Router();

// ─── POST /api/admin/ai/generate-content ──────────────────────────────────────
// Generate copy content for restaurants, experiences, offers, or blog posts.
router.post("/admin/ai/generate-content", requireAuth, aiRateLimiter, async (req, res) => {
  try {
    const { type, context, lang = "both" } = req.body as {
      type: "restaurant_description" | "experience_description" | "offer_copy" | "blog_intro" | "seo_meta";
      context: Record<string, string>;
      lang?: "en" | "ar" | "both";
    };

    if (!type || !context) {
      return void res.status(400).json({ error: "type and context are required" });
    }

    const prompts: Record<string, string> = {
      restaurant_description: `Write a compelling restaurant description for a Saudi Arabian dining platform.
Restaurant: ${context.name ?? ""}
Cuisine: ${context.cuisine ?? ""}
Location: ${context.city ?? ""}
Price tier: ${context.priceTier ?? ""}
Key highlights: ${context.highlights ?? ""}
Write in ${lang === "both" ? "both English and Arabic" : lang}. Keep it under 150 words per language.
Return JSON: { "en": "...", "ar": "..." }`,

      experience_description: `Write an enticing description for a food experience on a Saudi dining platform.
Experience: ${context.name ?? ""}
Type: ${context.type ?? ""}
Host: ${context.host ?? ""}
Duration: ${context.duration ?? ""}
Highlights: ${context.highlights ?? ""}
Write in ${lang === "both" ? "both English and Arabic" : lang}. Under 120 words per language.
Return JSON: { "en": "...", "ar": "..." }`,

      offer_copy: `Write persuasive marketing copy for a restaurant offer.
Offer: ${context.title ?? ""}
Restaurant: ${context.restaurant ?? ""}
Discount: ${context.discount ?? ""}
Valid until: ${context.validUntil ?? ""}
Write in ${lang === "both" ? "both English and Arabic" : lang}. Under 80 words per language. Include a clear call to action.
Return JSON: { "en": "...", "ar": "..." }`,

      blog_intro: `Write an engaging blog post introduction for a food & dining publication.
Title: ${context.title ?? ""}
Topic: ${context.topic ?? ""}
Audience: Food lovers in Saudi Arabia and the Middle East.
Write in ${lang === "both" ? "both English and Arabic" : lang}. Under 100 words per language.
Return JSON: { "en": "...", "ar": "..." }`,

      seo_meta: `Write SEO-optimized meta title and description for a dining page.
Page type: ${context.pageType ?? "restaurant"}
Name: ${context.name ?? ""}
Location: ${context.city ?? ""}
Cuisine: ${context.cuisine ?? ""}
Return JSON with these exact fields:
{ "titleEn": "...", "titleAr": "...", "descriptionEn": "...", "descriptionAr": "..." }
Keep title under 60 chars, description under 160 chars.`,
    };

    const prompt = prompts[type];
    if (!prompt) {
      return void res.status(400).json({ error: "invalid content type" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 1024,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { en: raw, ar: "" };
    }

    res.json({ content: parsed, type });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Content generation failed" });
  }
});

// ─── POST /api/admin/ai/seo-suggestions ───────────────────────────────────────
// Get AI-powered SEO improvement suggestions for a page.
router.post("/admin/ai/seo-suggestions", requireAuth, aiRateLimiter, async (req, res) => {
  try {
    const { pageType, currentTitle, currentDescription, currentKeywords, url } = req.body as {
      pageType: string;
      currentTitle?: string;
      currentDescription?: string;
      currentKeywords?: string;
      url?: string;
    };

    const prompt = `You are an SEO expert for a Saudi Arabian food & dining platform called Tabaq.
Analyze the following page SEO and provide improvement suggestions.

Page type: ${pageType}
URL: ${url ?? "N/A"}
Current title: ${currentTitle ?? "Not set"}
Current description: ${currentDescription ?? "Not set"}
Current keywords: ${currentKeywords ?? "Not set"}

Provide actionable SEO improvements. Return JSON:
{
  "score": <number 0-100>,
  "suggestions": [
    { "issue": "...", "recommendation": "...", "priority": "high|medium|low" }
  ],
  "improvedTitle": "...",
  "improvedDescription": "...",
  "suggestedKeywords": ["...", "..."]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 1024,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { score: 50, suggestions: [], improvedTitle: currentTitle ?? "", improvedDescription: currentDescription ?? "", suggestedKeywords: [] };
    }

    res.json({ analysis: parsed });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "SEO analysis failed" });
  }
});

export default router;
