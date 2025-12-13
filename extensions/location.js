(() => {
    const Q = fn => {
        try {
            return fn?.()
        } catch {}
    };
    const $global = Q(() => globalThis) ?? Q(() => global) ?? Q(() => self) ?? Q(() => window) ?? this;

    if (typeof Location === 'undefined') {
        // Sham Location class extending URL
        $global.Location = class Location extends URL {
            constructor(href, base) {
                super(href, base);
            }

            // Location properties that delegate to URL
            get ancestorOrigins() {
                return {
                    length: 0
                };
            }

            // Location methods
            assign(url) {
                this.href = url;
            }

            reload(forceReload = false) {
                // Sham implementation - does nothing
                console.log(`reload(${forceReload}) called`);
            }

            replace(url) {
                this.href = url;
            }

            toString() {
                return this.href;
            }
        }
    }
})();
