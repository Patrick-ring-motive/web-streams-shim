(() => {
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


    if (!supportsReadableStreamDefaultReaderConstructor()) {
        const _ReadableStreamDefaultReader = ReadableStreamDefaultReader;
        const $ReadableStreamDefaultReader = function ReadableStreamDefaultReader(stream) {
            return stream.getReader();
        };
        setString($ReadableStreamDefaultReader);
        extend($ReadableStreamDefaultReader, _ReadableStreamDefaultReader);
        globalThis.ReadableStreamDefaultReader = new Proxy($ReadableStreamDefaultReader, {
            construct(_, [stream]) {
                return $ReadableStreamDefaultReader(stream);
            }
        });
    }

})();
