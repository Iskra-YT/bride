import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

export function hasC3c() {
    try {
        execFileSync("c3c", ["--version"], { stdio: "ignore" });
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

export function getBrideRoot() {
    const cwd = process.cwd();
    const installedBride = path.join(cwd, "node_modules", "bride");
    return existsSync(path.join(installedBride, "lib", "c")) ? installedBride : path.join(__dirname, "..");
}

export function getLibDir() {
    return path.join(getBrideRoot(), "lib", "c");
}

export function getC3LibDir() {
    return path.join(getBrideRoot(), "lib", "c3");
}

export function getBrideFolder() {
    const cwd = process.cwd();
    return path.join(cwd, "node_modules", "bride");
}