import { HtmlElement } from "./html/element";

@external("env", "commit")
export declare function __commit(x: string): void;

@external("env", "commit_at")
export declare function __commit_at(x: string): void;

export function commit(html: HtmlElement): void {
    __commit(html.repr());
}