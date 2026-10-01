import {
    hasEmcc,
    hasC3c,
    findFiles,
    getLibDir,
    hasEmpp,
    getBrideFolder,
} from "./utils.js";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cwd = process.cwd();
const rel = (file) => path.relative(cwd, file);

export function compileDotA() {
    const dist = path.join(cwd, "dist");

    const libBuildDir = path.join(dist, "lib");
    mkdirSync(libBuildDir, { recursive: true });

    const libDir = getLibDir();
    const librarySources = findFiles(libDir, ".c");

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

    const includeArgs = [
        "-I",
        rel(getLibDir()),
        "-I",
        rel(path.join(getBrideFolder(), "lib", "cpp")),
    ];

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

const C3_ENTRY_SOURCE = `
extern int main(int argc, char** argv);

__attribute__((weak)) int __main_argc_argv(int argc, char** argv) {
    return main(argc, argv);
}
`;

export async function compileC3(src, archive) {
    const dist = path.join(cwd, "dist");
    if (!hasC3c()) {
        throw new Error(
            "C3 Compiler (c3c) is not installed. Please install it to build the project",
        );
    }

    if (!hasEmcc()) {
        throw new Error(
            "Emscripten (emcc) is not installed. Please install it to build the project.",
        );
    }

    await rm(path.join(dist, "lib", "obj"), { recursive: true, force: true });

    execFileSync("c3c", ["build"], {
        cwd: cwd,
        stdio: "inherit",
    });

    const output = path.join(dist, "main.wasm");
    const linkerObjects = findFiles(path.join(dist, "lib", "obj"), ".o");

    if (linkerObjects.length === 0) {
        throw new Error(
            "c3c produced no object files. Is the target in project.json set to \"emscripten\"?",
        );
    }

    const entrySource = path.join(dist, "lib", "c3_entry.c");
    const entryObject = path.join(dist, "lib", "c3_entry.o");
    writeFileSync(entrySource, C3_ENTRY_SOURCE);
    execFileSync("emcc", ["-c", rel(entrySource), "-o", rel(entryObject)]);

    execFileSync("emcc", [
        ...linkerObjects.map(rel),
        rel(entryObject),
        rel(archive),
        "-o",
        rel(output),
        "-s",
        "WASM=1"
    ]);

    console.log(`Built ${rel(output)}`);
    await rm("dist/lib", { recursive: true, force: true });
}
