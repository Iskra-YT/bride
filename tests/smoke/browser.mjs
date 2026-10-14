#!/usr/bin/env node
/**
 * Loads a built Bride app in a real browser (Chromium through Playwright) and
 * checks that it renders, routes and reacts to clicks without any console or
 * page error. This is the only check that exercises the browser side of the
 * runtime: ES module loading, streaming WASM compilation and the DOM.
 *
 * Playwright has to be installed next to the project under test, which
 * `tests/smoke/smoke.mjs --browser` takes care of:
 *
 *   node tests/smoke/browser.mjs --app <project dir> [--dist dist]
 */
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { getContentType } from "../../bin/utils.js";

const options = parseArguments(process.argv.slice(2));
const appDir = path.resolve(options.app ?? ".");
const dist = path.resolve(appDir, options.dist ?? "dist");

const problems = [];

function check(condition, message, details = "") {
    console.log(`  ${condition ? "ok  " : "FAIL"} ${message}${details ? ` — ${details}` : ""}`);

    if (!condition) {
        problems.push(message);
    }
}

const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
    );

    const file = path.join(
        dist,
        pathname === "/" ? "index.html" : pathname,
    );

    try {
        const data = await readFile(file);

        response.writeHead(200, {
            "Content-Type": getContentType(path.extname(file)),
        });
        response.end(data);
    } catch {
        response.writeHead(404);
        response.end("Not Found");
    }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}/`;

// Playwright is resolved from the project under test, not from this repository,
// so `smoke.mjs` can install it into the throw-away app on demand.
const require = createRequire(pathToFileURL(path.join(appDir, "package.json")));
const { chromium } = require("playwright");

const browser = await chromium.launch();
const pageErrors = [];

try {
    const page = await browser.newPage();

    page.on("console", (message) => {
        if (message.type() === "error") {
            pageErrors.push(`console.error: ${message.text()}`);
        }
    });
    page.on("pageerror", (error) => pageErrors.push(`pageerror: ${error.message}`));

    console.log(`Loading ${baseUrl} in Chromium`);

    await page.goto(baseUrl);
    await page.waitForSelector("#app > *");

    const home = await page.innerHTML("#app");
    check(home.trim().length > 0, "the app renders in the browser", JSON.stringify(home.slice(0, 80)));

    const button = await page.$("#app button");

    if (button) {
        await button.click();
        await page.waitForFunction(
            (previous) => document.querySelector("#app").innerHTML !== previous,
            home,
        );

        check(true, "clicking a button updates the page");
    }

    const link = await page.$("#app a[href]");

    if (link) {
        const pathBefore = await page.evaluate(() => window.location.pathname);
        const htmlBefore = await page.innerHTML("#app");

        await link.click();
        await page.waitForFunction(
            (previous) => window.location.pathname !== previous,
            pathBefore,
        );

        const pathAfter = await page.evaluate(() => window.location.pathname);
        const htmlAfter = await page.innerHTML("#app");

        check(
            pathAfter !== pathBefore && htmlAfter !== htmlBefore,
            `clicking a link routes to "${pathAfter}" without a reload`,
        );
    }

    check(
        pageErrors.length === 0,
        "no console or page errors",
        pageErrors.join("; "),
    );
} catch (error) {
    problems.push(error.message);
    console.error(`  FAIL the browser run threw: ${error.stack ?? error}`);
} finally {
    await browser.close();
    server.close();
}

if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s) in the browser run.`);
    process.exitCode = 1;
} else {
    console.log("\nThe app runs in Chromium without errors.");
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
