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

// Route paths are static once registered, so their normalized form is
// computed once and reused on every render instead of re-running the
// split/replace pipeline for each route on each navigation.
const normalizedRoutes = new Map();

function normalizeRoutePath(path) {
    let normalized = normalizedRoutes.get(path);

    if (normalized === undefined) {
        normalized = normalizePath(path);
        normalizedRoutes.set(path, normalized);
    }

    return normalized;
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

        if (normalizeRoutePath(route.path) === target) {
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
            const prefix = normalizeRoutePath(route.path.slice(0, -1));

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
