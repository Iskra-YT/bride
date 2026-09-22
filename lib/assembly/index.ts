import { HtmlElement } from "./html/element";

export function paragraph(inner: HtmlElement): HtmlElement {
  return new HtmlElement(
    "p",
    new Map<string, string>(),
    [inner]
  )
}

export function text(value: string): HtmlElement {
  const map = new Map<string, string>();
  map.set("value", value);
  return new HtmlElement(
    "text",
    map,
    []
  )
}