#!/usr/bin/env node
/**
 * Bride performance benchmarks.
 *
 *   node benchmarks/run.mjs [options]
 *
 *   --out <file>       where to write the JSON results
 *                      (default: benchmarks/results/benchmark-results.json)
 *   --quick            fewer iterations, for local iteration
 *   --only <a,b,...>   run only the named suites
 *   --skip <a,b,...>   run everything except the named suites
 *
 * Suites:
 *   c-html-serialize   C HTML serializer on trees of 100 / 1 000 / 10 000
 *                      nodes, at -O0 and -O2 (needs a native C compiler)
 *   native-compile     full library compile and one-file rebuild, natively
 *   emcc-build         full `bride build` and one-file rebuild of a scaffolded
 *                      app (needs Emscripten)
 *   wasm-render        repeated rendering through the built wasm module
 *                      (needs Emscripten)
 *
 * Every suite warms up, repeats each case, reports the median and the spread,
 * and verifies its outputs — no suite can report numbers for work that broke.
 * No regression thresholds are enforced: results are a baseline, not a gate.
 */
import path from "node:path";

import { collectEnvironment, collectGitInfo, repoRoot } from "./lib/envinfo.mjs";
import {
    appendStepSummary,
    buildResults,
    printConsoleSummary,
    writeResultsFile,
} from "./lib/report.mjs";
import { runCompileSuite } from "./suites/compile.mjs";
import { runEmccSuites } from "./suites/emcc.mjs";
import { runSerializeSuite } from "./suites/serialize.mjs";

const options = parseArguments(process.argv.slice(2));
const outputPath = path.resolve(repoRoot, options.out ?? "benchmarks/results/benchmark-results.json");

const only = splitList(options.only);
const skip = splitList(options.skip);
const quick = Boolean(options.quick);

function splitList(value) {
    return value
        ? String(value)
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean)
        : [];
}

function wanted(suite) {
    if (only.length > 0 && !only.includes(suite)) {
        return false;
    }

    return !skip.includes(suite);
}

const suites = [];
const skipped = [];

function record(result) {
    if (result.suite) {
        suites.push(result.suite);
    }

    for (const suite of result.suites ?? []) {
        suites.push(suite);
    }

    for (const entry of [
        ...(Array.isArray(result.skipped) ? result.skipped : [result.skipped]),
        ...(result.skippedEntries ?? []),
    ]) {
        if (entry) {
            skipped.push(entry);
        }
    }
}

console.log(`Bride benchmarks${quick ? " (quick mode)" : ""}`);
console.log(`  results: ${outputPath}`);

if (wanted("c-html-serialize")) {
    console.log("\n--- c-html-serialize ---");
    record(runSerializeSuite({ quick }));
}

if (wanted("native-compile")) {
    console.log("\n--- native-compile ---");
    record(runCompileSuite({ quick }));
}

const emccWanted = wanted("emcc-build") || wanted("wasm-render");

if (emccWanted) {
    console.log("\n--- emcc / wasm ---");
    record(
        await runEmccSuites({
            quick,
            want: {
                build: wanted("emcc-build"),
                rebuild: wanted("emcc-build"),
                render: wanted("wasm-render"),
            },
        }),
    );
}

const results = buildResults({
    suites,
    skipped,
    environment: collectEnvironment(),
    git: collectGitInfo(),
});

writeResultsFile(results, outputPath);
printConsoleSummary(results);
appendStepSummary(results);

function parseArguments(argv) {
    const parsed = {};

    for (let i = 0; i < argv.length; i++) {
        const argument = argv[i];

        if (!argument.startsWith("--")) {
            throw new Error(`Unexpected argument: "${argument}"`);
        }

        const name = argument.slice(2);
        const next = argv[i + 1];

        if (next !== undefined && !next.startsWith("--")) {
            parsed[name] = next;
            i++;
        } else {
            parsed[name] = true;
        }
    }

    return parsed;
}
