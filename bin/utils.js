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
    const installedBride = path.join(cwd, "node_modules", "bride-cli");
    return existsSync(path.join(installedBride, "lib", "c")) ? installedBride : path.join(__dirname, "..");
}

export function getLibDir() {
    return path.join(getBrideRoot(), "lib", "c");
}

export function getC3LibDir() {
    return path.join(getBrideRoot(), "lib");
}

export function getBrideFolder() {
    const cwd = process.cwd();
    return path.join(cwd, "node_modules", "bride-cli");
}

// File extensions the dev server watches for changes.
export const SOURCE_EXTENSIONS = [".c", ".h", ".cpp", ".hpp", ".c3"];

export function isSourceFile(filename) {
    if (!filename) {
        return false;
    }

    return SOURCE_EXTENSIONS.some((extension) => filename.endsWith(extension));
}

// Content types served by the dev server. Anything missing falls back to
// "application/octet-stream".
export const CONTENT_TYPES = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".wasm": "application/wasm",
    ".css": "text/css",
    ".json": "application/json",
    ".map": "application/json",
    ".webmanifest": "application/manifest+json",
    ".txt": "text/plain",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
};

export function getContentType(extension) {
    return CONTENT_TYPES[extension] || "application/octet-stream";
}

export const DEFAULT_DEV_PORT = 9876;
export const DEFAULT_DEV_HOST = "localhost";

// Parses `bride dev` options. Accepts both `--port 3000` and `--port=3000`.
export function parseDevOptions(args) {
    const options = {
        port: DEFAULT_DEV_PORT,
        host: DEFAULT_DEV_HOST,
    };

    for (let i = 0; i < args.length; i++) {
        const argument = args[i];

        let name = argument;
        let value;

        const equals = argument.indexOf("=");

        if (equals !== -1) {
            name = argument.slice(0, equals);
            value = argument.slice(equals + 1);
        }

        if (name === "--port") {
            if (value === undefined) {
                value = args[++i];
            }

            const port = Number(value);

            if (!Number.isInteger(port) || port < 1 || port > 65535) {
                throw new Error(
                    `Invalid port: "${value}". Expected an integer between 1 and 65535.`,
                );
            }

            options.port = port;
        } else if (name === "--host") {
            if (value === undefined) {
                value = args[++i];
            }

            if (!value) {
                throw new Error("Missing value for --host.");
            }

            options.host = value;
        } else {
            throw new Error(
                `Unknown option: "${argument}". Supported options: --port, --host.`,
            );
        }
    }

    return options;
}