#!/usr/bin/env node

import { newProject, listTemplates } from "./new.js";
import { buildProject } from "./build.js";
import { getContentType, isSourceFile, parseDevOptions } from "./utils.js";
import path from "node:path";
import { createServer } from "node:http";
import { readFile, watch } from "node:fs/promises";
import { WebSocketServer } from "ws";

const command = process.argv[2];

async function runDev(args) {
    const options = parseDevOptions(args);

    console.log("Starting Bride development server...");

    await buildProject();

    const cwd = process.cwd();
    const dist = path.join(cwd, "dist");

    const injectLiveReload = (html) =>
        html.replace(
            "</body>",
            `
<script>
    const socket = new WebSocket("ws://" + location.host);

    socket.addEventListener("message", event => {
        if (event.data === "reload") {
            location.reload();
        }
    });
</script>
</body>
`,
        );

    const server = createServer(async (req, res) => {
        const pathname = decodeURIComponent(
            new URL(req.url, `http://${req.headers.host}`).pathname,
        );

        let filePath = path.join(dist, pathname);

        if (pathname === "/") {
            filePath = path.join(dist, "index.html");
        }

        try {
            let data;

            const ext = path.extname(filePath);

            if (ext === ".html") {
                data = injectLiveReload(await readFile(filePath, "utf8"));
            } else {
                data = await readFile(filePath);
            }

            res.writeHead(200, {
                "Content-Type": getContentType(ext),
            });

            res.end(data);
        } catch (error) {
            // Client-side routing: paths without a file extension fall back to
            // index.html so deep links (for example /about) can render.
            if (!path.extname(filePath)) {
                try {
                    const data = injectLiveReload(
                        await readFile(path.join(dist, "index.html"), "utf8"),
                    );

                    res.writeHead(200, { "Content-Type": "text/html" });
                    res.end(data);
                    return;
                } catch {
                    // Fall through to a 404.
                }
            }

            console.error(error);

            res.writeHead(404);
            res.end("Not Found");
        }
    });

    const wss = new WebSocketServer({ server });

    wss.on("connection", () => {
        console.log("Browser connected.");
    });

    server.on("error", (error) => {
        console.error(error.message);
        process.exit(1);
    });

    server.listen(options.port, options.host, () => {
        console.log(
            `Bride dev server running at http://${options.host}:${options.port}`,
        );
        console.log("Watching for changes...");
    });

    let building = false;
    let rebuildQueued = false;

    const rebuild = async () => {
        if (building) {
            rebuildQueued = true;
            return;
        }

        building = true;

        try {
            console.log("Changes detected. Rebuilding...");

            await buildProject();

            console.log("Build complete.");

            for (const client of wss.clients) {
                if (client.readyState === 1) {
                    client.send("reload");
                }
            }
        } catch (error) {
            console.error("Build failed:");
            console.error(error);
        } finally {
            building = false;

            if (rebuildQueued) {
                rebuildQueued = false;
                await rebuild();
            }
        }
    };

    const watchDirectory = async (directory) => {
        const watcher = watch(directory, {
            recursive: true,
        });

        for await (const { filename } of watcher) {
            if (isSourceFile(filename)) {
                console.log(`Changed: ${filename}`);
                rebuild();
            }
        }
    };

    watchDirectory(path.join(cwd, "src"));
}

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
