/**

- Polyfill for ReadableStream.from() method
- Creates a ReadableStream from an iterable object (sync or async)
- @see https://streams.spec.whatwg.org/#rs-from
  */
(() => {
    // Early return if ReadableStream is not available
    if (typeof ReadableStream === 'undefined') return;
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

    const instanceOf = (x, y) => Q(() => x instanceof y);
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
                        obj?.[Symbol.asyncIterator]?.() ?? [][Symbol.iterator].call(obj);

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
