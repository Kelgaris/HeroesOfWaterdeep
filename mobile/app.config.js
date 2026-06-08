const fs = require("fs");
const path = require("path");
const appJson = require("./app.json");

function loadRootEnv() {
  const envPath = path.resolve(process.cwd(), "..", ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const envLines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  envLines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      return;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key || process.env[key]) {
      return;
    }

    process.env[key] = value.replace(/^['\"]|['\"]$/g, "");
  });
}

loadRootEnv();

const expoConfig = appJson.expo || {};
const androidPackage =
  process.env.EXPO_ANDROID_PACKAGE || "com.kelgaris.heroesofwaterdeep";
const iosBundleIdentifier =
  process.env.EXPO_IOS_BUNDLE_IDENTIFIER || "com.kelgaris.heroesofwaterdeep";

module.exports = {
  ...appJson,
  expo: {
    ...expoConfig,
    android: {
      ...(expoConfig.android || {}),
      package: androidPackage,
    },
    ios: {
      ...(expoConfig.ios || {}),
      bundleIdentifier: iosBundleIdentifier,
    },
    extra: {
      ...(expoConfig.extra || {}),
      expoPublicApiUrl: process.env.EXPO_PUBLIC_API_URL || "",
    },
  },
};
