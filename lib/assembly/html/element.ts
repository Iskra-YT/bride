export class HtmlElement {
    tag: string;
    attributes: Map<string, string>;

    children: HtmlElement[];

    constructor(tag: string, attributes: Map<string, string>,  children: HtmlElement[]) {
        this.tag = tag;
        this.attributes = attributes;
        this.children = children;
    }

    public attr(name: string, value: string): void {
        this.attributes.set(name, value);
    }

    public append(child: HtmlElement): void {
        this.children.push(child);
    }

    public repr(): string {
        let value = "";
        if (this.tag == "text") {
            value += this.attributes.get("value");
            return value;
        } else if (this.tag == "p") {
            value += "<p>";
            this.children.forEach(element => {
                value += element.repr();
            });
            value += "</p>";
            return value;
        }

        return value;
    }
}