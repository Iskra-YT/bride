import { cp } from "node:fs/promises";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { compileDotA, compileC } from "./compile.js";

export async function buildProject() {
    const cwd = process.cwd();

    const dist = path.join(cwd, "dist");
    mkdirSync(dist, { recursive: true });

    console.log("Building Bride project...");

    const packageJson = JSON.parse(
        readFileSync(path.join(cwd, "package.json"), "utf8"),
    );
    const projectLanguage = packageJson.language;
    const src = packageJson.src || "src";

    if (!projectLanguage) {
        throw new Error("Project language is not specified in package.json.");
    }

    const archive = compileDotA();
    if (projectLanguage === "c") {
        await compileC(src, archive);
    } else if (projectLanguage === "c3") {
        // TODO: Create C3 Language Compiler
    } else if (projectLanguage === "rust") {
        // TODO: Crate Rust Language Compiler
    }


    const installedBride = path.join(cwd, "node_modules", "bride");
    const brideRoot = existsSync(path.join(installedBride, "lib", "c")) ? installedBride : path.join(__dirname, "..");
    await copyData(dist, cwd, brideRoot);
}

async function copyData(dist, cwd, brideRoot) {
    const runtime = path.join(brideRoot, "runtime");
    const wasi = path.join(cwd, "node_modules", "@bjorn3", "browser_wasi_shim");

    await cp(runtime, dist, { recursive: true });

    await cp(path.join(wasi, "dist"), path.join(dist, "wasi"), {
        recursive: true,
    });

    await cp(
        path.join(wasi, "LICENSE-MIT"),
        path.join(dist, "wasi", "LICENCE-MIT"),
        { recursive: true },
    );

    await cp(
        path.join(wasi, "LICENSE-APACHE"),
        path.join(dist, "wasi", "LICENCE-APACHE"),
        { recursive: true },
    );

    const indexHtml = path.join(cwd, "index.html");

    if (existsSync(indexHtml)) {
        await cp(indexHtml, path.join(dist, "index.html"));
    }

    const mainJs = path.join(cwd, "main.js");

    if (existsSync(mainJs)) {
        await cp(mainJs, path.join(dist, "main.js"));
    }

    const cssFiles = path.join(cwd, "css");
    if (existsSync(cssFiles)) {
        await cp(cssFiles, path.join(dist, "css"), { recursive: true });
    }
}
