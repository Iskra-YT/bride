import { loadWasm } from "./runtime/wasm";

// API
export const Bride = {
    async start(options) {
        const { wasm, root = "#app" } = options;

        const element = document.querySelector(root);
        if (!element) {
            throw new Error(`Bride root not found: ${root}`);
        }

        const instance = await loadWasm(wasm);

        if (instance.exports.start) {
            instance.exports.start();
        }

        return instance;
    }
}