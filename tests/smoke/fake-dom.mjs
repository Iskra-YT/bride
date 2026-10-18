// The minimal browser environment needed to boot a Bride build in Node.js:
// a fake DOM keyed by selector, window/history/location, a fetch() that reads
// from the dist folder and a WebAssembly.instantiateStreaming that works
// without a real HTTP response. Only the handful of browser APIs the runtime
// touches is shimmed. Shared by tests/smoke/run-app.mjs and the benchmark
// runner (benchmarks/lib/render.mjs).

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function installFakeDom(dist) {
    const distUrl =
        typeof dist === "string"
            ? pathToFileURL(dist.endsWith("/") || dist.endsWith("\\") ? dist : dist + "/")
            : dist;

    // Elements are kept in a map keyed by selector, which is all the
    // runtime's `querySelector` calls need (`#app`, `head`, ids written by
    // `change()` and `add_at()`).
    class FakeElement {
        constructor(selector) {
            this.selector = selector;
            this.innerHTML = "";
        }
    }

    const elements = new Map();

    function element(selector) {
        if (!elements.has(selector)) {
            elements.set(selector, new FakeElement(selector));
        }

        return elements.get(selector);
    }

    const location = {
        href: "http://localhost:9876/",
        origin: "http://localhost:9876",
        pathname: "/",
        search: "",
        hash: "",
    };

    const history = {
        pushState: (_state, _title, url) => {
            location.pathname = String(url);
        },
    };

    const documentListeners = new Map();

    globalThis.window = {
        location,
        history,
        addEventListener: () => {},
    };

    globalThis.document = {
        addEventListener: (type, handler) => documentListeners.set(type, handler),
        querySelector: (selector) => element(selector),
    };

    globalThis.history = history;

    globalThis.fetch = async (file) => {
        const bytes = await readFile(new URL(String(file), distUrl));

        return {
            ok: true,
            statusText: "OK",
            arrayBuffer: () =>
                bytes.buffer.slice(
                    bytes.byteOffset,
                    bytes.byteOffset + bytes.byteLength,
                ),
        };
    };

    // The runtime uses the streaming API; in Node we hand it the buffer
    // instead.
    globalThis.WebAssembly.instantiateStreaming = async (response, imports) =>
        WebAssembly.instantiate(await response.arrayBuffer(), imports);

    return { element, elements, location, history, documentListeners };
}
