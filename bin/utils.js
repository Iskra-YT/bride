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

export function hasEmpp() {
    try {
        execFileSync("em++", ["--version"], { stdio: "ignore" });
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

export function getLibDir() {
    const cwd = process.cwd();
    const installedBride = path.join(cwd, "node_modules", "bride");
    const brideRoot = existsSync(path.join(installedBride, "lib", "c")) ? installedBride : path.join(__dirname, "..");
    return path.join(brideRoot, "lib", "c");
}

export function getBrideFolder() {
    const cwd = process.cwd();
    return path.join(cwd, "node_modules", "bride");
}