// Compiles the C library natively and runs the style builder assertions for
// every port:
//
//   * C and C++ from the same source (the C++ layer is header-only, so one file
//     exercises both).
//   * C3 when the compiler is installed, linked against the same C objects.
//   * Zig when the compiler is installed, linked against the same C objects.
//
// Skipped when the needed compilers are unavailable.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { findFiles } from "../../bin/utils.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const libDir = path.join(root, "lib", "c");
const cppDir = path.join(root, "lib", "cpp");
const c3Source = path.join(root, "lib", "bride.c3");
const zigSource = path.join(root, "lib", "zig", "bride.zig");
const cSource = path.join(here, "style.c");
const c3TestSource = path.join(here, "style-c3.c3");
const zigTestSource = path.join(here, "style-zig.zig");

// `dispatch.c` includes <emscripten/emscripten.h>; a native build only needs
// EMSCRIPTEN_KEEPALIVE to expand to nothing.
const EMSCRIPTEN_SHIM = `#ifndef BRIDE_TEST_EMSCRIPTEN_H
#define BRIDE_TEST_EMSCRIPTEN_H
#define EMSCRIPTEN_KEEPALIVE
#endif
`;

// Flags shared by every native build. `-Wno-attributes` silences the
// Emscripten-only `import_module`/`import_name` attributes.
function commonFlags(shimDir) {
    return ["-Wall", "-Wextra", "-Wno-attributes", "-I", shimDir, "-I", libDir, "-I", cppDir];
}

function run(command, args, options = {}) {
    try {
        return execFileSync(command, args, { stdio: "pipe", ...options });
    } catch (error) {
        const details = [error.stdout, error.stderr]
            .filter(Boolean)
            .map(String)
            .join("\n");

        throw new Error(`${command} ${args.join(" ")} failed\n${details}`, {
            cause: error,
        });
    }
}

// Like `run`, but returns stdout and stderr combined. The Zig assertions report
// their results with `std.debug.print`, which writes to stderr.
function runMerged(command, args, options = {}) {
    const result = spawnSync(command, args, { encoding: "utf8", ...options });
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

    if (result.error || result.status !== 0) {
        throw new Error(
            `${command} ${args.join(" ")} failed (status ${result.status})\n${output}`,
            { cause: result.error },
        );
    }

    return output;
}

function hasCommand(command, args) {
    try {
        execFileSync(command, args, { stdio: "ignore" });

        return true;
    } catch {
        return false;
    }
}

function findCompiler(candidates) {
    return candidates.find((candidate) => hasCommand(candidate, ["--version"])) ?? null;
}

/** Every object file produced under `directory` (c3c writes into `obj/<target>`). */
function objectsIn(directory) {
    // c3c names objects `.obj` when it targets Windows and `.o` elsewhere.
    return [...findFiles(directory, ".o"), ...findFiles(directory, ".obj")];
}

const cCompiler = findCompiler(["cc", "gcc", "clang"]);
const cppCompiler = findCompiler(["c++", "g++", "clang++"]);
const c3Compiler = hasCommand("c3c", ["--version"]) ? "c3c" : null;
const zigCompiler = hasCommand("zig", ["version"]) ? "zig" : null;

const workdir = mkdtempSync(path.join(tmpdir(), "bride-style-"));

// The C library is compiled once and shared by every language test.
let libraryObjects = null;

if (cCompiler) {
    const shimDir = path.join(workdir, "shim");

    mkdirSync(path.join(shimDir, "emscripten"), { recursive: true });
    writeFileSync(path.join(shimDir, "emscripten", "emscripten.h"), EMSCRIPTEN_SHIM);

    libraryObjects = findFiles(libDir, ".c").map((file, index) => {
        const object = path.join(workdir, `lib-${index}.o`);

        run(cCompiler, ["-std=gnu11", ...commonFlags(shimDir), "-c", "-o", object, file]);

        return object;
    });
}

after(() => {
    rmSync(workdir, { recursive: true, force: true });
});

test(
    "the style builder renders classes and injects rules",
    { skip: cCompiler ? false : "no C compiler (cc, gcc, clang) found" },
    () => {
        const shimDir = path.join(workdir, "shim");
        const builds = [
            { name: "C", compiler: cCompiler, standard: "-std=gnu11", language: "c" },
        ];

        if (cppCompiler) {
            builds.push({
                name: "C++",
                compiler: cppCompiler,
                standard: "-std=gnu++17",
                language: "c++",
            });
        }

        for (const build of builds) {
            const object = path.join(workdir, `style-${build.name}.o`);
            const binary = path.join(workdir, `style-${build.name}`);

            run(build.compiler, [
                build.standard,
                ...commonFlags(shimDir),
                "-x",
                build.language,
                "-c",
                "-o",
                object,
                cSource,
            ]);
            run(build.compiler, ["-o", binary, object, ...libraryObjects]);

            const output = run(binary, [], { encoding: "utf8" });

            assert.match(output, /All style checks passed\./, `${build.name}: ${output}`);
            assert.doesNotMatch(output, /FAIL/, `${build.name}: ${output}`);
        }
    },
);

test(
    "the C3 bindings compile the styling API",
    { skip: c3Compiler ? false : "no C3 compiler (c3c) found" },
    () => {
        const c3BuildDir = path.join(workdir, "c3-compile");

        mkdirSync(c3BuildDir, { recursive: true });
        run(c3Compiler, ["compile-only", c3Source], { cwd: c3BuildDir });

        assert.ok(objectsIn(c3BuildDir).length > 0, "c3c produced no object files");
    },
);

test(
    "the C3 bindings build and apply styles",
    {
        skip: !cCompiler
            ? "no C compiler (cc, gcc, clang) found"
            : c3Compiler
              ? process.platform === "win32"
                  ? "linking a C3 build needs a C toolchain matching the C3 target"
                  : false
              : "no C3 compiler (c3c) found",
    },
    () => {
        const c3BuildDir = path.join(workdir, "c3");

        mkdirSync(c3BuildDir, { recursive: true });
        run(c3Compiler, ["compile-only", c3Source, c3TestSource], { cwd: c3BuildDir });

        const objects = objectsIn(c3BuildDir);

        assert.ok(objects.length > 0, "c3c produced no object files");

        const binary = path.join(workdir, "style-c3");
        // The C3 standard library pulls in the math and threading libraries and
        // uses dlopen; -ldl is part of libc on newer glibc, but the flag is
        // still accepted on Linux only.
        const extra =
            process.platform === "linux" ? ["-lm", "-lpthread", "-ldl"] : ["-lm"];

        run(cCompiler, ["-o", binary, ...objects, ...libraryObjects, ...extra]);

        const output = run(binary, [], { encoding: "utf8" });

        assert.match(output, /All C3 style checks passed\./, output);
        assert.doesNotMatch(output, /FAIL/, output);
    },
);

test(
    "the Zig bindings compile to a wasm object",
    { skip: zigCompiler ? false : "no Zig compiler (zig) found" },
    () => {
        const object = path.join(workdir, "bride-zig-wasm.o");

        run(zigCompiler, [
            "build-obj",
            "-target",
            "wasm32-emscripten",
            zigSource,
            `-femit-bin=${object}`,
        ]);

        assert.ok(existsSync(object), "zig produced no object file");
    },
);

test(
    "the Zig bindings build and apply styles",
    {
        skip: !cCompiler
            ? "no C compiler (cc, gcc, clang) found"
            : zigCompiler
              ? false
              : "no Zig compiler (zig) found",
    },
    () => {
        // Zig writes the binary under exactly the name it is given, so on
        // Windows it needs the `.exe` suffix to be launchable.
        const binary = path.join(
            workdir,
            process.platform === "win32" ? "style-zig.exe" : "style-zig",
        );

        // The test sources import the bindings through the named `bride` module;
        // the native build of the C library provides the C symbols.
        run(zigCompiler, [
            "build-exe",
            "--dep",
            "bride",
            `-Mroot=${zigTestSource}`,
            `-Mbride=${zigSource}`,
            "-lc",
            `-femit-bin=${binary}`,
            ...libraryObjects,
        ]);

        const output = runMerged(binary, []);

        assert.match(output, /All Zig style checks passed\./, output);
        assert.doesNotMatch(output, /FAIL/, output);
    },
);
