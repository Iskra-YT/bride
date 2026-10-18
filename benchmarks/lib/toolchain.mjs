// Shared toolchain helpers for the benchmark suites.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// `dispatch.c` includes <emscripten/emscripten.h>; a native build only needs
// EMSCRIPTEN_KEEPALIVE to expand to nothing (same trick as
// tests/native/style.test.js).
const EMSCRIPTEN_SHIM = `#ifndef BRIDE_TEST_EMSCRIPTEN_H
#define BRIDE_TEST_EMSCRIPTEN_H
#define EMSCRIPTEN_KEEPALIVE
#endif
`;

function hasCommand(command, args) {
    try {
        execFileSync(command, args, { stdio: "ignore" });

        return true;
    } catch {
        return false;
    }
}

/** First installed C compiler from the candidate list, or null. */
export function findCompiler(candidates = ["cc", "gcc", "clang"]) {
    return candidates.find((candidate) => hasCommand(candidate, ["--version"])) ?? null;
}

/**
 * Writes a directory with a stub <emscripten/emscripten.h> so the whole C
 * library compiles natively, and returns its path.
 */
export function writeEmscriptenShim(directory) {
    mkdirSync(path.join(directory, "emscripten"), { recursive: true });
    writeFileSync(path.join(directory, "emscripten", "emscripten.h"), EMSCRIPTEN_SHIM);

    return directory;
}
