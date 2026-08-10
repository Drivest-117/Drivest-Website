import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveSiteEnvironment } from "./site-environment.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteEnv = resolveSiteEnvironment(process.env);
const steps = [
  ["Generate static pages", ["tools/generate-seo-pages.mjs"]],
  ["Apply site environment", ["tools/apply-site-environment.mjs"]],
  ["Verify generated site", ["tools/verify-generated-site.mjs"]]
];

console.log(`Building Drivest site for ${siteEnv.name} using ${siteEnv.siteUrl}`);

for (const [label, command] of steps) {
  const [scriptPath] = command;
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: siteDir,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  console.log(`${label} complete.`);
}
