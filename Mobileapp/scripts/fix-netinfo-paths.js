/* eslint-disable no-undef */
/**
 * Prebuild script to fix react-native-community/netinfo path issues on Windows
 * This script ensures that absolute Windows paths don't leak into the Gradle build
 */

const fs = require("fs");
const path = require("path");

function fixNetinfoSettings() {
  const settingsGradlePath = path.join(
    __dirname,
    "..",
    "android",
    "settings.gradle",
  );

  if (!fs.existsSync(settingsGradlePath)) {
    console.log("⚠️  settings.gradle not found, skipping netinfo path fix");
    return;
  }

  try {
    let content = fs.readFileSync(settingsGradlePath, "utf-8");

    // Fix Windows absolute paths in netinfo includes
    // Replace patterns like: C:/Users/... with relative paths
    const fixedContent = content.replace(
      /project\s*\(\s*':.*?netinfo.*?'\s*\)\s*\.projectDir\s*=\s*new\s+File\([^)]*C:[\\\/][^)]*\)/g,
      (match) => {
        console.log("🔧 Fixed netinfo path in settings.gradle");
        return match.replace(
          /C:[\\\/][^)]*/,
          "'node_modules/@react-native-community/netinfo/android'",
        );
      },
    );

    // Also fix any includeBuild with absolute netinfo paths
    const finalContent = fixedContent.replace(
      /includeBuild\s*\(\s*['"][^'"]*C:[\\\/][^'"]*netinfo[^'"]*['"]\s*\)/g,
      () => {
        console.log("🔧 Fixed includeBuild netinfo path");
        return "// netinfo path fixed - using node_modules resolution";
      },
    );

    fs.writeFileSync(settingsGradlePath, finalContent, "utf-8");
    console.log("✅ netinfo paths fixed in settings.gradle");
  } catch (error) {
    console.error("❌ Error fixing netinfo paths:", error.message);
    process.exit(1);
  }
}

// Run the fix
fixNetinfoSettings();
