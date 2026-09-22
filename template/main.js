import { Bride } from "bride";

await Bride.start({
    wasm: "./build/app.wasm",
    root: "#app"
});