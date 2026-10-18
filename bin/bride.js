#!/usr/bin/env node

import { createProject, listTemplates } from "./create.js";
import { buildProject } from "./build.js";
import { runDev } from "./server.js";

const command = process.argv[2];

function printUsage() {
    console.log(`
Bride CLI

Commands:
  bride create <name> [--lang <language>]
  bride build
  bride dev [--port <port>] [--host <host>]

Languages:
  ${listTemplates().join(", ")}
`);
}

// Parses `bride create` arguments. Accepts both `--lang c` and `--lang=c`.
function parseCreateOptions(args) {
    const options = { lang: "c" };
    let name;

    for (let i = 0; i < args.length; i++) {
        const argument = args[i];

        let optionName = argument;
        let value;

        const equals = argument.indexOf("=");

        if (equals !== -1) {
            optionName = argument.slice(0, equals);
            value = argument.slice(equals + 1);
        }

        if (optionName === "--lang") {
            if (value === undefined) {
                value = args[++i];
            }

            if (!value) {
                throw new Error("Missing value for --lang.");
            }

            options.lang = value;
        } else if (optionName.startsWith("--")) {
            throw new Error(
                `Unknown option: "${argument}". Supported options: --lang.`,
            );
        } else if (name === undefined) {
            name = argument;
        } else {
            throw new Error(
                `Unexpected argument: "${argument}". Usage: bride create <name> [--lang <language>]`,
            );
        }
    }

    options.name = name;
    return options;
}

try {
    if (command === "create") {
        const options = parseCreateOptions(process.argv.slice(3));
        createProject(options.name, options.lang);
    } else if (command === "new") {
        console.error(
            "The `new` command was replaced by `bride create <name> [--lang <language>]`.",
        );
        process.exitCode = 1;
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
