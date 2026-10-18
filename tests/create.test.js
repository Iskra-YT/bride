import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { listTemplates, createProject } from "../bin/create.js";

// Scaffolds into a fresh temporary directory and restores the cwd afterwards.
// Returns the created project directory.
function scaffold(t, name, language) {
    const previousCwd = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bride-create-"));

    t.after(() => {
        process.chdir(previousCwd);
        fs.rmSync(dir, { recursive: true, force: true });
    });

    process.chdir(dir);
    createProject(name, language);

    return path.join(dir, name);
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

test("createProject rejects a missing project name", () => {
    assert.throws(
        () => createProject(undefined, "c"),
        /Missing project name/,
    );
});

test("createProject rejects an unknown language with a helpful message", () => {
    assert.throws(
        () => createProject("my-app", "cobol"),
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

test("createProject refuses a target directory that is not empty", (t) => {
    const previousCwd = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bride-create-"));

    t.after(() => {
        process.chdir(previousCwd);
        fs.rmSync(dir, { recursive: true, force: true });
    });

    fs.mkdirSync(path.join(dir, "my-app"));
    fs.writeFileSync(path.join(dir, "my-app", "notes.txt"), "keep me");

    process.chdir(dir);

    assert.throws(() => createProject("my-app", "c"), /not empty/);
    assert.equal(read(path.join(dir, "my-app"), "notes.txt"), "keep me");
});

test("createProject combines the shared files with the language ones", (t) => {
    const dir = scaffold(t, "my-app", "zig");

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

test("createProject only adds the shared ignore lines to the language ones", (t) => {
    const dir = scaffold(t, "my-app", "c");

    assert.ok(fs.existsSync(path.join(dir, "src", "main.c")));
    assert.equal(read(dir, ".gitignore"), "dist/\n");
    assert.equal(JSON.parse(read(dir, "package.json")).language, "c");
});

test("createProject generates a package.json pinned to the running CLI", (t) => {
    const dir = scaffold(t, "my-app", "c");

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

test("createProject defaults to C when no language is given", (t) => {
    const dir = scaffold(t, "my-app", undefined);

    assert.ok(fs.existsSync(path.join(dir, "src", "main.c")));
    assert.equal(JSON.parse(read(dir, "package.json")).language, "c");
});
