import { hasEmcc, findFiles, getLibDir, hasEmpp, getBrideFolder } from "./utils.js";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { rm } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function compileDotA() {
    const cwd = process.cwd();
    const dist = path.join(cwd, "dist");

    const libBuildDir = path.join(dist, "lib");
    mkdirSync(libBuildDir, { recursive: true});
    
    const libDir = getLibDir();
    const librarySources = findFiles(libDir, ".c");

    const rel = (file) => path.relative(cwd, file);
    const includeArgs = ["-I", rel(getLibDir())];

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
    
    const archive = path.join(libBuildDir, "libbride.a");
    execFileSync("emar", ["rcs", rel(archive), ...objects.map(rel)]);
    console.log(`Built ${rel(archive)}`);

    return archive;
}

export async function compileC(src, archive) {
    const cwd = process.cwd();
    const dist = path.join(cwd, "dist");
    if (!hasEmcc()) {
        throw new Error(
            "Emscripten (emcc) is not installed. Please install it to build the project.",
        );
    }

    const projectSrcDir = path.join(cwd, src);

    const projectSources = findFiles(projectSrcDir, ".c");

    if (projectSources.length === 0) {
        throw new Error("No .c files found to compile.");
    }

    const rel = (file) => path.relative(cwd, file);
    const includeArgs = ["-I", rel(getLibDir())];

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
        await rm("dist/lib", { recursive: true, force: true });
    }
}

export async function compileCpp(src, archive) {
    const cwd = process.cwd();
    const dist = path.join(cwd, "dist");
    if (!hasEmpp()) {
        throw new Error(
            "Emscripten (em++) is not installed. Please install it to build the project.",
        );
    }

    const projectSrcDir = path.join(cwd, src);

    const projectSources = findFiles(projectSrcDir, ".cpp");

    if (projectSources.length === 0) {
        throw new Error("No .cpp files found to compile.");
    }

    const rel = (file) => path.relative(cwd, file);
    const includeArgs = ["-I", rel(getLibDir()), "-I", rel(path.join(getBrideFolder(), "lib", "cpp"))];

    if (projectSources.length > 0) {
        const output = path.join(dist, "main.wasm");
        execFileSync("em++", [
            ...projectSources.map(rel),
            rel(archive),
            "-o",
            rel(output),
            ...includeArgs,
            "-s",
            "WASM=1",
        ]);

        console.log(`Built ${rel(output)}`);
        await rm("dist/lib", { recursive: true, force: true });
    }
}