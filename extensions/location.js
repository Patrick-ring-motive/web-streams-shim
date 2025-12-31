/**
 * Location Constructor Polyfill
 * 
 * Provides a Location class implementation for environments that lack it, such as:
 * - Cloudflare Workers
 * - Deno Deploy
 * - Vercel Edge Runtime
 * - Service Workers in some contexts
 * - Node.js and other server environments
 * 
 * The Location class extends URL and adds browser Location API compatibility:
 * - ancestorOrigins: Empty list (server environments have no origin hierarchy)
 * - assign(url): Updates the href (no navigation in server context)
 * - reload(forceReload): No-op with console log (no page to reload)
 * - replace(url): Updates the href (no navigation in server context)
 * 
 * This allows code written for browsers to run in serverless environments
 * without modification, though navigation methods are no-ops.
 * 
 * @note Methods like reload() don't actually navigate - use URL directly for parsing
 */
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
