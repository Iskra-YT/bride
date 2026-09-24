import { execFileSync } from "node:child_process";
import { cp } from "node:fs/promises";
import { hasEmcc } from "./utils.js";
import fs from "node:fs";
import path from "node:path";

export async function buildProject() {
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

    await copyData(dist);
}

async function copyData(dist) {
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
}