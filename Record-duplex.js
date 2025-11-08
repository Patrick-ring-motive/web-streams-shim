/**

- Shim for duplex property on fetch-related objects
- Adds duplex: ‘half’ property to objects to satisfy newer fetch specifications
- that require this property when using ReadableStreams as request bodies
- @see https://fetch.spec.whatwg.org/#request-duplex
  */
(() => {
    // Early return if required APIs are not available
    if ([typeof Request,typeof Response,typeof ReadableStream].includes('undefined')) return;
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

    - Gets the global object across different environments
    - Tries globalThis, self, global, window, and falls back to ‘this’
    - @type {object} The global object
      */
    const $global = Q(() => globalThis) ?? Q(() => self) ?? Q(() => global) ?? Q(() => window) ?? this;

    /**

    - Adds duplex: ‘half’ property to an object
    - This property indicates the object supports half-duplex streaming
    - Required by newer fetch specifications when using ReadableStreams as request bodies
    - @param {*} x - The object to add the duplex property to
    - @returns {*} The original object (for chaining) or the object if property addition fails
    - @example
    - const stream = new ReadableStream();
    - duplexHalf(stream); // Adds stream.duplex = ‘half’
      */
    const duplexHalf = x => Q(() => Object.defineProperty(x, 'duplex', {
        value: 'half',
        configurable: true,
        writable: true,
        enumerable: false,
    })) ?? x;

    /**

    - Add duplex property to prototypes of fetch-related classes
    - This ensures all instances have the duplex property available
      */
    for (const record of [Request, Response, ReadableStream, Blob]) {
        duplexHalf(record.prototype);
    }

    /**

    - Wrap Request constructor to automatically add duplex property to arguments
    - Creates a new Request class that extends the original but processes arguments
      */
    (() => {
        let $Request = Request;


        /**
         * Enhanced Request constructor that adds duplex property to all arguments
         * Maintains full compatibility with original Request while ensuring duplex compliance
         * @extends Request
         * @example
         * const req = new Request('/api', { 
         *   method: 'POST', 
         *   body: new ReadableStream() 
         * }); // ReadableStream automatically gets duplex: 'half'
         */
        $Request = class Request extends $Request {
            constructor(...args) {
                super(...args.map(duplexHalf));
            }
        };

        $global.Request = $Request;


    })();

    /**

    - Wrap Response constructor to automatically add duplex property to arguments
    - Creates a new Response class that extends the original but processes arguments
      */
    (() => {
        const $Response = Response;


        /**
         * Enhanced Response constructor that adds duplex property to all arguments
         * Maintains full compatibility with original Response while ensuring duplex compliance
         * @extends Response
         * @example
         * const res = new Response(new ReadableStream()); 
         * // ReadableStream automatically gets duplex: 'half'
         */
        const _Response = class Response extends $Response {
            constructor(...args) {
                super(...args.map(duplexHalf));
            }
        };

        $global.Response = _Response;


    })();

    /**

    - Wrap fetch function to automatically add duplex property to arguments
    - Ensures fetch calls work with ReadableStreams without manual duplex setting
      */
    (() => {
        const $fetch = fetch;


        /**
         * Enhanced fetch function that adds duplex property to all arguments
         * Maintains full compatibility with original fetch while ensuring duplex compliance
         * @param {...*} args - Arguments to pass to fetch (URL, options, etc.)
         * @returns {Promise<Response>} Promise that resolves to a Response
         * @note Sets original fetch as prototype for better runtime type traceability
         * @example
         * fetch('/api', {
         *   method: 'POST',
         *   body: new ReadableStream() // Automatically gets duplex: 'half'
         * });
         */
        $global.fetch = extend(function fetch(...args) {
            return $fetch.apply(this, args.map(duplexHalf));
        }, $fetch);


    })();
})();
