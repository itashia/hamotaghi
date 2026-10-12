import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const tags = execFileSync("git", ["tag", "--list", "v*", "--sort=-version:refname"], { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);
const latestTag = tags[0] ?? "";
const currentSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const taggedSha = latestTag ? execFileSync("git", ["rev-list", "-n", "1", latestTag], { encoding: "utf8" }).trim() : "";
const pendingRelease = execFileSync("git", ["log", "-1", "--format=%H%x09%s", "--grep", "^chore(release): prepare v"], {
  encoding: "utf8",
})
  .trim()
  .split("\t");

if (latestTag && taggedSha === currentSha) {
  console.log("should_release=false");
  console.log(`reason=HEAD is already tagged ${latestTag}`);
  process.exit(0);
}

const baseVersion = latestTag ? latestTag.replace(/^v/, "") : packageJson.version;
const [major, minor, patch] = baseVersion.split(".").map(Number);
const pendingVersion = pendingRelease[1]?.match(/^chore\(release\): prepare v(\d+\.\d+\.\d+)/)?.[1];
if (!latestTag && pendingRelease[0] && pendingVersion === packageJson.version) {
  console.log("should_release=true");
  console.log(`version=${pendingVersion}`);
  console.log(`tag=v${pendingVersion}`);
  console.log("base_tag=none");
  console.log("reason=retrying the pending untagged release");
  process.exit(0);
}

const range = latestTag ? `${latestTag}..HEAD` : "HEAD";
const commits = execFileSync("git", ["log", range, "--format=%s%n%b"], { encoding: "utf8" });
const isBreaking = /BREAKING CHANGE|^[^\n]+!:/m.test(commits);
const hasFeature = /^feat(?:\([^\n)]+\))?!?:/m.test(commits);
const next = isBreaking
  ? `${major + 1}.0.0`
  : hasFeature
    ? `${major}.${minor + 1}.0`
    : `${major}.${minor}.${patch + 1}`;

console.log("should_release=true");
console.log(`version=${next}`);
console.log(`tag=v${next}`);
console.log(`base_tag=${latestTag || "none"}`);
