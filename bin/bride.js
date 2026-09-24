#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { cp } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function hasEmcc() {
    try {
        execFileSync("emcc", ["--version"], { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

const command = process.argv[2];

if (command === "new") {
    const template = path.join(__dirname, "..", "template");
    const target = process.cwd();

    fs.cpSync(template, target, {
        recursive: true,
    });

    console.log("Bride project created!");
} else if (command === "build") {
    console.log("Building Bride project...");

    const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
    );
    const projectLanguage = packageJson.language;
    const src = packageJson.src || "src";

    if (!projectLanguage) {
        throw new Error("Project language is not specified in package.json.");
    }

    if (projectLanguage !== "c") {
        throw new Error(
            `Project language "${projectLanguage}" is not supported.`,
        );
    }

    if (!hasEmcc()) {
        throw new Error(
            "Emscripten (emcc) is not installed. Please install it to build the project.",
        );
    }

    const dist = path.join(process.cwd(), "dist");

    fs.mkdirSync(dist, {
        recursive: true,
    });

    execFileSync("emcc", [
        `${src}/main.c`,
        "-o",
        `${dist}/main.wasm`,
        "-I./node_modules/bride/lib/c",
        "-s",
        "WASM=1",
    ]);

    await cp(
        "./node_modules/bride/runtime",
        `${dist}`,
        { recursive: true }
    );

    await cp(
        "./node_modules/@bjorn3/browser_wasi_shim/dist",
        `${dist}/wasi`,
        { recursive: true }
    );

    await cp(
        "./node_modules/@bjorn3/browser_wasi_shim/LICENSE-MIT",
        `${dist}/wasi/LICENCE-MIT`,
        { recursive: true }
    );

    await cp(
        "./node_modules/@bjorn3/browser_wasi_shim/LICENSE-APACHE",
        `${dist}/wasi/LICENCE-APACHE`,
        { recursive: true }
    );

    await cp(
        "./index.html",
        `${dist}/index.html`,
        { recursive: true }
    );

    await cp(
        "main.js",
        `${dist}/main.js`,
        { recursive: true }
    );
} else if (command === "dev") {
    console.log("Starting Bride development server...");

    // TODO: Build and run on dev port 9876
} else {
    console.log(`
Bride CLI

Commands:
  bride new
  bride build
  bride dev
`);
}
