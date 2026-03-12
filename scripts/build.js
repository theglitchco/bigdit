import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await cp(path.join(rootDir, "index.html"), path.join(distDir, "index.html"));
await cp(path.join(rootDir, "tools"), path.join(distDir, "tools"), { recursive: true });
await cp(path.join(rootDir, "src"), path.join(distDir, "src"), { recursive: true });

console.log(`Built static site into ${distDir}`);
