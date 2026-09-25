import { execFileSync } from "node:child_process";
import { cp } from "node:fs/promises";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasEmcc, findFiles } from "./utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildProject() {
    const cwd = process.cwd();

    console.log("Building Bride project...");

    const packageJson = JSON.parse(
        readFileSync(path.join(cwd, "package.json"), "utf8"),
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

    const installedBride = path.join(cwd, "node_modules", "bride");

    const brideRoot = existsSync(path.join(installedBride, "lib", "c")) ? installedBride : path.join(__dirname, "..");

    const libDir = path.join(brideRoot, "lib", "c");
    const projectSrcDir = path.join(cwd, src);

    const projectSources = findFiles(projectSrcDir, ".c");
    const librarySources = findFiles(libDir, ".c");
    const allSources = [...projectSources, ...librarySources];

    if (allSources.length === 0) {
        throw new Error("No .c files found to compile.");
    }

    const dist = path.join(cwd, "dist");

    mkdirSync(dist, { recursive: true });

    const rel = (file) => path.relative(cwd, file);
    const includeArgs = ["-I", rel(libDir)];

    const libBuildDir = path.join(dist, "lib");

    mkdirSync(libBuildDir, { recursive: true });

    const objects = librarySources.map((source) => {
        const object = path.join(libBuildDir, `${path.parse(source).name}.o`);

        execFileSync("emcc", [
            "-c",
            rel(source),
            "-o",
            rel(object),
            ...includeArgs,
        ]);

        return object;
    });

    const archive = path.join(dist, "libbride.a");

    execFileSync("emar", ["rcs", rel(archive), ...objects.map(rel)]);

    console.log(`Built ${rel(archive)}`);

    if (projectSources.length > 0) {
        const output = path.join(dist, "main.wasm");

        execFileSync("emcc", [
            ...projectSources.map(rel),
            rel(archive),
            "-o",
            rel(output),
            ...includeArgs,
            "-s",
            "WASM=1",
        ]);

        console.log(`Built ${rel(output)}`);
    }

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
}
