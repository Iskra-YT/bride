import { WASI } from "./wasi/index.js";

export async function loadWasm(path, imports = {}) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Failed to load WebAssembly module at ${path}: ${response.statusText}`);
    }

    const wasi = new WASI([], [], []);

    const instance = await WebAssembly.instantiateStreaming(
        response,
        {
            env: imports,
            wasi_snapshot_preview1: wasi.wasiImport
        }
    );

    // Gives the shim a handle on the instance so calls that need the
    // instance's memory (args_get, environ_get, fd_write, ...) work.
    wasi.initialize(instance.instance);

    return instance.instance;
}

// A single shared decoder. `TextDecoder.decode` is stateless when called
// without the `stream` argument, so one instance is safe to reuse for every
// string read out of wasm memory.
const decoder = new TextDecoder("utf-8");

export function wasmString(memory, ptr, len) {
    const bytes = new Uint8Array(memory.buffer, ptr, len);
    return decoder.decode(bytes);
}