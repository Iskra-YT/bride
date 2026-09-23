#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const command = process.argv[2];

if (command === "new") {
    const template = path.join(__dirname, "..", "template");
    const target = process.cwd();

    fs.cpSync(template, target, {
        recursive: true
    });

    console.log("Bride project created!");
}

else if (command === "build") {
    console.log("Building Bride project...");

    // TODO: Implement build logic here
}

else if (command === "dev") {
    console.log("Starting Bride development server...");

    // TODO: Build and run on dev port 9876
}

else {
    console.log(`
Bride CLI

Commands:
  bride new
  bride build
`);
}