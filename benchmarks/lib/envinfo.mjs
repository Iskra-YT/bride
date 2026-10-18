// Environment metadata recorded next to every result file: comparisons across
// runs are only meaningful when the machine and toolchain are known.

import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { hasEmcc } from "../../bin/utils.js";

export const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
);

function firstLine(command, args) {
    try {
        const output = execFileSync(command, args, {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        });

        const line = output.split("\n")[0].trim();

        return line.length > 0 ? line : null;
    } catch {
        return null;
    }
}

function git(args) {
    try {
        const output = execFileSync("git", args, {
            cwd: repoRoot,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        });

        return output.trim() || null;
    } catch {
        return null;
    }
}

/** Compiler version strings; `null` when the tool is not installed. */
export function collectToolchain() {
    const cc = ["cc", "gcc", "clang"].find((candidate) =>
        firstLine(candidate, ["--version"]),
    );

    return {
        cc: cc ? firstLine(cc, ["--version"]) : null,
        emcc: hasEmcc() ? firstLine("emcc", ["--version"]) : null,
    };
}

export function collectEnvironment() {
    const cpu = os.cpus()[0];

    return {
        node: process.version,
        platform: `${os.platform()}/${os.arch()}`,
        os: `${os.type()} ${os.release()}`,
        cpu: cpu ? `${cpu.model} (${os.cpus().length} cores)` : "unknown",
        toolchain: collectToolchain(),
    };
}

// GitHub Actions provides SHA/ref directly; locally we ask git. `dirty` marks
// results that do not correspond to any commit.
export function collectGitInfo() {
    const commit = process.env.GITHUB_SHA ?? git(["rev-parse", "HEAD"]);
    const ref =
        process.env.GITHUB_REF ?? git(["rev-parse", "--abbrev-ref", "HEAD"]);
    const status = git(["status", "--porcelain"]);

    return {
        commit,
        ref,
        dirty: status ? status.length > 0 : null,
    };
}
