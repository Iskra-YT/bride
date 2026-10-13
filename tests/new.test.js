import test from "node:test";
import assert from "node:assert/strict";

import { listTemplates, newProject } from "../bin/new.js";

test("listTemplates lists the scaffolded languages", () => {
    const templates = listTemplates();

    assert.ok(templates.includes("c"));
    assert.ok(templates.includes("cpp"));
    assert.ok(templates.includes("c3"));
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
