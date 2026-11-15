const fs = require("fs");
const path = require("path");

const routesFile = path.join(__dirname, "..", "routes", "auth.js");
const source = fs.readFileSync(routesFile, "utf8");
const routePattern = /router\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g;
const seen = new Map();
let match;

while ((match = routePattern.exec(source))) {
  const key = `${match[1].toUpperCase()} ${match[2]}`;
  const line = source.slice(0, match.index).split("\n").length;
  const locations = seen.get(key) || [];
  locations.push(line);
  seen.set(key, locations);
}

const duplicates = [...seen.entries()].filter(([, locations]) => locations.length > 1);
if (duplicates.length) {
  console.error("Duplicate API route registrations detected:");
  for (const [route, locations] of duplicates) {
    console.error(`- ${route}: lines ${locations.join(", ")}`);
  }
  process.exitCode = 1;
} else {
  console.log("API route registration check passed: no duplicate method/path pairs.");
}
