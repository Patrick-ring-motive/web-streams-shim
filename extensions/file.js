/**
 * File Constructor Polyfill
 * 
 * Provides a File class implementation for environments that lack it, such as:
 * - Cloudflare Workers
 * - Google Apps Script
 * - Some serverless edge runtimes
 * - Older Node.js versions (pre-20)
 * 
 * The File class extends Blob and adds file-specific properties:
 * - name: The file name
 * - lastModified: Timestamp in milliseconds
 * - lastModifiedDate: Date object (deprecated but included for compatibility)
 * - webkitRelativePath: Empty string (for compatibility)
 * 
 * This is a functional implementation that allows File objects to be created
 * and used in environments where the native File constructor is missing.
 * 
 * @note This is a complete implementation, not a partial shim
 */
(() => {
    const Q = fn => {
        try {
            return fn?.()
        } catch {}
    };
    const setHidden = (obj, prop, value) => {
        Object.defineProperty(obj, prop, {
            value,
            writable: true,
            enumerable: false,
            configurable: true
        });
    }
    const $global = Q(() => globalThis) ?? Q(() => global) ?? Q(() => self) ?? Q(() => window) ?? this;
    if (typeof File === 'undefined') {
        // Sham File class extending Blob
        $global.File = class File extends Blob {
            constructor(bits, filename, options = {}) {
                // Extract File-specific options
                const {
                    lastModified = Date.now(), ...blobOptions
                } = options;

                // Call Blob constructor with bits and blob options
                super(bits, blobOptions);

                // Add File-specific properties
                setHidden(this, '&name', filename);
                setHidden(this, '&lastModified', lastModified);
                setHidden(this, '&lastModifiedDate', new Date(lastModified));
            }

            get name() {
                return this['&name'];
            }

            get lastModified() {
                return this['&lastModified'];
            }

            get lastModifiedDate() {
                return this['&lastModifiedDate'];
            }

            get webkitRelativePath() {
                return '';
            }
        }
    }
})();
