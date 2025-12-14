(() => {
    // **TESTING FLAG**: Set to true to force enable all polyfills regardless of feature detection
    let FORCE_POLYFILLS = false;
    try{
        if(location.href.includes('test.html')){
            FORCE_POLYFILLS = true;
        }
    }catch{}
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
     * Polyfill for ReadableStream async iterator protocol support
     */
    (() => {
        if (typeof ReadableStream === 'undefined') return;

        const asyncQ = async (fn) => {
            try {
                return await fn?.();
            } catch {}
        };

        const terminate = async (x, reason) => {
            await asyncQ(async () => x.cancel(reason));
            await asyncQ(async () => x.close(reason));
            await asyncQ(async () => x.releaseLock(reason));
            return await asyncQ(async () => x.closed);
        };

        (() => {
            (FORCE_POLYFILLS || !ReadableStreamDefaultReader.prototype.next) && Object.defineProperty(ReadableStreamDefaultReader.prototype, 'next', {
                value: extend(setStrings(function next() {
                    return this.read();
                }), ReadableStreamDefaultReader.prototype.read),
                configurable: true,
                writable: true,
                enumerable: false,
            });
        })();

        (() => {
            (FORCE_POLYFILLS || !ReadableStreamDefaultReader.prototype[Symbol.asyncIterator]) && 
            (ReadableStreamDefaultReader.prototype[Symbol.asyncIterator] = extend(setStrings(Object.defineProperty(function asyncIterator() {
                return this;
            }, 'name', {
                value: 'Symbol.asyncIterator',
                configurable: true,
                writable: true,
                enumerable: true,
            })), ReadableStreamDefaultReader));
        })();

        (() => {
            class StreamEnd {
                done = true;
                value;
                constructor(value) {
                    this.value = value;
                }
            }

            (() => {
                (FORCE_POLYFILLS || !ReadableStreamDefaultReader.prototype['return']) && Object.defineProperty(ReadableStreamDefaultReader.prototype, 'return', {
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

            (() => {
                (FORCE_POLYFILLS || !ReadableStreamDefaultReader.prototype['throw']) && Object.defineProperty(ReadableStreamDefaultReader.prototype, 'throw', {
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

            (() => {
                const $asyncDispose = Symbol.asyncDispose ?? 'Symbol.asyncDispose';

                (FORCE_POLYFILLS || !ReadableStreamDefaultReader.prototype[$asyncDispose]) && Object.defineProperty(ReadableStreamDefaultReader.prototype, $asyncDispose, {
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

        (() => {
            const $readers = new(globalThis.WeakMap ?? Map);

            extend(ReadableStream.prototype.getReader, ReadableStreamDefaultReader);

            (FORCE_POLYFILLS || !ReadableStream.prototype[Symbol.asyncIterator]) && 
            (ReadableStream.prototype[Symbol.asyncIterator] = extend(setStrings(Object.defineProperty(function asyncIterator() {
                const $reader = $readers.get(this) ?? Q(() => this?.getReader?.());
                $readers.set(this, $reader);
                return $reader;
            }, 'name', {
                value: 'Symbol.asyncIterator',
                configurable: true,
                writable: true,
                enumerable: true,
            })), ReadableStream.prototype.getReader));

            (FORCE_POLYFILLS || !ReadableStream.prototype.values) && 
            (ReadableStream.prototype.values = extend(setStrings(function values() {
                return this[Symbol.asyncIterator]();
            }), ReadableStream.prototype[Symbol.asyncIterator]));

        })();
    })();

    /**
     * Polyfill for ReadableStream.from() method
     */
    (() => {
        if (typeof ReadableStream === 'undefined') return;

        const close = ctrl => Q(() => ctrl.close());
        const cancel = readable => Q(() => readable.cancel());
        const isPromise = x => instanceOf(x, Promise) ||
            instanceOf(Promise.prototype, x?.constructor) ||
            x?.constructor?.name === 'Promise' ||
            typeof x?.then === 'function';

        (FORCE_POLYFILLS || !ReadableStream.from) && 
        (ReadableStream.from = extend(setStrings(function from(obj) {
            let $iter, $readableStream;

            $readableStream = new ReadableStream({
                pull: extend(setStrings(async function pull(controller) {
                    try {
                        if (isPromise(obj)) {
                            obj = await obj;
                        }
                        $iter ??= obj?.[Symbol.iterator]?.() ??
                            obj?.[Symbol.asyncIterator]?.() ?? [][Symbol.iterator].call(obj);

                        let chunk = $iter.next();

                        if (isPromise(chunk)) {
                            chunk = await chunk;
                        }

                        if (chunk?.done === false) {
                            let value = chunk?.value;

                            if (isPromise(value)) {
                                value = await value;
                            }

                            controller.enqueue(value);
                        } else {
                            close(controller);
                        }
                    } catch (e) {
                        close(controller);
                        cancel($readableStream);
                        throw e;
                    }
                }), ReadableStreamDefaultController),
            });

            return $readableStream;

        }), ReadableStream));
    })();

    /**
     * Polyfill for the body property on Request and Response objects
     */
    (() => {
        if ([typeof Request, typeof Response, typeof ReadableStream].includes('undefined')) return;

        class StreamParts {
            record;
            body;
            blob;
            stream;
            reader;
        }

        const close = ctrl => Q(() => ctrl.close());
        const cancel = reader => Q(() => reader.cancel());
        const releaseLock = reader => Q(() => reader.releaseLock());
        const isPromise = x =>
            instanceOf(x, Promise) ||
            instanceOf(Promise.prototype, x?.constructor) ||
            x?.constructor?.name === 'Promise' ||
            typeof x?.then === 'function';

        for (const record of [Request, Response]) {
            (() => {
                // Test if body property already works correctly (skip if FORCE_POLYFILLS is false)
                if (!FORCE_POLYFILLS && new record("https://example.com", {
                        method: "POST",
                        body: "test"
                    }).body) {
                    return;
                }

                Object.defineProperty(record.prototype, "body", {
                    get: (() => {
                        const $bodies = new(globalThis.WeakMap ?? Map);

                        return extend(setStrings(function body() {
                            if (/GET|HEAD/.test(this.method)) return null;

                            let $this = this;
                            const $streamParts = $bodies.get(this) ?? new StreamParts();
                            $bodies.set(this, $streamParts);

                            $streamParts.body ??= new ReadableStream({
                                start: extend(setStrings(async function start(controller) {
                                    try {
                                        if (isPromise($this)) {
                                            $this = await $this;
                                        }

                                        $streamParts.record ??= $this.clone();
                                        if (isPromise($streamParts.record)) {
                                            $streamParts.record = await $streamParts.record;
                                        }

                                        $streamParts.blob ??= $streamParts.record.blob();
                                        if (isPromise($streamParts.blob)) {
                                            $streamParts.blob = await $streamParts.blob;
                                        }

                                        $streamParts.stream ??= $streamParts.blob.stream();
                                        if (isPromise($streamParts.stream)) {
                                            $streamParts.stream = await $streamParts.stream;
                                        }

                                        $streamParts.reader ??= $streamParts.stream.getReader();
                                        if (isPromise($streamParts.reader)) {
                                            $streamParts.reader = await $streamParts.reader;
                                        }

                                        let chunk = await $streamParts.reader.read();
                                        while (chunk?.done === false) {
                                            controller.enqueue(chunk?.value);
                                            chunk = await $streamParts.reader.read();
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
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

                if (!FORCE_POLYFILLS && 'bodyUsed' in record.prototype) return;
                Object.defineProperty(record.prototype, "bodyUsed", {
                    get: setStrings(function bodyUsed() {
                        return this.body?.locked;
                    }),
                    set: () => {},
                    configurable: true,
                    enumerable: true
                });
            })();
        }
    })();

    /**
     * Polyfill for the bytes() method on Request, Response, and Blob objects
     */
    (() => {
        for (const record of [Q(() => Request), Q(() => Response), Q(() => Blob)]) {
            (() => {
                if (!record?.prototype) return;
                
                (FORCE_POLYFILLS || !record.prototype.bytes) && 
                (record.prototype.bytes = extend(setStrings(async function bytes() {
                    return new Uint8Array(await this.arrayBuffer());
                }), Q(() => Uint8Array) ?? {}));
            })();
        }
    })();

    /**
     * Shim for duplex property on fetch-related objects
     */
    (() => {
        if ([typeof Request, typeof Response, typeof ReadableStream].includes('undefined')) return;

        const $global = Q(() => globalThis) ?? Q(() => self) ?? Q(() => global) ?? Q(() => window) ?? this;

        const duplexHalf = x => Q(() => Object.defineProperty(x, 'duplex', {
            value: 'half',
            configurable: true,
            writable: true,
            enumerable: false,
        })) ?? x;

        for (const record of [Request, Response, ReadableStream, Blob]) {
            duplexHalf(record.prototype);
        }

        (() => {
            const $Request = Request;

            const _Request = class Request extends $Request {
                constructor(...args) {
                    super(...args.map(duplexHalf));
                }
            };

            FORCE_POLYFILLS && ($global.Request = _Request);
        })();

        (() => {
            const $Response = Response;

            const _Response = class Response extends $Response {
                constructor(...args) {
                    super(...args.map(duplexHalf));
                }
            };

            FORCE_POLYFILLS && ($global.Response = _Response);
        })();

        (() => {
            const $fetch = fetch;

            const _fetch = extend(function fetch(...args) {
                return $fetch.apply(this, args.map(duplexHalf));
            }, $fetch);

            FORCE_POLYFILLS && ($global.fetch = _fetch);
        })();
    })();

    const supportsReadableStreamDefaultReaderConstructor = () => {
        try {
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue('test');
                    controller.close();
                }
            });
            const reader = new ReadableStreamDefaultReader(stream);
            reader.read();
            return true;
        } catch {
            return false;
        }
    }

    if (FORCE_POLYFILLS || !supportsReadableStreamDefaultReaderConstructor()) {
        const _ReadableStreamDefaultReader = globalThis.ReadableStreamDefaultReader;
        const $ReadableStreamDefaultReader = function ReadableStreamDefaultReader(stream) {
            return Object.setPrototypeOf(stream.getReader(), globalThis.ReadableStreamDefaultReader.prototype);
        };
        setStrings($ReadableStreamDefaultReader);
        extend($ReadableStreamDefaultReader, _ReadableStreamDefaultReader);
        globalThis.ReadableStreamDefaultReader = new Proxy($ReadableStreamDefaultReader, Object.setPrototypeOf({
            construct: Object.setPrototypeOf(function construct(_, [stream]) {
                return $ReadableStreamDefaultReader(stream)
            }, $ReadableStreamDefaultReader.prototype)
        }, $ReadableStreamDefaultReader));
        globalThis.ReadableStreamDefaultReader.prototype.constructor = globalThis.ReadableStreamDefaultReader;
    }

    // Log polyfill status
    if (FORCE_POLYFILLS) {
        console.log('[Stream Polyfills] FORCE_POLYFILLS enabled - all shims applied');
    }
})()
