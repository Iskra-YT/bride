import { loadWasm } from "./runtime/wasm";

let instance = null;

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

        instance = await loadWasm(
            wasm,
            {
                commit: (html) => {
                    document.querySelector(root).innerHTML = html;
                },
                commit_at: (query, html) => {
                    const element = document.querySelector(query);
                    if (element) {
                        element.innerHTML = html;
                    }
                }
            }
        );

        if (instance.exports.main) {
            instance.exports.main();
        }
    },

    dispatch(number) {
        if (!instance) {
            throw new Error("Bride is not initialized.");
        }

        return instance.exports.dispatch(number);
    }
}