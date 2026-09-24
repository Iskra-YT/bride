import { execFileSync } from "node:child_process";

export function hasEmcc() {
    try {
        execFileSync("emcc", ["--version"], { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}
