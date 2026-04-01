import { Router } from "express";

const router = Router();

// POST /api/contact — public contact form submission
router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({
        error: "validation_error",
        message: "name, email and message are required",
      });
      return;
    }

    // Basic email validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      res.status(400).json({ error: "validation_error", message: "Invalid email address" });
      return;
    }

    // Log the enquiry server-side (in production this would trigger an email)
    console.info(`[Contact Form] From: ${name} <${email}> | Topic: ${subject || "General"} | Message: ${message.substring(0, 100)}`);

    const refCode = `CNT-${Date.now().toString(36).toUpperCase()}`;

    res.status(201).json({
      success: true,
      refCode,
      message: "Your message has been received. We will get back to you within 24 hours.",
    });
  } catch (err) {
    console.error("contact form error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to submit contact form" });
  }
});

export default router;
