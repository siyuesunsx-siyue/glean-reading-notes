import { mkdir, copyFile, readdir, rm, cp } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
const dest = path.resolve("dist/glean-0.3.7");
await mkdir(path.join(dest, "extension/icons"), { recursive: true });
for (const f of await readdir("extension"))
  if (!f.startsWith("qa-") && f !== "icons")
    await cp("extension/" + f, path.join(dest, "extension", f), {recursive:true});
for (const f of await readdir("extension/icons"))
  await copyFile("extension/icons/" + f, path.join(dest, "extension/icons", f));
await copyFile("README.md", path.join(dest, "安装说明.md"));
const zip = path.resolve("dist/glean-0.3.7.zip");
const quote = (s) => "'" + s.replaceAll("'", "''") + "'";
execFileSync(
  "powershell.exe",
  [
    "-NoProfile",
    "-Command",
    `Compress-Archive -LiteralPath ${quote(dest)} -DestinationPath ${quote(zip)} -Force`,
  ],
  { stdio: "inherit" },
);
console.log(zip);
