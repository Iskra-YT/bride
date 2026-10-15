import { loadWasm, wasmString } from "./wasm.js";
import { matchRoute } from "./router.js";

let instance = null;
let memory = null;

const routes = [];
let listening = false;

function render() {
    if (!instance || typeof instance.exports.dispatch !== "function") {
        return;
    }

    const route = matchRoute(routes, window.location.pathname);

    if (!route) {
        return;
    }

    instance.exports.dispatch(route.handler);
}

function navigate(path) {
    const target = typeof path === "string" && path.length > 0 ? path : "/";
    const current =
        window.location.pathname +
        window.location.search +
        window.location.hash;

    if (current === target) {
        return;
    }

    window.history.pushState({}, "", target);
    render();
}

function onDocumentClick(event) {
    if (event.defaultPrevented || event.button !== 0) {
        return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
    }

    const anchor = event.target?.closest?.("a[href]");

    if (!anchor) {
        return;
    }

    if (anchor.target && anchor.target !== "_self") {
        return;
    }

    if (anchor.hasAttribute("download")) {
        return;
    }

    const url = new URL(anchor.href, window.location.href);

    if (url.origin !== window.location.origin) {
        return;
    }

    if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
    ) {
        return;
    }

    event.preventDefault();
    navigate(url.pathname + url.search + url.hash);
}

function initRouter() {
    if (routes.length === 0) {
        return;
    }

    if (!listening) {
        window.addEventListener("popstate", render);
        document.addEventListener("click", onDocumentClick);
        listening = true;
    }

    render();
}

// API
export const Bride = {
    async start(options) {
        const { wasm, root = "#app", onError } = options;

        const handleError = typeof onError === "function"
            ? onError
            : (err) => {
                console.error(err);
            };

        if (window.Bride && window.Bride !== Bride) {
            handleError(new Error("Bride is already initialized."));
            return;
        }
        window.Bride = Bride;

        const element = document.querySelector(root);
        if (!element) {
            handleError(new Error(`Bride root not found: ${root}`));
            return;
        }

        const appRoot = element;

        let loadedInstance;
        try {
            loadedInstance = await loadWasm(wasm, {
                commit: (ptr, len) => {
                    const html = wasmString(memory, ptr, len);
                    appRoot.innerHTML = html;
                },
                commit_at: (query_ptr, query_len, html_ptr, html_len) => {
                    const query = wasmString(memory, query_ptr, query_len);
                    const html = wasmString(memory, html_ptr, html_len);

                    const el = document.querySelector(query);
                    if (el) {
                        el.innerHTML = html;
                    }
                },
                add_at: (query_ptr, query_len, html_ptr, html_len) => {
                    const query = wasmString(memory, query_ptr, query_len);
                    const html = wasmString(memory, html_ptr, html_len);

                    const el = document.querySelector(query);
                    if (el) {
                        el.innerHTML += html;
                    }
                },
                route: (path_ptr, path_len, handler) => {
                    const path = wasmString(memory, path_ptr, path_len);

                    routes.push({ path, handler });
                },
                navigate: (path_ptr, path_len) => {
                    const path = wasmString(memory, path_ptr, path_len);

                    navigate(path);
                },
            });
        } catch (err) {
            handleError(err instanceof Error ? err : new Error(String(err)));
            return;
        }

        instance = loadedInstance;
        memory = instance.exports.memory;
        if (!memory) {
            handleError(new Error("Bride wasm module does not export memory."));
            return;
        }

        if (instance.exports._start) {
            try {
                instance.exports._start();
            } catch (err) {
                if (err?.message === "exit with exit code 0") {
                    // Normal exit
                } else {
                    handleError(err instanceof Error ? err : new Error(String(err)));
                }
            }
        }

        initRouter();
    },

    dispatch(number) {
        if (!instance) {
            throw new Error("Bride is not initialized.");
        }

        return instance.exports.dispatch(number);
    },

    navigate(path) {
        navigate(path);
    },

    render() {
        render();
    },
};
