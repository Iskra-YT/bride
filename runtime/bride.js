import { loadWasm, wasmString } from "./wasm.js";

let instance = null;
let memory = null;

// API
export const Bride = {
    async start(options) {
        const { wasm, root = "#app" } = options;

        if (window.Bride && window.Bride !== Bride) {
            throw new Error("Bride is already initialized.");
        }
        window.Bride = Bride;

        const element = document.querySelector(root);
        if (!element) {
            throw new Error(`Bride root not found: ${root}`);
        }

        instance = await loadWasm(wasm, {
            commit: (ptr, len) => {
                const html = wasmString(memory, ptr, len);
                document.querySelector(root).innerHTML = html;
            },
            commit_at: (query_ptr, query_len, html_ptr, html_len) => {
                const query = wasmString(memory, query_ptr, query_len);
                const html = wasmString(memory, html_ptr, html_len);

                const element = document.querySelector(query);
                if (element) {
                    element.innerHTML = html;
                }
            },
        });

        memory = instance.exports.memory;
        if (!memory) {
            throw new Error("Bride wasm module does not export memory.");
        }

        if (instance.exports._start) {
            try {
                instance.exports._start();
            } catch (err) {
                if (err?.message === "exit with exit code 0") {
                    // Normal
                } else {
                    throw err;
                }
            }
        }
    },

    dispatch(number) {
        if (!instance) {
            throw new Error("Bride is not initialized.");
        }

        return instance.exports.dispatch(number);
    },
};
