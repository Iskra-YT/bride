#!/usr/bin/env node
/**
 * Boots a Bride build (a `dist/` folder) in Node.js and checks that the app
 * really works: it renders on start, reacts to a click handler, and routes
 * between pages.
 *
 * The real runtime (`dist/bride.js`) and the real WebAssembly module are used —
 * only the handful of browser APIs the runtime touches is shimmed. No browser
 * or extra dependency is needed.
 *
 *   node tests/smoke/run-app.mjs [--dist path/to/dist]
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

import { installFakeDom } from "./fake-dom.mjs";

const options = parseArguments(process.argv.slice(2));
const dist = path.resolve(options.dist ?? options._ ?? "dist");
const distUrl = pathToFileURL(dist.endsWith(path.sep) ? dist : dist + path.sep);

// The minimal DOM, window/history and fetch shims live in fake-dom.mjs (also
// used by the benchmark runner).
const { element, location, documentListeners } = installFakeDom(distUrl);

const { Bride } = await import(new URL("bride.js", distUrl).href);

const problems = [];

function check(condition, message, details = "") {
    console.log(`  ${condition ? "ok  " : "FAIL"} ${message}${details ? ` — ${details}` : ""}`);

    if (!condition) {
        problems.push(message);
    }
}

function anchorsIn(html) {
    return [...html.matchAll(/<a[^>]+href="([^"]+)"/g)].map((match) => match[1]);
}

function dispatchHandlerIn(html) {
    const match = html.match(/onClick="Bride\.dispatch\((\d+)\)"/);
    return match ? Number(match[1]) : null;
}

console.log(`Running the built app from ${dist}`);

try {
    await Bride.start({ wasm: "main.wasm", root: "#app" });

    const home = element("#app").innerHTML;
    check(home.length > 0, "the app renders on start", JSON.stringify(home.slice(0, 80)));
    check(/<h[\dl]/.test(home), "the first page contains a heading");

    const head = element("head").innerHTML;
    console.log(`  info <head> contains ${JSON.stringify(head)}`);

    // The templates build a reusable style, which injects its generated rule
    // into <head> and puts the matching class on the element.
    const injected = head.match(/<style>\.bride-style-\d+\{[^}]*\}<\/style>/);
    check(Boolean(injected), "the app injects its generated CSS into <head>", head);

    const className = injected ? injected[0].match(/\.(bride-style-\d+)/)[1] : null;
    check(
        className !== null && home.includes(`class="${className}"`),
        "the styled element carries its generated class",
        className ?? "no class found",
    );

    // Click handlers are wired to Bride.dispatch in the rendered HTML, so the
    // number found there is the handler the button calls.
    const handler = dispatchHandlerIn(home);

    if (handler === null) {
        console.log("  info no onClick=Bride.dispatch() handler rendered, skipping");
    } else {
        const before = element("#counter").innerHTML;
        Bride.dispatch(handler);
        const after = element("#counter").innerHTML;

        check(
            after !== before && after.length > 0,
            `a click handler runs and updates the page (dispatch(${handler}))`,
            `${JSON.stringify(before)} -> ${JSON.stringify(after)}`,
        );
    }

    // Clicking a link must navigate without a full page load.
    const click = documentListeners.get("click");
    const firstAnchor = anchorsIn(home)[0];
    const anchor = {
        href: firstAnchor,
        target: "_self",
        hasAttribute: () => false,
    };

    let prevented = false;

    click({
        defaultPrevented: false,
        button: 0,
        target: { closest: () => anchor },
        preventDefault: () => {
            prevented = true;
        },
    });

    check(prevented, "clicking a link is intercepted by the router");
    check(
        location.pathname === firstAnchor && element("#app").innerHTML !== home,
        `clicking "${firstAnchor}" navigates without a reload`,
        location.pathname,
    );

    // Walk every route the app links to: each one must render its own page.
    const visited = new Set();
    const queue = [...new Set(anchorsIn(home))];
    let previous = home;

    while (queue.length > 0 && visited.size < 10) {
        const href = queue.shift();

        if (visited.has(href)) {
            continue;
        }

        visited.add(href);

        Bride.navigate(href);

        const page = element("#app").innerHTML;

        check(
            page.length > 0 && page !== previous,
            `route "${href}" renders its own page`,
            JSON.stringify(page.slice(0, 80)),
        );
        check(
            location.pathname === href,
            `route "${href}" updates the URL`,
            location.pathname,
        );

        previous = page;

        for (const next of anchorsIn(page)) {
            if (!visited.has(next)) {
                queue.push(next);
            }
        }
    }
} catch (error) {
    problems.push(error.message);
    console.error(`  FAIL the app threw: ${error.stack ?? error}`);
}

if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s) while running the app.`);
    process.exitCode = 1;
} else {
    console.log("\nThe app runs without errors.");
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
