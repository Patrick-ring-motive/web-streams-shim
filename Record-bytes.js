/**

- Polyfill for the bytes() method on Request, Response, and Blob objects
- Adds a bytes() method that returns a Uint8Array of the object’s content
- @see https://fetch.spec.whatwg.org/#dom-body-bytes
  */
(() => {
    const makeStringer = str => {
        const stringer = () => str;
        ['valueOf', 'toString', 'toLocaleString', Symbol.toPrimitive].forEach(x => {
            stringer[x] = stringer;
        });
        stringer[Symbol.toStringTag] = str;
        return stringer;
    };
    const setStrings = (obj, name) => {
        for (const str of ['toString', 'toLocaleString', Symbol.toStringTag]) {
            Object.defineProperty(obj, str, {
                value: makeStringer(`function ${obj.name}() { [polyfill code] }`),
                configurable: true,
                writable: true,
                enumerable: false,
            });
        }
        return obj;
    };
    /**
    - Safely executes a function and catches any errors
    - @param {Function} fn - Function to execute
    - @returns {*} The result of fn() or undefined if an error occurred
      */
    const Q = fn => {
        try {
            return fn?.();
        } catch {}
    };
    // Apply bytes() method to Request, Response, and Blob prototypes
    for (const record of [Q(() => Request), Q(() => Response), Q(() => Blob)]) {
        (() => {
            /**
             * Returns the body/content as a Uint8Array
             * Polyfill implementation that converts arrayBuffer() result to Uint8Array
             * @returns {Promise<Uint8Array>} A promise that resolves to a Uint8Array containing the object’s bytes
             * @note Sets Uint8Array as the prototype of the bytes function for better runtime type traceability
             * @example
             * // Usage with Response
             * const response = new Response(‘hello’);
             * const bytes = await response.bytes(); // Uint8Array
             *
             * // Usage with Blob
             * const blob = new Blob([‘hello’]);
             * const bytes = await blob.bytes(); // Uint8Array
             *
             * // Usage with Request
             * const request = new Request(’/’, { method: ‘POST’, body: ‘data’ });
             * const bytes = await request.bytes(); // Uint8Array
             */
            (record?.prototype ?? {}).bytes ??= Object.setPrototypeOf(setStrings(async function bytes() {
                return new Uint8Array(await this.arrayBuffer());
            }), Q(() => Uint8Array) ?? {});
        })();
    }
})();
