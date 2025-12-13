(() => {
    const Q = fn => {
        try {
            return fn?.()
        } catch {}
    };
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
                this['&name'] = filename;
                this['&lastModified'] = lastModified;
                this['&lastModifiedDate'] = new Date(lastModified);
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
