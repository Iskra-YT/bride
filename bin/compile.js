import {
    hasEmcc,
    hasC3c,
    hasZig,
    findFiles,
    getLibDir,
    hasEmpp,
    getBrideFolder,
    getC3LibDir,
    getZigLibDir,
} from "./utils.js";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { rm } from "node:fs/promises";

const cwd = process.cwd();
const rel = (file) => path.relative(cwd, file);

export function compileDotA() {
    if (!hasEmcc()) {
        throw new Error(
            "Emscripten (emcc) is not installed. Please install it to build the project.",
        );
    }

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
extern int bride_c3_main(int argc, char** argv) __asm__("main");

__attribute__((weak)) int __main_argc_argv(int argc, char** argv) {
    return bride_c3_main(argc, argv);
}
`;

// Emscripten's crt1 calls `__main_argc_argv`, not `main`, so the generated Zig
// entry below is the root module and the project's own entry file is compiled
// as the non-root `app` module. Because `app` is not the root module Zig never
// pulls in `start.zig`, so the project writes a plain `pub fn main()` (returning
// `void`, `!void` or an integer) and no `main` symbol is emitted — which is what
// keeps the C runtime happy. The C3 bindings need a C shim for the same reason.
const ZIG_ENTRY_SOURCE = `
const app = @import("app");

fn runApp() c_int {
    const Return = @typeInfo(@TypeOf(app.main)).@"fn".return_type.?;

    if (Return == void) {
        app.main();
        return 0;
    } else if (@typeInfo(Return) == .error_union) {
        app.main() catch return 1;
        return 0;
    } else {
        return @intCast(app.main());
    }
}

export fn __main_argc_argv(argc: c_int, argv: [*][*:0]u8) c_int {
    _ = argc;
    _ = argv;
    return runApp();
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

    const bindings = getC3LibDir();

    if (!existsSync(bindings)) {
        throw new Error(`Bride C3 bindings not found at ${rel(bindings)}.`);
    }

    execFileSync("c3c", ["build", "--sources", rel(bindings)], {
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

export async function compileZig(src, archive) {
    const dist = path.join(cwd, "dist");
    if (!hasZig()) {
        throw new Error(
            "Zig (zig) is not installed. Please install it to build the project.",
        );
    }

    if (!hasEmcc()) {
        throw new Error(
            "Emscripten (emcc) is not installed. Please install it to build the project.",
        );
    }

    const bindings = getZigLibDir();

    if (!existsSync(bindings)) {
        throw new Error(`Bride Zig bindings not found at ${rel(bindings)}.`);
    }

    const projectSrcDir = path.join(cwd, src);

    const projectSources = findFiles(projectSrcDir, ".zig");

    if (projectSources.length === 0) {
        throw new Error("No .zig files found to compile.");
    }

    // The project source is compiled as the `app` module: any other project
    // file is pulled in through `@import`. Prefer the conventional `main.zig`.
    const entry =
        projectSources.find((file) => path.basename(file) === "main.zig") ??
        projectSources[0];

    const object = path.join(dist, "lib", `${path.parse(entry).name}.o`);
    const brideModule = path.join(bindings, "bride.zig");

    mkdirSync(path.join(dist, "lib"), { recursive: true });

    // The generated entry is the Zig root module; the project's entry file and
    // the Bride bindings are its `app` and `bride` dependencies. `ReleaseSmall`
    // drops the Debug-mode standard library, whose socket and filesystem calls
    // would otherwise become imports the browser runtime cannot provide.
    const entrySource = path.join(dist, "lib", "zig_entry.zig");
    writeFileSync(entrySource, ZIG_ENTRY_SOURCE);

    execFileSync("zig", [
        "build-obj",
        "-target",
        "wasm32-emscripten",
        "-fno-entry",
        "-O",
        "ReleaseSmall",
        `-femit-bin=${rel(object)}`,
        "--dep",
        "app",
        `-Mroot=${rel(entrySource)}`,
        "--dep",
        "bride",
        `-Mapp=${rel(entry)}`,
        `-Mbride=${rel(brideModule)}`,
    ]);

    const output = path.join(dist, "main.wasm");
    execFileSync("emcc", [
        rel(object),
        rel(archive),
        "-o",
        rel(output),
        "-s",
        "WASM=1",
    ]);

    console.log(`Built ${rel(output)}`);
    await rm("dist/lib", { recursive: true, force: true });
}
