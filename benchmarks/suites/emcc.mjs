// Emscripten/WASM benchmarks, run only when `emcc` is installed. The flow
// mirrors what a user does: `bride create` a C app from the templates, then
// `bride build` it with the real CLI, then boot the built wasm in Node.js.
//
//   * emcc-build-app    — a full `bride build` (library compile + archive +
//                         app link + dist assembly), timed end to end;
//   * emcc-rebuild-one-file — one project source changed, then only that
//                         translation unit recompiled and main.wasm relinked,
//                         using the flags from bin/compile.js compileC(). The
//                         CLI has no incremental mode, so this measures the
//                         single-file unit a future build system could reuse;
//   * wasm-render-*     — repeated rendering through the real wasm module
//                         (see benchmarks/lib/render.mjs).
//
// No network is used: the app's `node_modules/@bjorn3/browser_wasi_shim`
// dependency is symlinked from the repository's own node_modules.

import { execFileSync } from "node:child_process";
import {
    cpSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    statSync,
    symlinkSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { computeStats } from "../lib/stats.mjs";
import { repoRoot } from "../lib/envinfo.mjs";
import { hasEmcc } from "../../bin/utils.js";
import { benchmarkRender } from "../lib/render.mjs";

const CLI = path.join(repoRoot, "bin", "bride.js");
const COMPILE_JS = pathToFileURL(path.join(repoRoot, "bin", "compile.js")).href;
const LIB_DIR = path.join(repoRoot, "lib", "c");

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

export async function runEmccSuites({ quick, want }) {
    if (!hasEmcc()) {
        return {
            suites: [],
            skipped: [
                {
                    suite: "emcc-build",
                    reason: "emcc not found (install Emscripten to run the wasm benchmarks)",
                },
            ],
        };
    }

    const wasiShim = path.join(
        repoRoot,
        "node_modules",
        "@bjorn3",
        "browser_wasi_shim",
    );

    if (!existsSync(wasiShim)) {
        return {
            suites: [],
            skipped: [
                {
                    suite: "emcc-build",
                    reason: `${wasiShim} is missing — run "npm ci" in the repository first`,
                },
            ],
        };
    }

    const workspace = mkdtempSync(path.join(tmpdir(), "bride-bench-emcc-"));
    const appDir = path.join(workspace, "app");

    try {
        execFileSync(process.execPath, [CLI, "create", "app", "--lang", "c"], {
            cwd: workspace,
            stdio: "pipe",
        });

        // The scaffolded app declares bride-cli and the WASI shim as
        // dependencies; the CLI falls back to this repository when it is not
        // installed, and the shim is linked locally (no registry access).
        mkdirSync(path.join(appDir, "node_modules", "@bjorn3"), { recursive: true });
        symlinkSync(
            wasiShim,
            path.join(appDir, "node_modules", "@bjorn3", "browser_wasi_shim"),
            process.platform === "win32" ? "junction" : "dir",
        );

        const buildWasm = () => {
            const wasm = path.join(appDir, "dist", "main.wasm");

            if (!existsSync(wasm) || statSync(wasm).size === 0) {
                throw new Error(`the build produced no wasm module at ${wasm}`);
            }
        };

        const suites = [];

        if (want.build) {
            const build = runCase(
                "emcc-build-app",
                { warmup: 1, iterations: quick ? 2 : 4 },
                () => {
                    const started = performance.now();

                    execFileSync(process.execPath, [CLI, "build"], {
                        cwd: appDir,
                        stdio: "pipe",
                    });

                    const elapsed = performance.now() - started;

                    buildWasm();

                    return elapsed;
                },
            );

            suites.push({ name: "emcc-build", cases: [build] });
        }

        if (want.rebuild) {
            // The library archive the app links against, produced by the
            // production compileDotA() and cached for the relink steps.
            execFileSync(
                process.execPath,
                [
                    "--input-type=module",
                    "-e",
                    `import { compileDotA } from ${JSON.stringify(COMPILE_JS)}; compileDotA();`,
                ],
                { cwd: appDir, stdio: "pipe" },
            );

            const cachedArchive = path.join(workspace, "libbride-cache.a");

            cpSync(path.join(appDir, "dist", "lib", "libbride.a"), cachedArchive);

            const mainSource = path.join(appDir, "src", "main.c");
            const original = readFileSync(mainSource, "utf8");
            const object = path.join(workspace, "main-rebuild.o");
            const wasm = path.join(appDir, "dist", "main.wasm");

            let iteration = 0;

            const rebuild = runCase(
                "emcc-rebuild-one-file",
                { warmup: 1, iterations: quick ? 2 : 5 },
                () => {
                    // Same flags as compileC() in bin/compile.js, minus the
                    // library compile (the archive does not change when a
                    // project file changes).
                    writeFileSync(
                        mainSource,
                        `${original}\n/* rebuild benchmark iteration ${iteration++} */\n`,
                    );

                    const started = performance.now();

                    execFileSync(
                        "emcc",
                        ["-c", "src/main.c", "-o", object, "-I", LIB_DIR],
                        { cwd: appDir, stdio: "pipe" },
                    );
                    execFileSync(
                        "emcc",
                        [object, cachedArchive, "-o", wasm, "-I", LIB_DIR, "-s", "WASM=1"],
                        { cwd: appDir, stdio: "pipe" },
                    );

                    const elapsed = performance.now() - started;

                    if (!existsSync(wasm) || statSync(wasm).size === 0) {
                        throw new Error("relinking after the change produced no wasm module");
                    }

                    return elapsed;
                },
            );

            suites.push({ name: "emcc-rebuild", cases: [rebuild] });
        }

        if (want.render) {
            // The render cases need a built app; with --only wasm-render no
            // build has happened yet, so build one (untimed).
            if (!existsSync(path.join(appDir, "dist", "main.wasm"))) {
                execFileSync(process.execPath, [CLI, "build"], {
                    cwd: appDir,
                    stdio: "pipe",
                });
            }

            buildWasm();

            const render = await benchmarkRender({
                dist: path.join(appDir, "dist"),
                iterations: quick ? 10 : 30,
                warmup: quick ? 3 : 5,
            });

            const cases = [
                {
                    id: "wasm-render-full-page",
                    unit: "ms",
                    metrics: { htmlBytes: render.htmlBytes },
                    warmup: quick ? 3 : 5,
                    stats: computeStats(render.fullPageSamples),
                    samples: render.fullPageSamples,
                },
            ];

            if (render.clickSamples.length > 0) {
                cases.push({
                    id: "wasm-render-click-update",
                    unit: "ms",
                    metrics: {},
                    warmup: quick ? 3 : 5,
                    stats: computeStats(render.clickSamples),
                    samples: render.clickSamples,
                });
            }

            suites.push({ name: "wasm-render", cases });
        }

        return { suites, skipped: [] };
    } finally {
        rmSync(workspace, { recursive: true, force: true });
    }
}
