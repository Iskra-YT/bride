#!/usr/bin/env node
/**
 * Checks that a `bride build` produced the output documented in
 * docs/cli.md: the runtime, the WASI shim, the licenses, the page assets and a
 * valid WebAssembly module that exports what the runtime needs.
 *
 * Pure checks, no toolchain required:
 *   node tests/smoke/verify-dist.mjs --dist path/to/dist
 */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

// Every file a served Bride app needs. `router.js` is not listed in the CLI
// docs but is imported by `bride.js`, so it has to be there too.
const REQUIRED_FILES = [
    "main.wasm",
    "bride.js",
    "wasm.js",
    "router.js",
    "index.html",
    "main.js",
    "wasi/index.js",
    "license/BRIDE-LICENSE",
    "license/WASI-MIT",
    "license/WASI-APACHE",
    "THIRD-PARTY-LICENSES",
];

// Exports the runtime relies on (see runtime/bride.js and runtime/wasm.js).
const REQUIRED_EXPORTS = ["memory", "dispatch", "_start"];

const WASM_MAGIC = [0x00, 0x61, 0x73, 0x6d];

function readUnsignedLEB(bytes, state) {
    let result = 0;
    let shift = 0;
    let byte;

    do {
        if (state.offset >= bytes.length) {
            throw new Error("Unexpected end of WebAssembly module.");
        }

        byte = bytes[state.offset++];
        result |= (byte & 0x7f) << shift;
        shift += 7;
    } while (byte & 0x80);

    return result >>> 0;
}

/**
 * Walks the sections of a WebAssembly module and returns its export names.
 * Enough of the binary format to check the module shape without a dependency.
 */
export function readWasmExports(bytes) {
    const exports = [];

    for (const [index, byte] of WASM_MAGIC.entries()) {
        if (bytes[index] !== byte) {
            throw new Error("Not a WebAssembly module (bad magic bytes).");
        }
    }

    const version = new DataView(
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength,
    ).getUint32(4, true);

    if (version !== 1) {
        throw new Error(`Unsupported WebAssembly version: ${version}.`);
    }

    const state = { offset: 8 };

    while (state.offset < bytes.length) {
        const sectionId = bytes[state.offset++];
        const sectionSize = readUnsignedLEB(bytes, state);
        const sectionEnd = state.offset + sectionSize;

        if (sectionEnd > bytes.length) {
            throw new Error("Truncated WebAssembly module.");
        }

        if (sectionId === 7) {
            // Export section: a vector of {name, kind, index}.
            const count = readUnsignedLEB(bytes, state);

            for (let i = 0; i < count; i++) {
                const nameLength = readUnsignedLEB(bytes, state);
                const name = Buffer.from(
                    bytes.subarray(state.offset, state.offset + nameLength),
                ).toString("utf8");
                state.offset += nameLength;
                state.offset += 1; // kind
                readUnsignedLEB(bytes, state); // index

                exports.push(name);
            }
        }

        state.offset = sectionEnd;
    }

    return exports;
}

export async function verifyDist(dist) {
    const problems = [];

    const check = (condition, message) => {
        if (condition) {
            console.log(`  ok   ${message}`);
        } else {
            console.log(`  FAIL ${message}`);
            problems.push(message);
        }
    };

    for (const file of REQUIRED_FILES) {
        const target = path.join(dist, file);
        let size = 0;

        try {
            size = (await stat(target)).size;
        } catch {
            // Reported below.
        }

        check(size > 0, `${file} exists and is not empty (${size} bytes)`);
    }

    // `bride build` removes the intermediate library directory.
    let libDirectoryExists = true;
    try {
        await stat(path.join(dist, "lib"));
    } catch {
        libDirectoryExists = false;
    }
    check(
        !libDirectoryExists,
        "dist/lib/ was cleaned up (intermediate objects are not shipped)",
    );

    let exports = [];
    let wasmError = null;

    try {
        exports = readWasmExports(await readFile(path.join(dist, "main.wasm")));
    } catch (error) {
        wasmError = error;
    }

    check(
        !wasmError,
        wasmError
            ? `main.wasm is a valid WebAssembly module (${wasmError.message})`
            : "main.wasm is a valid WebAssembly module",
    );

    for (const name of REQUIRED_EXPORTS) {
        check(
            exports.includes(name),
            `main.wasm exports "${name}" (found: ${exports.slice(0, 8).join(", ") || "none"}${exports.length > 8 ? ", …" : ""})`,
        );
    }

    return problems;
}

// Runnable directly: `node tests/smoke/verify-dist.mjs [dist]`
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
    const problems = await verifyDist(
        path.resolve(process.argv[2] ?? "dist"),
    );

    if (problems.length > 0) {
        console.error(`\n${problems.length} problem(s) with the build output.`);
        process.exitCode = 1;
    }
}
