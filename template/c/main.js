import { Bride } from "./bride.js";

await Bride.start({
    wasm: "./main.wasm",
    root: "#app"
});