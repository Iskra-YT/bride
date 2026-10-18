// Repeated-render benchmark: boots a built Bride app (a `dist/` folder) in
// Node.js on the same fake DOM the smoke test uses and measures the wasm → C
// → serialize → JS → DOM path end to end:
//
//   * render-full-page — Bride.render() re-runs the matched route handler,
//     rebuilding the whole page tree and committing it to `#app`;
//   * render-click-update — Bride.dispatch() runs the template app's click
//     handler, which rebuilds only the changed subtree (`change()`).
//
// Correctness checks run outside the timed region: the full-page render must
// produce byte-identical HTML every time, and the click updates must show the
// expected counter value, so a silently broken render can never be measured.

import { pathToFileURL } from "node:url";

export async function benchmarkRender({ dist, iterations, warmup }) {
    const distUrl = pathToFileURL(dist.endsWith("/") || dist.endsWith("\\") ? dist : dist + "/");
    const { installFakeDom } = await import("../../tests/smoke/fake-dom.mjs");
    const { element } = installFakeDom(distUrl);

    const { Bride } = await import(new URL("bride.js", distUrl).href);

    await Bride.start({ wasm: "main.wasm", root: "#app" });

    const home = element("#app").innerHTML;

    if (!home) {
        throw new Error("the app rendered nothing on start");
    }

    const handlerMatch = home.match(/onClick="Bride\.dispatch\((\d+)\)"/);
    const handler = handlerMatch ? Number(handlerMatch[1]) : null;

    // --- full page renders --------------------------------------------------

    // Every ui() render registers fresh dispatch keys, so the handler number
    // in onClick="Bride.dispatch(N)" legitimately changes between renders;
    // everything else must stay byte-identical.
    const normalize = (html) => html.replace(/Bride\.dispatch\(\d+\)/g, "Bride.dispatch(#)");

    Bride.render();
    const firstRender = element("#app").innerHTML;
    const reference = normalize(firstRender);

    for (let i = 0; i < warmup; i++) {
        Bride.render();
    }

    const fullPageSamples = [];

    for (let i = 0; i < iterations; i++) {
        const started = performance.now();

        Bride.render();

        fullPageSamples.push(performance.now() - started);

        if (normalize(element("#app").innerHTML) !== reference) {
            throw new Error(`full-page render #${i} diverged from the first render`);
        }
    }

    // --- click updates ------------------------------------------------------

    const clickSamples = [];

    if (handler === null) {
        console.log("  info no onClick=Bride.dispatch() handler rendered, skipping the click-update case");
    } else {
        let expected = 0;

        const dispatchOnce = () => {
            expected++;

            const started = performance.now();

            Bride.dispatch(handler);

            clickSamples.push(performance.now() - started);

            const counter = element("#counter").innerHTML;
            const match = counter.match(/Clicks: (\d+)/);

            if (!match || Number(match[1]) !== expected) {
                throw new Error(
                    `click update #${expected} rendered ${JSON.stringify(counter)}`,
                );
            }
        };

        for (let i = 0; i < warmup; i++) {
            dispatchOnce();
        }

        // The app's counter keeps the warmup state; only the samples are
        // dropped, the expected values keep counting.
        clickSamples.length = 0;

        for (let i = 0; i < iterations; i++) {
            dispatchOnce();
        }
    }

    return {
        htmlBytes: firstRender.length,
        fullPageSamples,
        clickSamples,
        clickHandler: handler,
    };
}
