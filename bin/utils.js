import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

export function hasEmcc() {
    try {
        execFileSync("emcc", ["--version"], { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

export function findFiles(dir, extension) {
    if (!existsSync(dir)) {
        return [];
    }

    const files = [];

    for (const entry of readdirSync(dir)) {
        const entryPath = path.join(dir, entry);

        if (statSync(entryPath).isDirectory()) {
            files.push(...findFiles(entryPath, extension));
        } else if (entry.endsWith(extension)) {
            files.push(entryPath);
        }
    }

    return files;
}