/**
 * sync-translations.js
 *
 * Detects untranslated keys across all locale files and optionally auto-translates
 * them using the free MyMemory API.
 *
 * Usage:
 *   npm run translate:check   — report missing keys only (no network calls)
 *   npm run translate:sync    — report + auto-translate supported languages
 *
 * Language support:
 *   kis (Kiswahili) → auto-translated via Swahili (sw)
 *   src (Juba Arabic script) → auto-translated via Arabic (ar)
 *   ar  (Juba Arabic romanized) → flagged for manual translation (no standard API)
 *   br  (Bari)  → flagged for manual translation
 *   nr  (Nuer)  → flagged for manual translation
 *   dk  (Dinka) → flagged for manual translation
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const LOCALES_DIR = path.join(__dirname, "..", "locales");

// MyMemory API language code for each locale (null = manual only)
const LANG_MAP = {
  kis: "sw", // Kiswahili → Swahili (closest standard)
  src: "ar", // Juba Arabic (Arabic script) → Arabic
  ar: null, // Romanized Juba Arabic — no standard API support
  br: null, // Bari — no standard API support
  nr: null, // Nuer — no standard API support
  dk: null, // Dinka — no standard API support
};

const LOCALE_NAMES = {
  en: "English",
  kis: "Kiswahili",
  src: "Juba Arabic (Arabic script)",
  ar: "Juba Arabic (Romanized)",
  br: "Bari",
  nr: "Nuer",
  dk: "Dinka",
};

// Small helper — wraps https.get in a Promise
function translateText(text, targetLang) {
  return new Promise((resolve) => {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text,
    )}&langpair=en|${targetLang}`;

    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.responseStatus === 200) {
              resolve(json.responseData.translatedText);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function syncTranslations(checkOnly = false) {
  const enPath = path.join(LOCALES_DIR, "en.json");

  if (!fs.existsSync(enPath)) {
    console.error("❌ en.json not found in", LOCALES_DIR);
    process.exit(1);
  }

  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const enKeys = Object.keys(en);

  console.log("\n🌍  NileFlow Translation Sync");
  console.log("══════════════════════════════════════");
  console.log(`  Source (en.json): ${enKeys.length} keys`);
  console.log(
    checkOnly
      ? "  Mode: CHECK ONLY (no changes will be written)"
      : "  Mode: SYNC (missing keys will be auto-translated or flagged)",
  );
  console.log("══════════════════════════════════════\n");

  const localeFiles = fs
    .readdirSync(LOCALES_DIR)
    .filter((f) => f.endsWith(".json") && f !== "en.json")
    .sort();

  let totalMissing = 0;
  let totalOrphaned = 0;

  for (const file of localeFiles) {
    const localeName = file.replace(".json", "");
    const localePath = path.join(LOCALES_DIR, file);
    const displayName = LOCALE_NAMES[localeName] || localeName;

    let locale;
    try {
      locale = JSON.parse(fs.readFileSync(localePath, "utf8"));
    } catch {
      console.error(`  ❌ Could not parse ${file}`);
      continue;
    }

    const missingKeys = enKeys.filter((k) => !(k in locale));
    const orphanedKeys = Object.keys(locale).filter((k) => !(k in en));

    totalMissing += missingKeys.length;
    totalOrphaned += orphanedKeys.length;

    console.log(`📄  ${file}  (${displayName})`);

    if (missingKeys.length === 0 && orphanedKeys.length === 0) {
      console.log("    ✅ Fully in sync\n");
      continue;
    }

    if (missingKeys.length > 0) {
      console.log(`    ⚠️  Missing ${missingKeys.length} key(s):`);
      missingKeys.forEach((k) => console.log(`       • "${k}"`));
    }

    if (orphanedKeys.length > 0) {
      console.log(
        `    🗑️  Orphaned (in locale but not in en.json) ${orphanedKeys.length} key(s):`,
      );
      orphanedKeys.forEach((k) => console.log(`       • "${k}"`));
    }

    if (!checkOnly && missingKeys.length > 0) {
      const apiLang = LANG_MAP[localeName];
      const updated = { ...locale };

      for (const key of missingKeys) {
        const englishValue = en[key];

        if (apiLang) {
          process.stdout.write(`    🔄 Translating "${key}" ...`);
          const translated = await translateText(englishValue, apiLang);

          if (translated && translated !== englishValue) {
            updated[key] = translated;
            console.log(` ✓ "${translated}"`);
          } else {
            updated[key] = `[TODO] ${englishValue}`;
            console.log(` ⚠️  failed — marked as [TODO]`);
          }

          // Respect MyMemory rate limit (~1 req/300ms on free tier)
          await sleep(350);
        } else {
          updated[key] = `[TODO] ${englishValue}`;
          console.log(
            `    ✏️  "${key}" → "[TODO] ${englishValue}" (manual translation needed)`,
          );
        }
      }

      // Write back with consistent formatting
      fs.writeFileSync(localePath, JSON.stringify(updated, null, 4), "utf8");
      console.log(`    💾 Saved\n`);
    } else {
      console.log();
    }
  }

  console.log("══════════════════════════════════════");
  console.log(`  Total missing keys:   ${totalMissing}`);
  console.log(`  Total orphaned keys:  ${totalOrphaned}`);

  if (checkOnly && totalMissing > 0) {
    console.log(
      "\n  Run `npm run translate:sync` to auto-translate missing keys.",
    );
  } else if (!checkOnly) {
    console.log(
      "\n  ✅ Sync complete! Keys marked [TODO] need a native speaker.\n",
    );
  } else {
    console.log("\n  ✅ All locale files are in sync with en.json.\n");
  }
}

const checkOnly = process.argv.includes("--check");
syncTranslations(checkOnly).catch((err) => {
  console.error("❌ Sync failed:", err.message);
  process.exit(1);
});
