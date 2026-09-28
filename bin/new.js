import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function newProject(language = "c") {
    const template = path.join(__dirname, "..", "template", language);
    const target = process.cwd();

    fs.cpSync(template, target, {
        recursive: true,
    });

    console.log("Bride project created!");
}
