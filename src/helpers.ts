
export const applyFilterMap = (maps) => {
    if (maps == null) {
        return;
    }
    if (typeof maps === 'function') {
        maps = {
            '.': maps
        };
    }
    const regexMaps = Object.keys(maps).map(x => [new RegExp(x, 'i'), maps[x]]);
    if (regexMaps.length === 0) {
        return;
    }
    return (url) => (html, req) => {
        return regexMaps.reduce(
            (pre, [rx, func]) => {
                if (rx.test(url)) {
                    return func(pre, req);
                }
                return pre;
            },
            html);
    };
};
