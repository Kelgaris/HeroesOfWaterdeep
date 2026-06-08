const fs = require("fs");
const path = require("path");
const appJson = require("./app.json");

function loadRootEnv() {
  const envPath = path.resolve(__dirname, "..", ".env");

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

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra || {}),
      expoPublicApiUrl: process.env.EXPO_PUBLIC_API_URL || "",
    },
  },
};
