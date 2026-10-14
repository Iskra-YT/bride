export function normalizePath(path) {
    if (typeof path !== "string" || path.length === 0) {
        return "/";
    }

    let clean = path.split("?")[0].split("#")[0];

    if (!clean.startsWith("/")) {
        clean = `/${clean}`;
    }

    if (clean.length > 1) {
        clean = clean.replace(/\/+$/, "");
    }

    return clean || "/";
}

export function matchRoute(routes, pathname) {
    const target = normalizePath(pathname);

    for (const route of routes) {
        if (typeof route.path !== "string") {
            continue;
        }

        if (route.path === "*" || route.path.endsWith("*")) {
            continue;
        }

        if (normalizePath(route.path) === target) {
            return route;
        }
    }

    for (const route of routes) {
        if (typeof route.path !== "string") {
            continue;
        }

        if (route.path === "*") {
            return route;
        }

        if (route.path.endsWith("*")) {
            const prefix = normalizePath(route.path.slice(0, -1));

            if (
                prefix === "/" ||
                target === prefix ||
                target.startsWith(`${prefix}/`)
            ) {
                return route;
            }
        }
    }

    return undefined;
}
