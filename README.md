# Bride

Bride is the runtime bridge between WebAssembly and the Web. 

**Main idea**: Any language can be a web language.

## Supported Languages

| Language | Supported |
|----------|-----------|
| Rust     | No        |
| C        | Yes        |
| C++      | No        |

If you want to add language not listed above, please submit a pull request or create an issue.

## How to use

```js
import { Bride } from "bride";

await Bride.start({
    wasm: "./build/app.wasm",
    root: "#app"
});
```

WASM will be loaded and executed, and the HTML element with the id `app` will be used as the root for the application.

---

> Let's Compile the Web.