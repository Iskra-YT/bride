import test from "node:test";
import assert from "node:assert/strict";

import { matchRoute, normalizePath } from "../runtime/router.js";

test("normalizePath strips the query string and fragment", () => {
    assert.equal(normalizePath("/about?ref=1"), "/about");
    assert.equal(normalizePath("/about#top"), "/about");
    assert.equal(normalizePath("/about?ref=1#top"), "/about");
});

test("normalizePath guarantees a leading slash and drops trailing slashes", () => {
    assert.equal(normalizePath(""), "/");
    assert.equal(normalizePath("about"), "/about");
    assert.equal(normalizePath("/about/"), "/about");
    assert.equal(normalizePath("/about///"), "/about");
    assert.equal(normalizePath("/"), "/");
});

test("matchRoute returns the exact route", () => {
    const home = { path: "/", handler: 1 };
    const about = { path: "/about", handler: 2 };

    assert.equal(matchRoute([home, about], "/"), home);
    assert.equal(matchRoute([home, about], "/about"), about);
    assert.equal(matchRoute([home, about], "/missing"), undefined);
});

test("matchRoute normalizes slashes and ignores the query string", () => {
    const about = { path: "/about", handler: 2 };

    assert.equal(matchRoute([about], "/about/"), about);
    assert.equal(matchRoute([about], "/about?ref=1"), about);
});

test("matchRoute prefers exact matches over wildcards", () => {
    const fallback = { path: "*", handler: 1 };
    const about = { path: "/about", handler: 2 };

    assert.equal(matchRoute([fallback, about], "/about"), about);
    assert.equal(matchRoute([fallback, about], "/other"), fallback);
});

test("matchRoute supports prefix wildcards", () => {
    const users = { path: "/users/*", handler: 3 };
    const fallback = { path: "*", handler: 1 };

    assert.equal(matchRoute([users, fallback], "/users"), users);
    assert.equal(matchRoute([users, fallback], "/users/42"), users);
    assert.equal(matchRoute([users, fallback], "/users/42/posts"), users);
    assert.equal(matchRoute([users, fallback], "/posts"), fallback);
});
