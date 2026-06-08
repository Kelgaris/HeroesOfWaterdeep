const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const candidatePaths = [
  path.resolve(__dirname, "..", "..", ".env"),
  path.resolve(__dirname, "..", ".env"),
];

candidatePaths.forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
});
