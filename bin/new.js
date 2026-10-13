import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const templateRoot = path.join(__dirname, "..", "template");

export function listTemplates() {
    return fs
        .readdirSync(templateRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
}

export function newProject(language = "c") {
    const available = listTemplates();

    if (!available.includes(language)) {
        throw new Error(
            `Unknown language "${language}". Available languages: ${available.join(", ")}.`,
        );
    }

    const template = path.join(templateRoot, language);
    const target = process.cwd();

    fs.cpSync(template, target, {
        recursive: true,
    });

    console.log("Bride project created!");
}
