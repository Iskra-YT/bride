// C HTML serialization benchmark: compiles benchmarks/c/html-serialize.c
// against the real lib/c/bride/html/tag.c natively and runs one process per
// tree size and optimization level.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { computeStats } from "../lib/stats.mjs";
import { findCompiler } from "../lib/toolchain.mjs";
import { repoRoot } from "../lib/envinfo.mjs";

const HARNESS = path.join(repoRoot, "benchmarks", "c", "html-serialize.c");
const LIB_DIR = path.join(repoRoot, "lib", "c");
const TAG_SOURCE = path.join(LIB_DIR, "bride", "html", "tag.c");

const CASES = ["nodes-100", "nodes-1000", "nodes-10000"];

// -O0 mirrors the flags `bride build` compiles the library with (emcc without
// an optimization level); -O2 shows the same work at a release-style
// optimization level. Both are baselines for their own configuration.
const OPT_LEVELS = ["-O0", "-O2"];

function parseHarnessOutput(output) {
    let meta = null;
    const samples = [];

    for (const line of output.split("\n")) {
        if (line.startsWith("META,")) {
            const [, name, nodes, bytes, checksum, iterations, warmup] = line.split(",");

            meta = {
                name,
                nodes: Number(nodes),
                htmlBytes: Number(bytes),
                checksum,
                iterations: Number(iterations),
                warmup: Number(warmup),
            };
        } else if (line.startsWith("SAMPLE,")) {
            const [, , nanoseconds] = line.split(",");

            samples.push(Number(nanoseconds) / 1e6);
        }
    }

    if (!meta) {
        throw new Error("the harness printed no META line");
    }

    if (samples.length !== meta.iterations) {
        throw new Error(
            `the harness printed ${samples.length} samples, expected ${meta.iterations}`,
        );
    }

    return { meta, samples };
}

export function runSerializeSuite({ quick }) {
    const compiler = findCompiler();

    if (!compiler) {
        return {
            skipped: {
                suite: "c-html-serialize",
                reason: "no C compiler (cc, gcc, clang) found",
            },
        };
    }

    const iterations = quick ? 10 : 30;
    const warmup = quick ? 3 : 5;
    const workdir = mkdtempSync(path.join(tmpdir(), "bride-bench-serialize-"));

    try {
        const cases = [];

        for (const opt of OPT_LEVELS) {
            const binary = path.join(workdir, `html-serialize-${opt}`);

            execFileSync(compiler, [
                "-std=gnu11",
                "-Wall",
                "-Wextra",
                opt,
                "-I",
                LIB_DIR,
                "-o",
                binary,
                HARNESS,
                TAG_SOURCE,
            ]);

            for (const name of CASES) {
                const output = execFileSync(
                    binary,
                    [name, "--iterations", String(iterations), "--warmup", String(warmup)],
                    { encoding: "utf8" },
                );
                const { meta, samples } = parseHarnessOutput(output);
                const stats = computeStats(samples);

                cases.push({
                    id: `html-serialize/${opt}/${name}`,
                    unit: "ms",
                    metrics: {
                        nodes: meta.nodes,
                        htmlBytes: meta.htmlBytes,
                        htmlKbPerSecond: meta.htmlBytes / 1000 / (stats.median / 1000),
                        nodesPerSecond: meta.nodes / (stats.median / 1000),
                    },
                    verification: {
                        goldenTree: true,
                        perIterationChecksum: meta.checksum,
                    },
                    warmup: meta.warmup,
                    stats,
                    samples,
                });
            }
        }

        return { suite: { name: "c-html-serialize", cases } };
    } finally {
        rmSync(workdir, { recursive: true, force: true });
    }
}
