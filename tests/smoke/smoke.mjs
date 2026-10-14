#!/usr/bin/env node
/**
 * End-to-end smoke test of the Bride CLI, following the same steps a user
 * follows: pack the package with `npm pack`, install the tarball into an empty
 * directory, scaffold a project with `bride new <language>`, build it with
 * `bride build` and check that the result actually runs.
 *
 *   node tests/smoke/smoke.mjs [options]
 *
 *   --lang <c|cpp|c3>[,<c|cpp|c3>]   language(s) to scaffold (default: c)
 *   --browser                        also run the built app in Chromium
 *                                    (installs Playwright into the app first)
 *   --keep                           keep the workspace afterwards
 *   --workspace <dir>                where to do the work (default: a
 *                                    throw-away directory in the temp folder)
 *
 * Everything happens in the workspace, so the repository is left as it was: the
 * packed tarball is moved out of the way and the scaffolded project is removed
 * unless `--keep` is given.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { listTemplates } from "../../bin/new.js";
import { verifyDist } from "./verify-dist.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const smokeDir = path.join(repoRoot, "tests", "smoke");

const options = parseArguments(process.argv.slice(2));
const languages = parseLanguages(options.lang);
const browserCheck = Boolean(options.browser);
const keep = Boolean(options.keep);

const workspace = options.workspace
    ? path.resolve(options.workspace)
    : fs.mkdtempSync(path.join(os.tmpdir(), "bride-smoke-"));

fs.mkdirSync(workspace, { recursive: true });

const projectPackage = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"),
);

// `npm` and `npx` are .cmd shims on Windows, which Node only runs through a
// shell. The arguments never contain spaces (the tarball name is fixed), so
// joining them into a command line is safe.
const spawnOptions = process.platform === "win32" ? { shell: true } : {};

let failed = false;

function check(condition, message, details = "") {
    console.log(
        `  ${condition ? "ok  " : "FAIL"} ${message}${details ? ` — ${details}` : ""}`,
    );

    if (!condition) {
        failed = true;
    }
}

function run(command, args, cwd) {
    console.log(`\n$ ${[command, ...args].join(" ")}    (in ${cwd})`);
    execFileSync(command, args, {
        cwd,
        stdio: "inherit",
        ...spawnOptions,
    });
}

function runNodeScript(script, args, cwd) {
    try {
        execFileSync(process.execPath, [path.join(smokeDir, script), ...args], {
            cwd,
            stdio: "inherit",
        });
    } catch (error) {
        console.error(`  FAIL ${script} exited with code ${error.status ?? "?"}`);
        failed = true;
    }
}

function sha256(file) {
    return createHash("sha256")
        .update(fs.readFileSync(file))
        .digest("hex");
}

/** Runs `npm pack` in the repository and returns the tarball in the workspace. */
function pack() {
    const startedAt = Date.now();

    console.log("Packing bride-cli with npm pack...");
    execFileSync("npm", ["pack"], {
        cwd: repoRoot,
        stdio: "inherit",
        ...spawnOptions,
    });

    const candidates = fs
        .readdirSync(repoRoot)
        .filter((name) => /^bride-cli-.*\.tgz$/.test(name))
        .map((name) => ({
            name,
            time: fs.statSync(path.join(repoRoot, name)).mtimeMs,
        }))
        .filter((candidate) => candidate.time >= startedAt - 5000)
        .sort((first, second) => second.time - first.time);

    if (candidates.length === 0) {
        throw new Error("npm pack did not produce a tarball.");
    }

    const source = path.join(repoRoot, candidates[0].name);
    const target = path.join(workspace, candidates[0].name);

    fs.copyFileSync(source, target);
    fs.rmSync(source, { force: true });

    console.log(`Packed ${candidates[0].name}`);
    return target;
}

/** The CLI that `bride build` uses must be the one we just packed. */
function checkInstalledCli(appDir) {
    const installed = JSON.parse(
        fs.readFileSync(
            path.join(appDir, "node_modules", "bride-cli", "package.json"),
            "utf8",
        ),
    );

    check(
        installed.version === projectPackage.version,
        `the installed CLI is the packed version (${projectPackage.version})`,
        installed.version,
    );

    check(
        sha256(path.join(appDir, "node_modules", "bride-cli", "bin", "bride.js")) ===
            sha256(path.join(repoRoot, "bin", "bride.js")),
        "the installed bin/bride.js is the packed one",
    );
}

function parseLanguages(value) {
    const available = listTemplates();
    const requested = String(value ?? "c")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

    for (const language of requested) {
        if (!available.includes(language)) {
            throw new Error(
                `Unknown language "${language}". Available languages: ${available.join(", ")}.`,
            );
        }
    }

    return requested;
}

console.log("Bride smoke test");
console.log(`  workspace: ${workspace}`);
console.log(`  languages: ${languages.join(", ")}`);
console.log(`  browser:   ${browserCheck ? "yes" : "no"}`);

let tarball;

try {
    tarball = pack();

    for (const language of languages) {
        const appDir = path.join(workspace, `app-${language}`);

        fs.mkdirSync(appDir, { recursive: true });

        console.log(`\n=== ${language} ===`);

        // The template's package.json depends on "bride-cli" from the registry,
        // so the tarball is installed before scaffolding and the app is never
        // asked to resolve bride-cli from npm again.
        run("npm", ["init", "-y"], appDir);
        run(
            "npm",
            [
                "install",
                path.relative(appDir, tarball),
                "--no-audit",
                "--no-fund",
            ],
            appDir,
        );

        if (browserCheck) {
            run(
                "npm",
                ["install", "--no-save", "--no-audit", "--no-fund", "playwright"],
                appDir,
            );
            run("npx", ["playwright", "install", "--with-deps", "chromium"], appDir);
        }

        run("npx", ["bride", "new", language], appDir);
        run("npx", ["bride", "build"], appDir);

        checkInstalledCli(appDir);

        console.log("\nChecking the build output...");
        const problems = await verifyDist(path.join(appDir, "dist"));

        if (problems.length > 0) {
            failed = true;
        }

        console.log("\nRunning the built app in Node.js...");
        runNodeScript("run-app.mjs", ["--dist", path.join(appDir, "dist")], appDir);

        if (browserCheck) {
            console.log("\nRunning the built app in Chromium...");
            runNodeScript("browser.mjs", ["--app", appDir], appDir);
        }
    }
} catch (error) {
    failed = true;
    console.error(`\nSmoke test failed: ${error.message}`);
}

if (!keep && !failed) {
    fs.rmSync(workspace, { recursive: true, force: true });
}

if (failed) {
    console.error(`\nSmoke test failed. Workspace kept at:\n  ${workspace}`);
    process.exitCode = 1;
} else {
    console.log(`\nSmoke test passed: ${languages.join(", ")}`);
}

function parseArguments(argv) {
    const parsed = {};

    for (let i = 0; i < argv.length; i++) {
        const argument = argv[i];

        if (argument.startsWith("--")) {
            const name = argument.slice(2);
            const next = argv[i + 1];

            if (next !== undefined && !next.startsWith("--")) {
                parsed[name] = next;
                i++;
            } else {
                parsed[name] = true;
            }
        } else if (parsed._ === undefined) {
            parsed._ = argument;
        }
    }

    return parsed;
}
