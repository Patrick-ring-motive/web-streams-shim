/**

- Polyfill for ReadableStream async iterator protocol support
- Adds iterator methods to ReadableStream and ReadableStreamDefaultReader
- to make them compatible with async iteration (for-await-of loops) and disposal patterns
  */
(() => {
    // Early return if ReadableStream is not available
    if (!typeof ReadableStream) return;

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
            value: Object.setPrototypeOf(setStrings(function next() {
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
        ReadableStreamDefaultReader.prototype[Symbol.asyncIterator] ??= Object.setPrototypeOf(setStrings(Object.defineProperty(function asyncIterator() {
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
                value: Object.setPrototypeOf(setStrings(Object.defineProperty(function $return(reason) {
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
                value: Object.setPrototypeOf(setStrings(Object.defineProperty(function $throw(reason) {
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
                value: Object.setPrototypeOf(setStrings(Object.defineProperty(async function asyncDispose(reason) {
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
        Object.setPrototypeOf(ReadableStream.prototype.getReader, ReadableStreamDefaultReader);

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
        ReadableStream.prototype[Symbol.asyncIterator] ??= Object.setPrototypeOf(setStrings(Object.defineProperty(function asyncIterator() {
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
        ReadableStream.prototype.values ??= Object.setPrototypeOf(setStrings(function values() {
            return this[Symbol.asyncIterator]();
        }), ReadableStream.prototype[Symbol.asyncIterator]);


    })();
})();
