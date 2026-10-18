// Result assembly, the JSON results file, the console table and the GitHub
// Actions job summary. No thresholds are applied anywhere: results are
// reported, never judged.

import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export const RESULTS_SCHEMA = "bride-benchmarks/1";

/** Rounds a millisecond value for human-readable output. */
export function formatMs(value) {
    if (value >= 100) {
        return `${value.toFixed(0)} ms`;
    }

    if (value >= 1) {
        return `${value.toFixed(2)} ms`;
    }

    return `${value.toFixed(3)} ms`;
}

export function buildResults({ suites, skipped, environment, git }) {
    return {
        schema: RESULTS_SCHEMA,
        generatedAt: new Date().toISOString(),
        git,
        environment,
        // Explicitly recorded: these benchmarks establish a baseline; they do
        // not enforce regression thresholds.
        thresholdsEnforced: false,
        suites,
        skipped,
    };
}

export function writeResultsFile(results, outputPath) {
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);

    console.log(`\nResults written to ${outputPath}`);
}

export function printConsoleSummary(results) {
    console.log("\n=== Benchmark summary (median [p25 .. p75], no thresholds) ===");

    for (const suite of results.suites) {
        console.log(`\n${suite.name}`);

        for (const benchmarkCase of suite.cases) {
            const { stats } = benchmarkCase;
            const spread = stats.iqr > 0 ? ` [${formatMs(stats.p25)} .. ${formatMs(stats.p75)}]` : "";

            console.log(
                `  ${benchmarkCase.id.padEnd(38)} ${formatMs(stats.median).padStart(11)}${spread}` +
                    `  (min ${formatMs(stats.min)}, max ${formatMs(stats.max)}, n=${stats.count})`,
            );
        }
    }

    for (const entry of results.skipped) {
        console.log(`\nskipped ${entry.suite}: ${entry.reason}`);
    }
}

/** Appends a Markdown summary to $GITHUB_STEP_SUMMARY when running in CI. */
export function appendStepSummary(results) {
    const file = process.env.GITHUB_STEP_SUMMARY;

    if (!file) {
        return;
    }

    const lines = [
        "## Bride benchmarks",
        "",
        `Commit \`${results.git.commit ?? "unknown"}\` on \`${results.git.ref ?? "unknown"}\`` +
            `${results.git.dirty ? " (dirty working tree)" : ""}`,
        "",
        `Node ${results.environment.node}, ${results.environment.os}, ${results.environment.cpu}.`,
        "",
        "No regression thresholds are enforced — this is a baseline report.",
        "",
    ];

    for (const suite of results.suites) {
        lines.push(`### ${suite.name}`, "");
        lines.push("| case | median | p25 | p75 | min | max | n |");
        lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");

        for (const benchmarkCase of suite.cases) {
            const { stats } = benchmarkCase;

            lines.push(
                `| \`${benchmarkCase.id}\` | ${formatMs(stats.median)} | ${formatMs(stats.p25)}` +
                    ` | ${formatMs(stats.p75)} | ${formatMs(stats.min)} | ${formatMs(stats.max)} | ${stats.count} |`,
            );
        }

        lines.push("");
    }

    for (const entry of results.skipped) {
        lines.push(`- skipped **${entry.suite}**: ${entry.reason}`);
    }

    if (results.skipped.length > 0) {
        lines.push("");
    }

    appendFileSync(file, `${lines.join("\n")}\n`);
}
