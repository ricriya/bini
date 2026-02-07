const express = require("express");
const { chromium } = require("playwright");
const app = express();
app.use(express.json());
const BOT_SHARED_TOKEN = process.env.BOT_SHARED_TOKEN || "dev_token";

function requireBotToken(req, res, next) {
  const token = req.headers["x-bot-token"];
  if (token !== BOT_SHARED_TOKEN) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }
  next();
}

async function visitAsAdmin(targetUrl, userId = null) {
  let browser = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
      ],
    });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ignoreHTTPSErrors: true,
      bypassCSP: true,
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:9090/", {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    await context.addCookies([
      {
        name: "ctf_jwt",
        value: String(process.env.ADMIN_JWT || "dummy"),
        url: "http://127.0.0.1:9090/",
        httpOnly: true,
        sameSite: "Lax",
        secure: false,
      },
    ]);
    await page.setExtraHTTPHeaders({
      "ngrok-skip-browser-warning": "true",
    });

    let finalUrl = targetUrl;

    const response = await page.goto(finalUrl, {
      waitUntil: "networkidle",
      timeout: 20000,
    });
    const title = await page.title();

    await page.waitForTimeout(2000);
  } catch (e) {
  } finally {
    if (browser) await browser.close();
  }
}

app.post("/visit", requireBotToken, async (req, res) => {
  const path = String(req.body?.path || "").trim();
  const userId = String(req.body?.userId || "").trim();

  try {
    await visitAsAdmin(path, userId || null);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ ok: false, error: String(e.message || e) });
  }
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    adminJwtSet: !!process.env.ADMIN_JWT,
    adminJwtLength: process.env.ADMIN_JWT?.length || 0,
  });
});

app.listen(7070, () => {
  console.log("[bot] listening on :7070");
});
