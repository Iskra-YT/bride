#!/usr/bin/env node

import { newProject } from "./new.js";
import { buildProject } from "./build.js";
import path from "node:path";
import { createServer } from "node:http";
import { readFile, watch } from "node:fs/promises";
import { WebSocketServer } from "ws";

const command = process.argv[2];

if (command === "new") {
    newProject();
} else if (command === "build") {
    await buildProject();
} else if (command === "dev") {
    console.log("Starting Bride development server...");

    await buildProject();

    const cwd = process.cwd();
    const dist = path.join(cwd, "dist");

    const server = createServer(async (req, res) => {
        let filePath = path.join(
            dist,
            decodeURIComponent(
                new URL(req.url, `http://${req.headers.host}`).pathname,
            ),
        );

        if (req.url === "/") {
            filePath = path.join(dist, "index.html");
        }

        try {
            let data;

            const ext = path.extname(filePath);

            if (ext === ".html") {
                data = await readFile(filePath, "utf8");

                data = data.replace(
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
            } else {
                data = await readFile(filePath);
            }

            const contentTypes = {
                ".html": "text/html",
                ".js": "text/javascript",
                ".wasm": "application/wasm",
                ".css": "text/css",
                ".json": "application/json",
                ".svg": "image/svg+xml",
                ".png": "image/png",
            };

            res.writeHead(200, {
                "Content-Type": contentTypes[ext] || "application/octet-stream",
            });

            res.end(data);
        } catch (error) {
            console.error(error);

            res.writeHead(404);
            res.end("Not Found");
        }
    });

    const wss = new WebSocketServer({ server });

    wss.on("connection", () => {
        console.log("Browser connected.");
    });

    server.listen(9876, () => {
        console.log("Bride dev server running at http://localhost:9876");
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
            if (!filename) {
                continue;
            }

            if (filename.endsWith(".c") || filename.endsWith(".h")) {
                console.log(`Changed: ${filename}`);
                rebuild();
            }
        }
    };

    watchDirectory(path.join(cwd, "src"));
} else {
    console.log(`
Bride CLI

Commands:
  bride new
  bride build
  bride dev
`);
}
