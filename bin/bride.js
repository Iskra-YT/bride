#!/usr/bin/env node

import { newProject, listTemplates } from "./new.js";
import { buildProject } from "./build.js";
import { runDev } from "./server.js";

const command = process.argv[2];

function printUsage() {
    console.log(`
Bride CLI

Commands:
  bride new <language>
  bride build
  bride dev [--port <port>] [--host <host>]

Languages:
  ${listTemplates().join(", ")}
`);
}

try {
    if (command === "new") {
        newProject(process.argv[3]);
    } else if (command === "build") {
        await buildProject();
    } else if (command === "dev") {
        await runDev(process.argv.slice(3));
    } else {
        printUsage();
    }
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
