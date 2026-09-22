# Bride

Bride is the runtime bridge between WebAssembly and the Web. 

## How to use

```js
import { Bride } from "bride";

await Bride.start({
    wasm: "./build/app.wasm",
    root: "#app"
});
```

WASM will be loaded and executed, and the HTML element with the id `app` will be used as the root for the application.