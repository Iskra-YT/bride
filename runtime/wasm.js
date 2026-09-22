export async function loadWasm(path, imports = {}) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Failed to load WebAssembly module at ${path}: ${response.statusText}`);
    }

    const instance = await WebAssembly.instantiateStreaming(
        response,
        {
            env: imports
        }
    );

    return instance;
}