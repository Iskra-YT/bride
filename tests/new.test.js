import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { listTemplates, newProject } from "../bin/new.js";

// Scaffolds into a fresh temporary directory and restores the cwd afterwards.
function scaffold(t, language) {
    const previousCwd = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bride-new-"));

    t.after(() => {
        process.chdir(previousCwd);
        fs.rmSync(dir, { recursive: true, force: true });
    });

    process.chdir(dir);
    newProject(language);

    return dir;
}

const read = (dir, file) => fs.readFileSync(path.join(dir, file), "utf8");

test("listTemplates lists the scaffolded languages", () => {
    const templates = listTemplates();

    assert.ok(templates.includes("c"));
    assert.ok(templates.includes("cpp"));
    assert.ok(templates.includes("c3"));
    assert.ok(templates.includes("zig"));
});

test("listTemplates skips the shared template folder", () => {
    for (const template of listTemplates()) {
        assert.ok(
            !template.startsWith("_"),
            `"${template}" is a shared folder, not a language`,
        );
    }
});

test("newProject rejects an unknown language with a helpful message", () => {
    assert.throws(
        () => newProject("cobol"),
        (error) => {
            assert.match(error.message, /Unknown language "cobol"/);

            for (const language of listTemplates()) {
                assert.ok(
                    error.message.includes(language),
                    `message should list "${language}"`,
                );
            }

            return true;
        },
    );
});

test("newProject combines the shared files with the language ones", (t) => {
    const dir = scaffold(t, "zig");

    assert.ok(fs.existsSync(path.join(dir, "index.html")));
    assert.ok(fs.existsSync(path.join(dir, "main.js")));
    assert.ok(fs.existsSync(path.join(dir, "src", ".gitkeep")));
    assert.ok(fs.existsSync(path.join(dir, "src", "main.zig")));

    // The `gitignore` staging file is renamed, not left behind.
    assert.ok(!fs.existsSync(path.join(dir, "gitignore")));
    assert.equal(read(dir, ".gitignore"), "dist/\n.zig-cache/\nzig-out/\n");

    const packageJson = JSON.parse(read(dir, "package.json"));
    assert.equal(packageJson.language, "zig");
});

test("newProject only adds the shared ignore lines to the language ones", (t) => {
    const dir = scaffold(t, "c");

    assert.ok(fs.existsSync(path.join(dir, "src", "main.c")));
    assert.equal(read(dir, ".gitignore"), "dist/\n");
    assert.equal(JSON.parse(read(dir, "package.json")).language, "c");
});

test("newProject generates a package.json pinned to the running CLI", (t) => {
    const dir = scaffold(t, "c");

    const cli = JSON.parse(
        fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    );
    const packageJson = JSON.parse(read(dir, "package.json"));

    assert.equal(packageJson.name, "bride-app");
    assert.equal(packageJson.version, "0.1.0");
    assert.equal(packageJson.language, "c");
    assert.equal(packageJson.private, true);
    assert.equal(packageJson.dependencies["bride-cli"], `^${cli.version}`);
});

test("newProject keeps the ignore lines already in the target", (t) => {
    const dir = scaffold(t, "c");
    fs.writeFileSync(path.join(dir, ".gitignore"), "node_modules/\n");

    newProject("cpp");

    assert.equal(read(dir, ".gitignore"), "node_modules/\ndist/\n");
});
