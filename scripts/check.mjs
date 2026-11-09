import { readFile, readdir, access } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const manifest = JSON.parse(await readFile("extension/manifest.json", "utf8"));
for (const f of await readdir("extension"))
  if (/\.m?js$/.test(f))
    execFileSync(process.execPath, ["--check", "extension/" + f], {
      stdio: "inherit",
    });
for (const f of [
  manifest.background.service_worker,
  ...(manifest.action.default_popup ? [manifest.action.default_popup] : []),
  ...Object.values(manifest.icons),
  ...manifest.content_scripts.flatMap((x) => x.js),
])
  await access("extension/" + f);
console.log("JavaScript syntax and extension manifest assets verified.");
