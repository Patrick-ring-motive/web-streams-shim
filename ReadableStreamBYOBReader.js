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
            Object.setPrototypeOf(thisClass.prototype, superClass?.prototype ?? superClass?.constructor?.prototype ?? superClass);
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
        let type = 'function';
        if(String(obj).trim().startsWith('async')){
            type = 'async function';
        }
        if(String(obj).trim().startsWith('class')){
            type = 'class';
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
    if (_closed) {
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

    if (!$global.ReadableStreamBYOBReader) {
        $global.ReadableStreamBYOBReader ??= cloneClass(ReadableStreamDefaultReader);
        Object.defineProperty(ReadableStreamBYOBReader, 'name', {
            value: 'ReadableStreamBYOBReader',
            enumerable: true,
            configurable: true,
            writable: true
        });
        setStrings(ReadableStreamBYOBReader);
        const _getReader = ReadableStream.prototype.getReader;
        ReadableStream.prototype.getReader = Object.setPrototypeOf(function getReader(options) {
            const reader = _getReader.call(this);
            if (options?.mode == 'byob') {
                Object.setPrototypeOf(reader, ReadableStreamBYOBReader);
            }
            return reader;
        }, _getReader);
        extend(ReadableStreamBYOBReader, ReadableStreamDefaultReader);
        const _read = ReadableStreamBYOBReader.prototype.read;
        ReadableStreamBYOBReader.prototype.read = extend(setStrings(async function read(view) {
            // If no view is provided, fall back to default behavior
            if (!view) {
                return _read.call(this, view);
            }
            // Read from the underlying stream (default reader behavior)
            const result = await _read.call(this, view);
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
        }), _read);
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
    if (!supportsReadableStreamBYOBReaderConstructor()) {
        const _ReadableStreamBYOBReader = $global.ReadableStreamBYOBReader;
        const $ReadableStreamBYOBReader = function ReadableStreamBYOBReader(stream) {
            return Object.setPrototypeOf(stream.getReader(), $global.ReadableStreamBYOBReader.prototype);
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
    if (!$global.ReadableStreamBYOBRequest) {

        const protectedProp = (obj, key, value) =>
            Object.defineProperty(obj, `&${key}`, {
                value,
                writable: true,
                enumerable: false,
                configurable: true,
            });

        if (!$global.ReadableStreamBYOBRequest) {

            class ReadableStreamBYOBRequest {
                constructor(controller, view) {
                    protectedProp(this, 'controller', controller);
                    protectedProp(this, 'view', view);
                    protectedProp(this, 'responded', false);
                }

                get view() {
                    return this['&responded'] ? null : this['&view'];
                }

                respond(bytesWritten) {
                    if (this['&responded']) {
                        throw new TypeError('This BYOB request has already been responded to');
                    }
                    this['&responded'] = true;

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
                    this['&responded'] = true;
                    this['&controller'].enqueue(view);
                }
            }

            setStrings(ReadableStreamBYOBRequest);
            $global.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest;

            // Symbols to link streams and controllers
            const $stream = Symbol('*stream');
            const $controller = Symbol('*controller');
            const controllerPendingViews = new WeakMap();

            // Add byobRequest property to default controller
            if (!('byobRequest' in ReadableStreamDefaultController.prototype)) {
                Object.defineProperty(ReadableStreamDefaultController.prototype, 'byobRequest', {
                    get: extend(setStrings(function byobRequest() {
                        const view = controllerPendingViews.get(this);
                        if (view) {
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
                const $this = this;

                if (underlyingSource?.type === 'bytes') {
                    const wrappedSource = Object.assign({}, underlyingSource);
                    const originalStart = underlyingSource.start;
                    const originalPull = underlyingSource.pull;

                    wrappedSource.start = extend(setStrings(function start(controller) {
                        controller[$stream] = $this;
                        $this[$controller] = controller;
                        return originalStart?.call(this, controller);
                    }), originalStart ?? ReadableStreamDefaultController);

                    wrappedSource.pull = extend(setStrings(function pull(controller) {
                        controller[$stream] = $this;
                        $this[$controller] = controller;
                        return originalPull?.call(this, controller);
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

                if (options?.mode === 'byob') {
                    const _read = reader.read;

                    reader.read = extend(setStrings(async function read(view) {
                        const controller = this[$controller] ?? reader[$controller] ?? this[$stream]?.[$controller];

                        if (controller && view) {
                            controllerPendingViews.set(controller, view);
                        }

                        const result = await _read.call(this, view);

                        if (controller) {
                            controllerPendingViews.delete(controller);
                        }

                        return result;
                    }), _read);
                }

                return reader;
            }), _getReader);
            if(typeof ReadableByteStreamController === 'undefined'){
                $global.ReadableByteStreamContoller = setStrings(class ReadableByteStreamContoller extends ReadableStreamDefaultController{});
            }
        }
    }
})();
