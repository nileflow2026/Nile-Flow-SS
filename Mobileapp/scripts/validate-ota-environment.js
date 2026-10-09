const apiUrl = process.env.API_URL || process.env.API_BASE_URL;

let parsedApiUrl;
try {
  parsedApiUrl = new URL(apiUrl);
} catch {
  throw new Error(
    "Set API_URL or API_BASE_URL in the selected EAS environment before publishing or building.",
  );
}

if (
  parsedApiUrl.protocol !== "https:" ||
  ["localhost", "127.0.0.1", "10.0.2.2"].includes(parsedApiUrl.hostname)
) {
  throw new Error(
    "The selected EAS environment must use a public HTTPS API_URL or API_BASE_URL.",
  );
}

console.log("OTA API environment is configured with a public HTTPS URL.");
