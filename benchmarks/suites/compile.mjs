// Native compile-time benchmarks for the Bride C library. They use the same
// source set as `bride build` (bin/compile.js compileDotA() compiles every
// .c file under lib/c), driven by the host C compiler so the measurement does
// not depend on Emscripten being installed.
//
// Two cases:
//   * compile-lib-full    — every library source compiled plus `ar` archive,
//                           into a fresh directory, exactly like a full build;
//   * rebuild-lib-one-file — one source file changed, then only that
//                           translation unit recompiled and the archive
//                           updated: the smallest rebuild unit the current
//                           toolchain supports. The Bride CLI itself has no
//                           incremental mode — `bride build` always redoes the
//                           full compile, so a "rebuild" through the CLI costs
//                           a full build (measured separately by the emcc
//                           suite when Emscripten is installed).
//
// Native-only flags mirror tests/native/style.test.js: -Wno-attributes plus a
// stub <emscripten/emscripten.h> let the whole library compile natively.

import { execFileSync } from "node:child_process";
import {
    cpSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { computeStats } from "../lib/stats.mjs";
import { findCompiler, writeEmscriptenShim } from "../lib/toolchain.mjs";
import { repoRoot } from "../lib/envinfo.mjs";
import { findFiles } from "../../bin/utils.js";

const LIB_DIR = path.join(repoRoot, "lib", "c");
const CHANGED_SOURCE = path.join("bride", "html", "tag.c");

function compileFlags(shimDir) {
    return ["-std=gnu11", "-Wno-attributes", "-I", shimDir, "-I", LIB_DIR];
}

function timeMilliseconds(fn) {
    const started = performance.now();
    fn();

    return performance.now() - started;
}

/** Compiles every library source under `sourceRoot` and archives the objects. */
function compileLibrary(compiler, sourceRoot, shimDir, outputDir) {
    const sources = findFiles(sourceRoot, ".c");

    if (sources.length === 0) {
        throw new Error(`no C sources found under ${sourceRoot}`);
    }

    const objects = sources.map((source, index) => {
        const object = path.join(outputDir, `lib-${index}.o`);

        execFileSync(compiler, [
            ...compileFlags(shimDir),
            "-c",
            "-o",
            object,
            source,
        ]);

        return object;
    });

    const archive = path.join(outputDir, "libbride.a");
    execFileSync("ar", ["rcs", archive, ...objects]);

    if (!existsSync(archive) || statSync(archive).size === 0) {
        throw new Error(`ar produced no archive at ${archive}`);
    }

    return archive;
}

function runCase(id, { warmup, iterations }, measure) {
    for (let i = 0; i < warmup; i++) {
        measure();
    }

    const samples = [];

    for (let i = 0; i < iterations; i++) {
        samples.push(measure());
    }

    return {
        id,
        unit: "ms",
        metrics: {},
        warmup,
        stats: computeStats(samples),
        samples,
    };
}

export function runCompileSuite({ quick }) {
    const compiler = findCompiler();

    if (!compiler) {
        return {
            skipped: {
                suite: "native-compile",
                reason: "no C compiler (cc, gcc, clang) found",
            },
        };
    }

    if (!findFiles(LIB_DIR, ".c").length) {
        return {
            skipped: {
                suite: "native-compile",
                reason: `no C sources found under ${LIB_DIR}`,
            },
        };
    }

    const workdir = mkdtempSync(path.join(tmpdir(), "bride-bench-compile-"));
    const shimDir = writeEmscriptenShim(path.join(workdir, "shim"));

    try {
        const cases = [];

        // A full library compile into a fresh directory per iteration, the way
        // `bride build` does it.
        let fullIteration = 0;

        cases.push(
            runCase(
                "compile-lib-full",
                { warmup: 1, iterations: quick ? 3 : 7 },
                () => {
                    const iterationDir = path.join(
                        workdir,
                        `full-${fullIteration++}`,
                    );

                    mkdirSync(iterationDir, { recursive: true });

                    const elapsed = timeMilliseconds(() => {
                        compileLibrary(compiler, LIB_DIR, shimDir, iterationDir);
                    });

                    rmSync(iterationDir, { recursive: true, force: true });

                    return elapsed;
                },
            ),
        );

        // One-file rebuild on a private copy of the sources, so the change is
        // deterministic and never touches the repository.
        const copyDir = path.join(workdir, "rebuild");
        cpSync(LIB_DIR, copyDir, { recursive: true });

        const rebuildOutputDir = path.join(workdir, "rebuild-objects");
        mkdirSync(rebuildOutputDir, { recursive: true });
        compileLibrary(compiler, copyDir, shimDir, rebuildOutputDir);

        const changedSource = path.join(copyDir, CHANGED_SOURCE);
        const originalSource = readFileSync(changedSource, "utf8");

        let iteration = 0;

        cases.push(
            runCase(
                "rebuild-lib-one-file",
                { warmup: 1, iterations: quick ? 5 : 15 },
                () => {
                    // A constant-size content change: the file really differs,
                    // so no tool can skip the recompile.
                    writeFileSync(
                        changedSource,
                        `${originalSource}\n/* rebuild benchmark iteration ${iteration++} */\n`,
                    );

                    return timeMilliseconds(() => {
                        const object = path.join(rebuildOutputDir, "tag.o");

                        execFileSync(compiler, [
                            ...compileFlags(shimDir),
                            "-c",
                            "-o",
                            object,
                            changedSource,
                        ]);
                        execFileSync("ar", [
                            "rcs",
                            path.join(rebuildOutputDir, "libbride.a"),
                            object,
                        ]);

                        if (!existsSync(object) || statSync(object).size === 0) {
                            throw new Error("recompiling the changed file produced no object");
                        }
                    });
                },
            ),
        );

        return { suite: { name: "native-compile", cases } };
    } finally {
        rmSync(workdir, { recursive: true, force: true });
    }
}
