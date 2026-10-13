import test from "node:test";
import assert from "node:assert/strict";

import {
    getContentType,
    isSourceFile,
    parseDevOptions,
    getBrideFolder,
    getBrideRoot,
    DEFAULT_DEV_PORT,
    DEFAULT_DEV_HOST,
} from "../bin/utils.js";

test("getBrideFolder matches getBrideRoot so C++ include paths stay valid", () => {
    assert.equal(getBrideFolder(), getBrideRoot());
});

test("isSourceFile accepts every supported source extension", () => {
    for (const extension of [".c", ".h", ".cpp", ".hpp", ".c3"]) {
        assert.equal(isSourceFile(`main${extension}`), true);
    }
});

test("isSourceFile rejects unrelated files and empty names", () => {
    assert.equal(isSourceFile("main.js"), false);
    assert.equal(isSourceFile(".gitignore"), false);
    assert.equal(isSourceFile(""), false);
    assert.equal(isSourceFile(undefined), false);
});

test("getContentType maps the newly supported extensions", () => {
    assert.equal(getContentType(".wasm"), "application/wasm");
    assert.equal(getContentType(".woff2"), "font/woff2");
    assert.equal(getContentType(".woff"), "font/woff");
    assert.equal(getContentType(".ico"), "image/x-icon");
    assert.equal(getContentType(".map"), "application/json");
    assert.equal(getContentType(".webmanifest"), "application/manifest+json");
    assert.equal(getContentType(".txt"), "text/plain");
    assert.equal(getContentType(".mp4"), "video/mp4");
    assert.equal(getContentType(".webp"), "image/webp");
    assert.equal(getContentType(".avif"), "image/avif");
});

test("getContentType falls back to octet-stream", () => {
    assert.equal(getContentType(".unknown"), "application/octet-stream");
    assert.equal(getContentType(""), "application/octet-stream");
});

test("parseDevOptions returns the defaults", () => {
    assert.deepEqual(parseDevOptions([]), {
        port: DEFAULT_DEV_PORT,
        host: DEFAULT_DEV_HOST,
    });
});

test("parseDevOptions reads --port and --host separated by a space", () => {
    assert.deepEqual(parseDevOptions(["--port", "3000", "--host", "0.0.0.0"]), {
        port: 3000,
        host: "0.0.0.0",
    });
});

test("parseDevOptions reads --port=value and --host=value", () => {
    assert.deepEqual(parseDevOptions(["--port=8080", "--host=127.0.0.1"]), {
        port: 8080,
        host: "127.0.0.1",
    });
});

test("parseDevOptions rejects invalid ports", () => {
    assert.throws(() => parseDevOptions(["--port", "0"]), /Invalid port/);
    assert.throws(() => parseDevOptions(["--port", "70000"]), /Invalid port/);
    assert.throws(() => parseDevOptions(["--port", "abc"]), /Invalid port/);
    assert.throws(() => parseDevOptions(["--port", "3.5"]), /Invalid port/);
});

test("parseDevOptions rejects unknown options and missing values", () => {
    assert.throws(() => parseDevOptions(["--nope"]), /Unknown option/);
    assert.throws(() => parseDevOptions(["--host"]), /Missing value/);
    assert.throws(() => parseDevOptions(["--port"]), /Invalid port/);
});
