import { readFile, writeFile } from "node:fs/promises";

const version = process.argv[2];

if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
  throw new Error("Usage: node scripts/sync-version.mjs <major.minor.patch>");
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
packageJson.version = version;
await writeFile("package.json", `${JSON.stringify(packageJson, null, 2)}\n`);

const tauriJson = JSON.parse(await readFile("src-tauri/tauri.conf.json", "utf8"));
tauriJson.version = version;
await writeFile("src-tauri/tauri.conf.json", `${JSON.stringify(tauriJson, null, 2)}\n`);

const cargo = await readFile("src-tauri/Cargo.toml", "utf8");
await writeFile("src-tauri/Cargo.toml", cargo.replace(/(^version\s*=\s*")[^"]+("\s*$)/m, `$1${version}$2`));

const cargoLock = await readFile("src-tauri/Cargo.lock", "utf8");
await writeFile(
  "src-tauri/Cargo.lock",
  cargoLock.replace(/(\[\[package\]\]\nname = "app"\nversion = ")[^"]+(")/, `$1${version}$2`),
);

console.log(`Synchronized application version to ${version}`);
