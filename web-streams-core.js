(() => {
    // **TESTING FLAG**: Set to true to force enable all polyfills regardless of feature detection
    let FORCE_POLYFILLS = false;
    try{
        if(location.href.includes('test.html')){
            FORCE_POLYFILLS = true;
        }
    }catch{}
    const errors = new Set();
    const dedupeErrors = x => {
        const key = `${x?.name}|${x?.message}|${x?.stack}`;
        if(errors.has(key))return false;
        errors.add(key);
        return true;
    }
    const Q = fn => {
        try {
            const result = fn?.();
            result?.catch?.((e)=>FORCE_POLYFILLS&& dedupeErrors(e) && console.warn(e));
            return result; 
        } catch(e){
            if(FORCE_POLYFILLS)console.warn(e);
        }
    };
    const $global = Q(() => globalThis) ?? Q(() => global) ?? Q(() => self) ?? Q(() => window) ?? this;
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

    const setStrings = (obj) => {
        let type = 'function';
        if(String(obj).trim().startsWith('class')||/^[A-Z]|^.[A-Z]/.test(obj?.name)){
            type = 'class';
        }
        if(String(obj).trim().startsWith('async')||/async/i.test(obj?.name)){
            type = 'async function';
        }
        for (const str of ['toString', 'toLocaleString', Symbol.toStringTag]) {
            Object.defineProperty(obj, str, {
                value: makeStringer(`${type} ${obj.name} { [polyfill code] }`),
                configurable: true,
                writable: true,
                enumerable: false,
            });
        }
        return obj;
    };


    const instanceOf = (x, y) => Q(() => x instanceof y);
    const setHidden = (obj, prop, value) => {
        Object.defineProperty(obj, prop, {
            value,
            writeable: true,
            writable: true,
            enumerable: false,
            configurable: true
        });
    };

    const BYOBReader = $global.ReadableStreamBYOBReader;

    (() => {
        if (typeof ReadableStream === 'undefined') return;
        const _locked = Object.getOwnPropertyDescriptor(ReadableStream.prototype, 'locked')?.get;
        if (FORCE_POLYFILLS || _locked) {
            Object.defineProperty(ReadableStream.prototype, 'locked', {
                get: extend(setStrings(function locked() {
                        return Q(() => _locked.call(this));
                }), _locked),
                enumerable: false,
                configurable: true
            });
        }        
    })();
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

                            return Object.setPrototypeOf($streamParts.body, ReadableStream.prototype);
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

        const duplexHalf = x => Q(() => x != undefined ? Object.defineProperty(Object(x), 'duplex', {
            value: 'half',
            configurable: true,
            writable: true,
            enumerable: false,
        }) : x);

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

    (() => {
    const assign = (target, source) => {
        const props = Object.getOwnPropertyDescriptors(source);
        for (const key in props) {
            try {
                Object.defineProperty(target, key, props[key]);
            } catch (e) {
                console.warn(e, key, props[key]);
            }
        }
        for (const key in source) {
            try {
                target[key] ??= source[key];
            } catch (e) {
                console.warn(e, key, props[key]);
            }
        }
        return target;
    };
    const cloneClass = $class => {
        const clonePrototype = assign({}, $class.prototype);
        const clone = $class.bind(clonePrototype);
        assign(clone, $class);
        clone.prototype = Object.setPrototypeOf(clonePrototype, Object.getPrototypeOf($class.prototype));
        Object.setPrototypeOf(clone, Object.getPrototypeOf($class));
        return clone;
    };

    const _closed = Object.getOwnPropertyDescriptor($global.ReadableStreamDefaultReader.prototype, 'closed')?.get;
    if (FORCE_POLYFILLS || _closed) {
        Object.defineProperty($global.ReadableStreamDefaultReader.prototype, 'closed', {
            get: extend(setStrings(async function closed() {
                try {
                    return await _closed.call(this);
                } catch (e) {
                    console.warn(e);
                }
            }), _closed),
            enumerable: false,
            configurable: true
        });
    }

    if (FORCE_POLYFILLS || !$global.ReadableStreamBYOBReader) {
        $global.ReadableStreamBYOBReader ??= cloneClass(ReadableStreamDefaultReader);
        Object.defineProperty(ReadableStreamBYOBReader, 'name', {
            value: 'ReadableStreamBYOBReader',
            enumerable: true,
            configurable: true,
            writable: true
        });
        setStrings(ReadableStreamBYOBReader);
        const _getReader = ReadableStream.prototype.getReader;
        ReadableStream.prototype.getReader = Object.setPrototypeOf(function getReader(options,attempts) {
            if(this.locked === true){
                throw new TypeError('This stream is already locked for reading by another reader');
            }
            attempts ||= Math.max(attempts||0,this['&attempts']||0);
            setHidden(this,'&attempts',attempts + 1);
            let reader;
            if (!options) {
                reader = _getReader.call(this);
            }else{
                if (options?.mode == 'byob') {
                    setHidden(this,'&mode','byob');
                    setHidden(this,'&type','bytes');
                }
                try{
                    reader = _getReader.call(this, options,attempts + 1);
                }catch(e){
                    if(FORCE_POLYFILLS)console.warn(e,this,options,this?.locked,instanceOf(this, ReadableStream),attempts);
                    if(attempts<3){
                        const streamClone = new Response(this).body;
                        setHidden(streamClone,'&attempts',attempts + 1);
                        setHidden(streamClone,'&mode',options?.mode ?? this['&mode']);
                        setHidden(streamClone,'&type','bytes');
                        reader = streamClone.getReader(options,attempts+1);
                    }else if(attempts === 3){
                        const streamClone = new Response(this).body;
                        setHidden(streamClone,'&attempts',attempts + 1);
                        setHidden(streamClone,'&mode','byob');
                        setHidden(streamClone,'&type','bytes');
                        reader = streamClone.getReader(null,attempts+1);
                    }
                }
            }
            if (options?.mode == 'byob' || this['&mode'] == 'byob') {
                Object.setPrototypeOf(reader, ReadableStreamBYOBReader.prototype);
            }
            return reader;
        }, _getReader);
        extend(ReadableStreamBYOBReader, ReadableStreamDefaultReader);
        const _read = ReadableStreamBYOBReader.prototype.read;
        const defaultRead = ReadableStreamDefaultReader.prototype.read;
        const BYOBRead = BYOBReader?.prototype?.read;
        ReadableStreamBYOBReader.prototype.read = extend(setStrings(async function read(view) {
            // If no view is provided, fall back to default behavior
            view ??= this['&controller']?.['&view'] ?? this?.['&view'];
            setHidden(this['&controller']??{},'&view', view);
            setHidden(this,'&view', view);
            if (!view) {
                return defaultRead.call(this, view);
            }

            try{
                // Read from the underlying stream (default reader behavior)
                const result = await (BYOBRead || _read).call(this, view);
                setHidden(result,'&view', view);
                // If done, return with the view and done flag
                if (result.done != false) {
                    return {
                        value: view,
                        done: true
                    };
                }
                // Convert the chunk to Uint8Array if needed
                const chunk = result.value instanceof Uint8Array ? result.value : new Uint8Array(result.value);
                // Determine how much data we can copy
                const bytesToCopy = Math.min(chunk.byteLength, view.byteLength);
                // Create a temporary view to copy into the provided view
                const targetView = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
                // Copy the data into the provided buffer
                targetView.set(chunk.subarray(0, bytesToCopy), 0);
                // Create a view of the filled portion
                const filledView = new view.constructor(view.buffer, view.byteOffset, bytesToCopy);
                return {
                    value: filledView,
                    done: false
                };
            }catch(e){
                if(FORCE_POLYFILLS)console.warn(e,this,view);
                return defaultRead.call(this);
            }
        }), _read);
        ReadableStreamDefaultReader.prototype.read = ReadableStreamBYOBReader.prototype.read;
    }
    const supportsReadableStreamBYOBReaderConstructor = () => {
        try {
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new Uint8Array([0]));
                    controller.close();
                },
                type: 'bytes'
            });
            const reader = new ReadableStreamBYOBReader(stream);
            reader.read(new Uint8Array([0])).catch((e) => console.warn(e));
            return true;
        } catch {
            return false;
        }
    };
    if (FORCE_POLYFILLS || !supportsReadableStreamBYOBReaderConstructor()) {
        const _ReadableStreamBYOBReader = $global.ReadableStreamBYOBReader;
        const $ReadableStreamBYOBReader = function ReadableStreamBYOBReader(stream) {
            return Object.setPrototypeOf(stream.getReader({ mode: 'byob' }), $global.ReadableStreamBYOBReader.prototype);
        };
        setStrings($ReadableStreamBYOBReader);
        extend($ReadableStreamBYOBReader, _ReadableStreamBYOBReader);
        $global.ReadableStreamBYOBReader = new Proxy($ReadableStreamBYOBReader, Object.setPrototypeOf({
            construct: Object.setPrototypeOf(function construct(_, [stream]) {
                return $ReadableStreamBYOBReader(stream);
            }, $ReadableStreamBYOBReader.prototype)
        }, $ReadableStreamBYOBReader));
        $global.ReadableStreamBYOBReader.prototype.constructor = $global.ReadableStreamBYOBReader;
    }
    if (FORCE_POLYFILLS || !$global.ReadableStreamBYOBRequest) {

        if (FORCE_POLYFILLS || !$global.ReadableStreamBYOBRequest) {

            class ReadableStreamBYOBRequest {
                constructor(controller, view) {
                    setHidden(this, '&controller', controller);
                    setHidden(this, '&view', view);
                    setHidden(this, '&responded', false);
                }

                get view() {
                    return this['&responded'] ? null : this['&view'];
                }

                respond(bytesWritten) {
                    if (this['&responded']) {
                        throw new TypeError('This BYOB request has already been responded to');
                    }
                    setHidden(this, '&responded', true);

                    const filledView = new this['&view'].constructor(
                        this['&view'].buffer,
                        this['&view'].byteOffset,
                        bytesWritten
                    );
                    this['&controller'].enqueue(filledView);
                }

                respondWithNewView(view) {
                    if (this['&responded']) {
                        throw new TypeError('This BYOB request has already been responded to');
                    }
                    setHidden(this, '&responded', true);
                    this['&controller'].enqueue(view);
                }
            }

            setStrings(ReadableStreamBYOBRequest);
            const BYOBRequest = $global.ReadableStreamBYOBRequest;
            $global.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest;
            Q(() => extend($global.ReadableStreamBYOBRequest, BYOBRequest));

            // Add byobRequest property to default controller
            if (FORCE_POLYFILLS || !('byobRequest' in ReadableStreamDefaultController.prototype)) {
                Object.defineProperty(ReadableStreamDefaultController.prototype, 'byobRequest', {
                    get: extend(setStrings(function byobRequest() {
                        const view = this['&view'];
                        if (view || this['&mode'] == 'byob' || this['&type'] == 'bytes') {
                            setHidden(this, '&view', view);
                            return new ReadableStreamBYOBRequest(this, view);
                        }
                        return null;
                    }), ReadableStreamBYOBRequest),
                    configurable: true,
                    enumerable: true
                });
            }

            // Wrap ReadableStream constructor
            const _ReadableStream = ReadableStream;

            $global.ReadableStream = extend(setStrings(function ReadableStream(underlyingSource = {}, strategy) {
                const $this = this ?? new.target?.prototype;

                if (underlyingSource?.type == 'bytes') {
                    setHidden($this, '&mode', 'byob');
                    setHidden($this, '&type', 'bytes');
                    setHidden($this, 'defaultStream', new _ReadableStream(Object.setPrototypeOf({type:'bytes'},underlyingSource),strategy));
                    const wrappedSource = Object.assign({}, underlyingSource);
                    const originalStart = underlyingSource.start;
                    const originalPull = underlyingSource.pull;

                    wrappedSource.start = extend(setStrings(function start(controller) {
                        setHidden(controller,'&stream',$this);
                        setHidden($this,'&controller',controller);
                        return originalStart?.call($this, controller);
                    }), originalStart ?? ReadableStreamDefaultController);

                    wrappedSource.pull = extend(setStrings(async function pull(controller) {
                        setHidden(controller,'&stream',$this);
                        setHidden($this,'&controller',controller);
                        setHidden(controller,'&view',null);
                        const result = await originalPull?.call($this, controller);
                        setHidden(controller,'&view',result?.value)
                        return result;
                    }), originalPull ?? ReadableStreamDefaultController);

                    const stream = new _ReadableStream(wrappedSource, strategy);
                    return Object.setPrototypeOf($this, stream);
                }

                return new _ReadableStream(underlyingSource, strategy);
            }), _ReadableStream);

            // Patch getReader to connect BYOB readers with controllers
            const _getReader = $global.ReadableStream.prototype.getReader;
            $global.ReadableStream.prototype.getReader = extend(setStrings(function getReader(options) {
                const reader = _getReader.call(this, options);

                if (options?.mode == 'byob' || this['&mode'] == 'byob') {
                    const _read = reader.read;

                    reader.read = extend(setStrings(async function read(view) {
                        const controller = this['&controller'] ?? reader['&controller'] ?? this['&stream']?.['&controller'];

                        if (controller && view) {
                            setHidden(controller,'&view', view);
                        }

                        const result = await _read.call(this, view);

                        if (controller) {
                            setHidden(controller,'&view', undefined);
                        }
                        if(view){
                            setHidden(this, '&view', view);
                            setHidden(this, '&result', view);
                        }
                        return result;
                    }), _read);
                }

                return reader;
            }), _getReader);
            if(FORCE_POLYFILLS || typeof ReadableByteStreamController === 'undefined'){
                $global.ReadableByteStreamController = setStrings(class ReadableByteStreamController extends ReadableStreamDefaultController{});
            }
        }
    }
})();

    // Log polyfill status
    if (FORCE_POLYFILLS) {
        console.log('[Stream Polyfills] FORCE_POLYFILLS enabled - all shims applied');
    }
})()
