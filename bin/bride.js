#!/usr/bin/env node

import { newProject } from "./new.js";
import { buildProject } from "./build.js";

const command = process.argv[2];

if (command === "new") {
    newProject();
} else if (command === "build") {
    await buildProject();
} else if (command === "dev") {
    console.log("Starting Bride development server...");

    // TODO: Build and run on dev port 9876
} else {
    console.log(`
Bride CLI

Commands:
  bride new
  bride build
  bride dev
`);
}
