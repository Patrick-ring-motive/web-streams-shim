/**
 * Web Streams Extensions - Non-standard convenience methods
 * 
 * Adds helpful extensions to Web API objects that aren't part of standard specs
 * but provide useful functionality and API consistency:
 * 
 * - Request/Response.stream() - Alias for .body
 * - Request/Response/Blob async iteration - Direct iteration over body content
 * - Blob.body and Blob.bodyUsed - Match Request/Response API surface
 * - Blob helper methods - blob(), clone(), formData(), json()
 * - ArrayBuffer iteration - bytes(), Symbol.iterator, values()
 * 
 * These extensions are safe to use in modern browsers and serverless environments
 * (Cloudflare Workers, Vercel Edge, Deno Deploy, etc.) where they fill API gaps.
 * 
 * @note These are INTENTIONALLY non-standard convenience methods
 */
(() => {
    const Q = fn => {
        try {
            return fn?.()
        } catch {}
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
    const setHidden = (obj, prop, value) => {
        Object.defineProperty(obj, prop, {
            value,
            writable: true,
            enumerable: false,
            configurable: true
        });
    };

    // Add stream() method to Request and Response as an alias for .body
    // Provides a consistent method-based API alongside the property
    for (const record of [Q(() => Request), Q(() => Response)]) {
        (() => {
            let currentRecord = record;
            while (currentRecord.__proto__.name === currentRecord.name) {
                currentRecord = currentRecord.__proto__;
            }
            (currentRecord?.prototype ?? {}).stream ??= extend(setStrings(function stream() {
                return this.body;
            }), Q(() => ReadableStream) ?? {});
        })();
    }
    
    // Add async iteration support to Request, Response, and Blob
    // Allows: for await (const chunk of response) { ... }
    for (const record of [Q(() => Request), Q(() => Response), Q(() => Blob)]) {
        (() => {
            let currentRecord = record;
            while (currentRecord.__proto__.name === currentRecord.name) {
                currentRecord = currentRecord.__proto__;
            }
            currentRecord.prototype[Symbol.asyncIterator] ??= extend(setStrings(Object.defineProperty(function asyncIterator() {
                return this.stream()[Symbol.asyncIterator]();
            }, 'name', {
                value: 'Symbol.asyncIterator',
                configurable: true,
                writable: true,
                enumerable: true,
            })), ReadableStream.prototype[Symbol.asyncIterator]);
            currentRecord.prototype.values ??= extend(setStrings(function values() {
                return this[Symbol.asyncIterator]();
            }), ReadableStream.prototype.values);
        })();
    }
    
    // Add body property to Blob to match Request/Response API
    // Blob.body returns a ReadableStream of the blob content
    if (!('body' in Blob.prototype)) {
        Object.defineProperty(Blob.prototype, 'body', {
            get: extend(setStrings(function body() {
                return this.stream();
            })),
            set: () => {},
            configurable: true,
            enumerable: true
        });
    }
    
    // Add bodyUsed property to Blob to match Request/Response API
    // Returns true if the body stream is locked (being read)
    if (!('bodyUsed' in Blob.prototype)) {
        Object.defineProperty(Blob.prototype, "bodyUsed", {
            get: setStrings(function bodyUsed() {
                return this.body?.locked;
            }),
            set: () => {},
            configurable: true,
            enumerable: true
        });
    }
    
    // Blob helper methods for consistency with Body mixin API
    // blob() - Returns self (for API consistency)
    Blob.prototype.blob ??= extend(setStrings(function blob() {
        return this;
    }), Blob);
    
    // clone() - Returns a new Blob with same content (uses slice)
    Blob.prototype.clone ??= extend(setStrings(function clone() {
        return this.slice();
    }), Blob);
    
    // formData() - Parse blob as FormData (delegates to Response)
    Blob.prototype.formData ??= extend(setStrings(function formData() {
        return new Response(this).formData();
    }), FormData);
    
    // json() - Parse blob as JSON (delegates to Response)
    Blob.prototype.json ??= extend(setStrings(function json() {
        return new Response(this).json();
    }), JSON);
    
    // ArrayBuffer extensions for iteration and byte access
    // bytes() - Convert ArrayBuffer to Uint8Array view
    ArrayBuffer.prototype.bytes ??= extend(setStrings(function bytes() {
        return new Uint8Array(this);
    }), Uint8Array);
    
    // Make ArrayBuffer iterable (yields bytes)
    // Allows: for (const byte of arrayBuffer) { ... }
    ArrayBuffer.prototype[Symbol.iterator] ??= extend(setStrings(Object.defineProperty(function iterator() {
                return this.bytes()[Symbol.iterator]();
            }, 'name', {
                value: 'Symbol.iterator',
                configurable: true,
                writable: true,
                enumerable: true,
            })), Uint8Array.prototype[Symbol.iterator]);
    
    // values() - Iterator over bytes (alias for Symbol.iterator)
    ArrayBuffer.prototype.values ??= extend(setStrings(function values() {
        return this[Symbol.iterator]();
    }), Uint8Array.prototype.values);
    
    // SharedArrayBuffer extensions for iteration and byte access
    if (Q(() => SharedArrayBuffer)) {
        // bytes() - Convert SharedArrayBuffer to Uint8Array view
        SharedArrayBuffer.prototype.bytes ??= extend(setStrings(function bytes() {
            return new Uint8Array(this);
        }), Uint8Array);
        
        // Make SharedArrayBuffer iterable (yields bytes)
        // Allows: for (const byte of sharedArrayBuffer) { ... }
        SharedArrayBuffer.prototype[Symbol.iterator] ??= extend(setStrings(Object.defineProperty(function iterator() {
                    return this.bytes()[Symbol.iterator]();
                }, 'name', {
                    value: 'Symbol.iterator',
                    configurable: true,
                    writable: true,
                    enumerable: true,
                })), Uint8Array.prototype[Symbol.iterator]);
        
        // values() - Iterator over bytes (alias for Symbol.iterator)
        SharedArrayBuffer.prototype.values ??= extend(setStrings(function values() {
            return this[Symbol.iterator]();
        }), Uint8Array.prototype.values);
    }
    
    // ReadableStream constructor and from() fallbacks
    // Ensures streams can be created even in limited environments
    
    const _ReadableStream = Q(() => ReadableStream);
    const _ReadableStreamConstructor = _ReadableStream;
    
    // Fallback ReadableStream constructor: tries constructor, then Response.body
    if (_ReadableStream && !$global['&ReadableStreamFallback']) {
        setHidden($global, '&ReadableStreamFallback', extend(setStrings(function ReadableStream(underlyingSource, strategy) {
            try {
                return new _ReadableStreamConstructor(underlyingSource, strategy);
            } catch (e) {
                // Fallback: create via Response
                const response = new Response(new Blob([]), { status: 200 });
                return response.body;
            }
        }), _ReadableStream));
    }
    
    // Fallback ReadableStream.from: tries from, then constructor, then Response.body
    if (_ReadableStream && typeof _ReadableStream.from !== 'function') {
        _ReadableStream.from = extend(setStrings(function from(iterable) {
            // Try constructor with async iterable source
            try {
                return new _ReadableStreamConstructor({
                    async start(controller) {
                        try {
                            for await (const chunk of iterable) {
                                controller.enqueue(chunk);
                            }
                            controller.close();
                        } catch (e) {
                            controller.error(e);
                        }
                    }
                });
            } catch (e) {
                // Fallback: convert to blob then get body
                const chunks = [];
                const isAsync = iterable[Symbol.asyncIterator];
                
                if (isAsync) {
                    return (async () => {
                        for await (const chunk of iterable) {
                            chunks.push(chunk);
                        }
                        const blob = new Blob(chunks);
                        const response = new Response(blob);
                        return response.body;
                    })();
                } else {
                    for (const chunk of iterable) {
                        chunks.push(chunk);
                    }
                    const blob = new Blob(chunks);
                    const response = new Response(blob);
                    return response.body;
                }
            }
        }), _ReadableStream);
    }
    
    // ReadableStream helper methods - Match Blob/Body API for convenience
    // These consume the stream and return parsed content
    
    // text() - Consume stream and decode as UTF-8 text
    ReadableStream.prototype.text ??= extend(setStrings(async function text() {
        return await new Response(this).text();
    }), TextDecoder);
    
    // json() - Consume stream and parse as JSON
    ReadableStream.prototype.json ??= extend(setStrings(async function json() {
        return await new Response(this).json();
    }), JSON);
    
    // arrayBuffer() - Consume stream and collect as ArrayBuffer
    ReadableStream.prototype.arrayBuffer ??= extend(setStrings(async function arrayBuffer() {
        return await new Response(this).arrayBuffer();
    }), ArrayBuffer);
    
    // sharedArrayBuffer() - Consume stream and collect as SharedArrayBuffer for cross-worker sharing
    ReadableStream.prototype.sharedArrayBuffer ??= extend(setStrings(async function sharedArrayBuffer() {
        const buffer = await new Response(this).arrayBuffer();
        const shared = new SharedArrayBuffer(buffer.byteLength);
        new Uint8Array(shared).set(new Uint8Array(buffer));
        return shared;
    }), Q(() => SharedArrayBuffer) ?? ArrayBuffer);
    
    // blob() - Consume stream and create Blob
    ReadableStream.prototype.blob ??= extend(setStrings(async function blob() {
        return await new Response(this).blob();
    }), Blob);
    
    // bytes() - Consume stream and return Uint8Array
    ReadableStream.prototype.bytes ??= extend(setStrings(async function bytes() {
        return await new Response(this).bytes();
    }), Uint8Array);
    
    // formData() - Consume stream and parse as FormData
    ReadableStream.prototype.formData ??= extend(setStrings(async function formData() {
        return await new Response(this).formData();
    }), FormData);
    
    // clone() - Create a copy of the stream using tee()
    ReadableStream.prototype.clone ??= extend(setStrings(function clone() {
        return new Response(this);
    }), ReadableStream);
    
    // stream() - Returns self (for API consistency)
    ReadableStream.prototype.stream ??= extend(setStrings(function stream() {
        return this;
    }), ReadableStream);
    
    // body - Getter that returns self (for API consistency with Request/Response)
    if (!('body' in ReadableStream.prototype)) {
        Object.defineProperty(ReadableStream.prototype, 'body', {
            get: extend(setStrings(function body() {
                return this;
            })),
            set: () => {},
            configurable: true,
            enumerable: true
        });
    }
    
    // Advanced parsing methods for Request, Response, Blob, and ReadableStream
    
    // sharedArrayBuffer() - Consume and return as SharedArrayBuffer for cross-worker sharing
    for (const record of [Q(() => Request), Q(() => Response), Q(() => Blob), Q(() => ReadableStream)]) {
        if (!record) continue;
        record.prototype.sharedArrayBuffer ??= extend(setStrings(async function sharedArrayBuffer() {
            const buffer = await this.arrayBuffer();
            const shared = new SharedArrayBuffer(buffer.byteLength);
            new Uint8Array(shared).set(new Uint8Array(buffer));
            return shared;
        }), Q(() => SharedArrayBuffer) ?? ArrayBuffer);
    }
    
    // dataView() - Consume and return as DataView for binary data manipulation
    for (const record of [Q(() => Request), Q(() => Response), Q(() => Blob), Q(() => ReadableStream)]) {
        if (!record) continue;
        record.prototype.dataView ??= extend(setStrings(async function dataView() {
            const buffer = await this.arrayBuffer();
            return new DataView(buffer);
        }), DataView);
    }
    
    // searchParams() - Parse content as URL search parameters
    for (const record of [Q(() => Request), Q(() => Response), Q(() => Blob), Q(() => ReadableStream)]) {
        if (!record) continue;
        record.prototype.searchParams ??= extend(setStrings(async function searchParams() {
            const text = await this.text();
            return new URLSearchParams(text);
        }), URLSearchParams);
    }
    
    // file() - Convert to File object with optional filename and options
    for (const record of [Q(() => Request), Q(() => Response), Q(() => Blob), Q(() => ReadableStream)]) {
        if (!record) continue;
        record.prototype.file ??= extend(setStrings(async function file(filename = 'file', options = {}) {
            const blob = await this.blob();
            const FileConstructor = Q(() => File);
            options = {
                    type: blob.type || options.type,
                    lastModified: options.lastModified || Date.now(),
                    ...options
            };
            filename = Object.assign(new String(filename),options);
            if (FileConstructor) {
                return new FileConstructor([blob], filename, filename);
            }
            return blob;
        }), Q(() => File) ?? Q(() => Blob));
    }
    
    // Make DataView iterable (yields bytes)
    // Allows: for (const byte of dataView) { ... }
    if (!DataView.prototype[Symbol.iterator]) {
        DataView.prototype[Symbol.iterator] = extend(setStrings(Object.defineProperty(function* iterator() {
            for (let i = 0; i < this.byteLength; i++) {
                yield this.getUint8(i);
            }
        }, 'name', {
            value: 'Symbol.iterator',
            configurable: true,
            writable: true,
            enumerable: true,
        })), Uint8Array.prototype[Symbol.iterator]);
    }
    
    // values() - Iterator over bytes in DataView
    DataView.prototype.values ??= extend(setStrings(function values() {
        return this[Symbol.iterator]();
    }), Uint8Array.prototype.values);
    
    // bytes() - Convert DataView to Uint8Array
    DataView.prototype.bytes ??= extend(setStrings(function bytes() {
        return new Uint8Array(this.buffer, this.byteOffset, this.byteLength);
    }), Uint8Array);
})();
