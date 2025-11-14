(()=>{
  const Q = fn => {
        try {
            return fn?.()
        } catch {}
    };
    const constructPrototype = newClass => {
        try {
            if (newClass?.prototype) return newClass;
            const constProto = newClass?.constructor?.prototype;
            if (constProto) {
                newClass.prototype = Q(() => constProto?.bind?.(constProto)) ?? Object.create(Object(constProto));
                return newClass;
            }
            newClass.prototype = Q(() => newClass?.bind?.(newClass)) ?? Object.create(Object(newClass));
        } catch (e) {
            console.warn(e, newClass);
        }
    };
    const extend = (thisClass, superClass) => {
        try {
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
    - @param {string} name - The function name (currently unused but kept for future use)
    - @returns {Function} The modified function
    - @private
      */
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


const instanceOf = (x, y) => Q(() => x instanceof y);

/**

- Polyfill for ReadableStream async iterator protocol support
- Adds iterator methods to ReadableStream and ReadableStreamDefaultReader
- to make them compatible with async iteration (for-await-of loops) and disposal patterns
  */
(() => {
    // Early return if ReadableStream is not available
    if (typeof ReadableStream === 'undefined') return;
    
    /**

    - Safely executes an async function and catches any errors
    - @param {Function} fn - Async function to execute
    - @returns {Promise<*>} The result of fn() or undefined if an error occurred
      */
    const asyncQ = async (fn) => {
        try {
            return await fn?.();
        } catch {}
    };

    /**

    - Terminates a stream/reader by calling all cleanup methods
    - Attempts cancel, close, and releaseLock operations safely
    - @param {ReadableStream|ReadableStreamDefaultReader} x - The stream or reader to terminate
    - @param {*} reason - Optional reason for termination
    - @returns {Promise} Promise that resolves to the closed state or undefined
      */
    const terminate = async (x, reason) => {
        await asyncQ(async () => x.cancel(reason));
        await asyncQ(async () => x.close(reason));
        await asyncQ(async () => x.releaseLock(reason));
        return await asyncQ(async () => x.closed);
    };

    /**

    - Add next() method to ReadableStreamDefaultReader
    - Makes readers compatible with async iterator protocol
      */
    (() => {
        /**
        - Iterator next() method for ReadableStreamDefaultReader
        - Delegates to the reader’s read() method for async iterator compatibility
        - @returns {Promise<{done: boolean, value: any}>} Iterator result object
        - @note Sets the read method as prototype for better runtime type traceability
        - @example
        - const reader = stream.getReader();
        - const { done, value } = await reader.next(); // Same as reader.read()
          */
        ReadableStreamDefaultReader.prototype.next ?? Object.defineProperty(ReadableStreamDefaultReader.prototype, 'next', {
            value: extend(setStrings(function next() {
                return this.read();
            }), ReadableStreamDefaultReader.prototype.read),
            configurable: true,
            writable: true,
            enumerable: false,
        });
    })();

    /**

    - Add Symbol.asyncIterator to ReadableStreamDefaultReader
    - Makes readers directly iterable with for-await-of loops
      */
    (() => {
        /**
        - Async iterator method for ReadableStreamDefaultReader
        - Returns the reader itself since it implements the async iterator protocol
        - @returns {ReadableStreamDefaultReader} The reader itself
        - @note Sets ReadableStreamDefaultReader as prototype for better runtime type traceability
        - @example
        - const reader = stream.getReader();
        - for await (const chunk of reader) {
        - console.log(chunk);
        - }
          */
        ReadableStreamDefaultReader.prototype[Symbol.asyncIterator] ??= extend(setStrings(Object.defineProperty(function asyncIterator() {
            return this;
        }, 'name', {
            value: 'Symbol.asyncIterator',
            configurable: true,
            writable: true,
            enumerable: true,
        })), ReadableStreamDefaultReader);
    })();

    /**

    - Iterator completion and disposal methods for ReadableStreamDefaultReader
    - Implements return() and throw() methods for proper async iterator protocol compliance
      */
    (() => {
        /**
        - Internal class representing the end of stream iteration
        - Used to signal completion with optional return value
        - @private
          */
        class StreamEnd {
            /** @type {boolean} Always true to indicate iteration is complete */
            done = true;
            /** @type {*} The return/throw value */
            value;

            /**
            - @param {*} value - The value to return when iteration ends
              */
            constructor(value) {
                this.value = value;
            }
        }


        /**
         * Add return() method to ReadableStreamDefaultReader
         * Handles early termination of async iteration
         */
        (() => {
            /**
             * Iterator return() method for ReadableStreamDefaultReader
             * Called when async iteration is terminated early (break, return, etc.)
             * Safely cancels the stream and releases the reader lock
             * @param {*} reason - Optional reason for termination
             * @returns {StreamEnd} Iterator result indicating completion
             * @note Sets releaseLock as prototype for better runtime type traceability
             * @example
             * for await (const chunk of reader) {
             *   if (shouldStop) break; // Calls reader.return() automatically
             * }
             */
            ReadableStreamDefaultReader.prototype['return'] ?? Object.defineProperty(ReadableStreamDefaultReader.prototype, 'return', {
                value: extend(setStrings(Object.defineProperty(function $return(reason) {
                    terminate(this, reason);
                    return new StreamEnd(reason);
                }, 'name', {
                    value: 'return',
                    configurable: true,
                    writable: true,
                    enumerable: true,
                })), ReadableStreamDefaultReader.prototype.releaseLock),
                configurable: true,
                writable: true,
                enumerable: false,
            });
        })();

        /**
         * Add throw() method to ReadableStreamDefaultReader
         * Handles error injection into async iteration
         */
        (() => {
            /**
             * Iterator throw() method for ReadableStreamDefaultReader
             * Called when an error is injected into async iteration
             * Safely cancels the stream and releases the reader lock
             * @param {*} reason - The error/reason being thrown
             * @returns {StreamEnd} Iterator result indicating completion with error
             * @note Sets controller error method as prototype for better runtime type traceability
             * @example
             * const iterator = reader[Symbol.asyncIterator]();
             * iterator.throw(new Error('Stop processing'));
             */
            ReadableStreamDefaultReader.prototype['throw'] ?? Object.defineProperty(ReadableStreamDefaultReader.prototype, 'throw', {
                value: extend(setStrings(Object.defineProperty(function $throw(reason) {
                    terminate(this, reason);
                    console.error(reason);
                    return new StreamEnd(reason);
                }, 'name', {
                    value: 'throw',
                    configurable: true,
                    writable: true,
                    enumerable: true,
                })), ReadableStreamDefaultController.prototype.error),
                configurable: true,
                writable: true,
                enumerable: false,
            });
        })();

        /**
         * Add Symbol.asyncDispose method to ReadableStreamDefaultReader
         * Supports the async disposal pattern (using/await using statements)
         */
        (() => {
            // Use Symbol.asyncDispose if available, otherwise use string key as fallback
            const $asyncDispose = Symbol.asyncDispose ?? 'Symbol.asyncDispose';

            /**
             * Async dispose method for ReadableStreamDefaultReader
             * Called automatically when using 'await using' syntax
             * Safely cancels the stream and releases the reader lock
             * @param {*} reason - Optional disposal reason
             * @returns {Promise} Promise that resolves when disposal is complete
             * @note Sets closed property getter as prototype for better runtime type traceability
             * @example
             * await using reader = stream.getReader();
             * // reader is automatically disposed when leaving scope
             * 
             * // Or manually:
             * await reader[Symbol.asyncDispose]();
             */
            ReadableStreamDefaultReader.prototype[$asyncDispose] ?? Object.defineProperty(ReadableStreamDefaultReader.prototype, $asyncDispose, {
                value: extend(setStrings(Object.defineProperty(async function asyncDispose(reason) {
                    return await terminate(this, reason);
                }, 'name', {
                    value: 'Symbol.asyncDispose',
                    configurable: true,
                    writable: true,
                    enumerable: true,
                })), Object.getOwnPropertyDescriptor(ReadableStreamDefaultReader.prototype, 'closed').get),
                configurable: true,
                writable: true,
                enumerable: false,
            });
        })();


    })();

    /**

    - Add async iterator support to ReadableStream itself
    - Makes streams directly iterable without needing to get a reader first
      */
    (() => {
        // WeakMap to associate readers with streams for reuse
        const $readers = new(globalThis.WeakMap ?? Map);


        // Set prototype on getReader method for better type traceability
        extend(ReadableStream.prototype.getReader, ReadableStreamDefaultReader);

        /**
         * Async iterator method for ReadableStream
         * Returns a reader that can be used with for-await-of loops
         * Reuses the same reader for multiple iteration attempts on the same stream
         * @returns {ReadableStreamDefaultReader} A reader for async iteration
         * @note Sets getReader as prototype for better runtime type traceability
         * @example
         * for await (const chunk of stream) {
         *   console.log(chunk);
         * }
         */
        ReadableStream.prototype[Symbol.asyncIterator] ??= extend(setStrings(Object.defineProperty(function asyncIterator() {
            const $reader = $readers.get(this) ?? Q(() => this?.getReader?.());
            $readers.set(this, $reader);
            return $reader;
        }, 'name', {
            value: 'Symbol.asyncIterator',
            configurable: true,
            writable: true,
            enumerable: true,
        })), ReadableStream.prototype.getReader);

        /**
         * Values method for ReadableStream
         * Alias for Symbol.asyncIterator for explicit iteration
         * @returns {ReadableStreamDefaultReader} A reader for async iteration
         * @note Sets the asyncIterator method as prototype for better runtime type traceability
         * @example
         * for await (const chunk of stream.values()) {
         *   console.log(chunk);
         * }
         */
        ReadableStream.prototype.values ??= extend(setStrings(function values() {
            return this[Symbol.asyncIterator]();
        }), ReadableStream.prototype[Symbol.asyncIterator]);


    })();
})();
/**

- Polyfill for ReadableStream.from() method
- Creates a ReadableStream from an iterable object (sync or async)
- @see https://streams.spec.whatwg.org/#rs-from
  */
(() => {
    // Early return if ReadableStream is not available
    if (typeof ReadableStream === 'undefined') return;
    
    
    /**

    - Safely closes a ReadableStream controller
    - @param {ReadableStreamDefaultController} ctrl - The controller to close
      */
    const close = ctrl => Q(() => ctrl.close());

    /**

    - Safely cancels a ReadableStream or ReadableStreamReader
    - @param {ReadableStream|ReadableStreamDefaultReader} readable - The stream or reader to cancel
      */
    const cancel = readable => Q(() => readable.cancel());

    /**

    - Checks if a value is a Promise-like object
    - @param {*} x - Value to check
    - @returns {boolean} True if the value appears to be a Promise
      */
    const isPromise = x => instanceOf(x, Promise) ||
        instanceOf(Promise.prototype, x?.constructor) ||
        x?.constructor?.name === 'Promise' ||
        typeof x?.then === 'function';
    /**

    - Creates a ReadableStream from an iterable object
    - Polyfill implementation for ReadableStream.from()
    - @param {Iterable|AsyncIterable} obj - An iterable or async iterable object
    - @returns {ReadableStream} A new ReadableStream that yields values from the iterable
    - @note Sets ReadableStream as the prototype of the from function for better runtime type traceability
    - @example
    - // From array
    - const stream = ReadableStream.from([1, 2, 3]);
    - 
    - // From generator
    - function* gen() { yield 1; yield 2; yield 3; }
    - const stream2 = ReadableStream.from(gen());
    - 
    - // From async generator
    - async function* asyncGen() { yield Promise.resolve(1); }
    - const stream3 = ReadableStream.from(asyncGen());
      */
    ReadableStream.from ??= extend(setStrings(function from(obj) {
        let $iter, $readableStream;


        $readableStream = new ReadableStream({
            /**
             * Pull method for the ReadableStream
             * Retrieves the next value from the iterator and enqueues it
             * @param {ReadableStreamDefaultController} controller - Stream controller
             */
            pull: extend(setStrings(async function pull(controller) {
                try {
                    if (isPromise(obj)) {
                        obj = await obj;
                    }
                    // Initialize iterator if not already done
                    // Try sync iterator first, then async iterator, then convert to array and get iterator as last resort
                    $iter ??= obj?.[Symbol.iterator]?.() ??
                        obj?.[Symbol.asyncIterator]?.() ?? [...obj][Symbol.iterator]();

                    // Get next chunk from iterator
                    let chunk = $iter.next();

                    // Await if chunk is a promise
                    if (isPromise(chunk)) {
                        chunk = await chunk;
                    }

                    // If iterator is not done, enqueue the value
                    if (chunk?.done === false) {
                        let value = chunk?.value;

                        // Await value if it's a promise
                        if (isPromise(value)) {
                            value = await value;
                        }

                        controller.enqueue(value);
                    } else {
                        // Iterator is done, close the stream
                        close(controller);
                    }
                } catch (e) {
                    // On error, close controller and cancel stream
                    close(controller);
                    cancel($readableStream);
                    throw e;
                }
            }), ReadableStreamDefaultController),
        });

        return $readableStream;

    }), ReadableStream);
})();
/**

- Polyfill for the body property on Request and Response objects
- Creates a ReadableStream body property when the native implementation doesn’t provide one
- This handles environments where fetch API exists but body streams are not implemented
  */
(() => {
    // Early return if required APIs are not available
    if ([typeof Request,typeof Response,typeof ReadableStream].includes('undefined')) return;


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
})();
