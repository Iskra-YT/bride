import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const templateRoot = path.join(__dirname, "..", "template");

// Shared files every project starts from. Folders starting with "_" hold common
// files, not scaffoldable languages.
const sharedFolder = "_common";

export function listTemplates() {
    return fs
        .readdirSync(templateRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
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

    const sharedDir = path.join(templateRoot, sharedFolder);
    const languageDir = path.join(templateRoot, language);
    const target = process.cwd();

    // Shared files first, then the language folder on top of it.
    fs.cpSync(sharedDir, target, { recursive: true });
    fs.cpSync(languageDir, target, { recursive: true });

    writeGitignore(sharedDir, languageDir, target);
    writePackageJson(language, target);

    console.log("Bride project created!");
}

function readLines(file) {
    return fs.existsSync(file)
        ? fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean)
        : [];
}

// npm never publishes a `.gitignore`, so templates store a plain `gitignore`
// (shared lines in `_common`, extra lines in the language folder) and it becomes
// the real `.gitignore` here. Lines already in the target are kept.
function writeGitignore(sharedDir, languageDir, target) {
    const lines = [
        ...new Set([
            ...readLines(path.join(target, ".gitignore")),
            ...readLines(path.join(sharedDir, "gitignore")),
            ...readLines(path.join(languageDir, "gitignore")),
        ]),
    ];

    fs.rmSync(path.join(target, "gitignore"), { force: true });

    if (lines.length > 0) {
        fs.writeFileSync(
            path.join(target, ".gitignore"),
            `${lines.join("\n")}\n`,
        );
    }
}

// The shared package.json is generated: the scaffolder knows the language, and
// the dependency range must match the bride-cli that is running. A language
// folder may ship its own package.json — then only `language` is filled in.
function writePackageJson(language, target) {
    const file = path.join(target, "package.json");

    if (fs.existsSync(file)) {
        const packageJson = JSON.parse(fs.readFileSync(file, "utf8"));
        packageJson.language = language;
        fs.writeFileSync(file, `${JSON.stringify(packageJson, null, 2)}\n`);
        return;
    }

    fs.writeFileSync(
        file,
        `${JSON.stringify(
            {
                name: "bride-app",
                version: "0.1.0",
                language,
                private: true,
                dependencies: {
                    "bride-cli": `^${cliVersion()}`,
                },
            },
            null,
            2,
        )}\n`,
    );
}

// `bin/new.js` runs from the installed bride-cli (or from this repository), so
// its own package.json is the version a new project should depend on.
function cliVersion() {
    const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
    );

    return packageJson.version;
}
