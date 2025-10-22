/**

- Polyfill for the body property on Request and Response objects
- Creates a ReadableStream body property when the native implementation doesn’t provide one
- This handles environments where fetch API exists but body streams are not implemented
  */
(() => {
        // Early return if required APIs are not available
        if (!typeof Request || !typeof Response || !typeof ReadableStream) return;
const Q = fn =>{
 try{return fn?.()}catch{}
};
 const constructPrototype = newClass =>{
  try{
   if(newClass?.prototype)return newClass;
   const constProto = newClass?.constructor?.prototype;
   if(constProto){
    newClass.prototype = Q(()=>constProto?.bind?.(constProto)) ?? Object.create(Object(constProto));
    return newClass;
   }
   newClass.prototype = Q(()=>newClass?.bind?.(newClass)) ?? Object.create(Object(newClass));
  }catch(e){
   console.warn(e,newClass);
  }
 };
const extend = (thisClass, superClass) => {
     try{
            constructPrototype(thisClass);
            constructPrototype(superClass);
            Object.setPrototypeOf(
                thisClass.prototype,
                superClass?.prototype ??
                superClass?.constructor?.prototype ??
                superClass
            );
            Object.setPrototypeOf(thisClass, superClass);

        } catch (e) {
            console.warn(e, {
                thisClass,
                superClass
            });
        }
        return thisClass;
    };
        /**

        - Creates a function that returns a string for all string conversion methods
        - Used to provide consistent string representations for polyfilled functions
        - @param {string} str - The string to return
        - @returns {Function} A function that returns the string for all conversion methods
        - @private
          */
        const makeStringer = str => {
            const stringer = () => str;
            ['valueOf', 'toString', 'toLocaleString', Symbol.toPrimitive].forEach(x => {
                stringer[x] = stringer;
            });
            stringer[Symbol.toStringTag] = str;
            return stringer;
        };

        /**

        - Sets string conversion methods on a function to indicate it’s polyfill code
        - Provides consistent debugging experience by showing polyfill status
        - @param {Function} obj - The function to modify
        - @returns {Function} The modified function
        - @private
          */
        const setStrings = (obj) => {
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

        /**

        - Safely checks instanceof relationship to avoid errors with cross-realm objects
        - @param {*} x - The object to check
        - @param {Function} y - The constructor to check against
        - @returns {boolean} True if x is an instance of y, false otherwise or on error
          */
        const instanceOf = (x, y) => Q(() => x instanceof y);

        /**

        - Internal class to manage streaming components for body property
        - Keeps track of cloned record, blob conversion, stream, and reader state
        - @private
          */
        class StreamParts {
            /** @type {Request|Response} The cloned request/response record */
            record;
            /** @type {ReadableStream} The body stream */
            body;
            /** @type {Blob|Promise<Blob>} The blob representation */
            blob;
            /** @type {ReadableStream} The blob’s stream */
            stream;
            /** @type {ReadableStreamDefaultReader} The stream reader */
            reader;
        }

        /**

        - Safely closes a ReadableStream controller
        - @param {ReadableStreamDefaultController} ctrl - The controller to close
          */
        const close = ctrl => Q(() => ctrl.close());

        /**

        - Safely cancels a ReadableStream or ReadableStreamReader
        - @param {ReadableStream|ReadableStreamDefaultReader} reader - The stream or reader to cancel
          */
        const cancel = reader => Q(() => reader.cancel());

        /**

        - Safely releases the lock on a ReadableStream reader
        - @param {ReadableStreamDefaultReader} reader - The reader to release
          */
        const releaseLock = reader => Q(() => reader.releaseLock());

        /**

        - Checks if a value is a Promise-like object
        - Uses multiple checks including instanceof, prototype comparison, constructor name, and thenable
        - @param {*} x - Value to check
        - @returns {boolean} True if the value appears to be a Promise
          */
        const isPromise = x =>
            instanceOf(x, Promise) ||
            instanceOf(Promise.prototype, x?.constructor) ||
            x?.constructor?.name === 'Promise' ||
            typeof x?.then === 'function';

        // Apply body property polyfill to Request and Response
        for (const record of [Request, Response]) {
            (() => {
                    // Test if body property already works correctly
                    if (new record("https: //example.com", {
                            method: "POST",
                            body: "test"
                        }).body) {
                    return;
                }



                /**
                 * Polyfill implementation of the body property getter
                 * Creates a ReadableStream from the request/response body content
                 * Uses WeakMap to associate stream parts with each request/response instance
                 */
                Object.defineProperty(record.prototype, "body", {
                    get: (() => {
                        // WeakMap to store StreamParts for each request/response instance
                        // Fallback to Map if WeakMap is not available
                        const $bodies = new(globalThis.WeakMap ?? Map);

                        /**
                         * Body property getter function
                         * @returns {ReadableStream|null} The body as a ReadableStream, or null for GET/HEAD requests
                         * @note Sets ReadableStream as the prototype of the body function for better runtime type traceability
                         * @example
                         * // Usage with Request
                         * const req = new Request('/api', { method: 'POST', body: 'data' });
                         * const stream = req.body; // ReadableStream
                         * 
                         * // Usage with Response
                         * const res = new Response('hello world');
                         * const stream = res.body; // ReadableStream
                         * const reader = stream.getReader();
                         */
                        return extend(setStrings(function body() {
                            // GET and HEAD requests have no body
                            if (/GET|HEAD/.test(this.method)) return null;

                            let $this = this;

                            // Get or create StreamParts for this instance
                            const $streamParts = $bodies.get(this) ?? new StreamParts();
                            $bodies.set(this, $streamParts);

                            // Create the body stream if it doesn't exist
                            $streamParts.body ??= new ReadableStream({
                                /**
                                 * Start method for the ReadableStream
                                 * Converts the body to a blob, then streams its content
                                 * Handles async request/response objects for future constructor compatibility
                                 * @param {ReadableStreamDefaultController} controller - Stream controller
                                 */
                                start: extend(setStrings(async function start(controller) {
                                    try {
                                        // Await the request/response object if it's a promise (for future ReadableStream constructor support)
                                        if (isPromise($this)) {
                                            $this = await $this;
                                        }

                                        // Clone the original request/response to avoid consuming the original
                                        $streamParts.record ??= $this.clone();
                                        if (isPromise($streamParts.record)) {
                                            $streamParts.record = await $streamParts.record;
                                        }

                                        // Convert body to blob if not already done
                                        $streamParts.blob ??= $streamParts.record.blob();
                                        // Await blob conversion if it's a promise
                                        if (isPromise($streamParts.blob)) {
                                            $streamParts.blob = await $streamParts.blob;
                                        }

                                        // Get stream from blob and create reader
                                        $streamParts.stream ??= $streamParts.blob.stream();
                                        if (isPromise($streamParts.stream)) {
                                            $streamParts.stream = await $streamParts.stream;
                                        }

                                        $streamParts.reader ??= $streamParts.stream.getReader();
                                        if (isPromise($streamParts.reader)) {
                                            $streamParts.reader = await $streamParts.reader;
                                        }

                                        // Read all chunks from the blob stream and enqueue them
                                        let chunk = await $streamParts.reader.read();
                                        while (chunk?.done === false) {
                                            controller.enqueue(chunk?.value);
                                            chunk = await $streamParts.reader.read();
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        // Clean up resources
                                        releaseLock($streamParts.reader);
                                        close(controller);
                                        cancel($streamParts.reader);
                                        cancel($streamParts.stream);
                                    }
                                }), ReadableStreamDefaultController),
                            });

                            return $streamParts.body;
                        }), ReadableStream);
                    })(),
                    configurable: true,
                    enumerable: true,
                });
            })();


    }
})();
