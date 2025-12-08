(() => {
    const Q = fn => {
        try {
            return fn?.()
        } catch {}
    };
    const $global = Q(()=>globalThis) ?? Q(()=>global) ?? Q(()=>self) ?? Q(()=>window) ?? this;
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

    const assign = (target,source) =>{
        const props = Object.getOwnPropertyDescriptors(source);
        for(const key in props){
            try{
                Object.defineProperty(target,key,props[key]);
            }catch(e){
                console.warn(e,key,props[key]);
            }
        }
        for(const key in source){
            try{
                target[key] ??= source[key];
            }catch(e){
                console.warn(e,key,props[key]);
            }
        }
        return target;
    };

    const cloneClass = $class =>{
        const clonePrototype = assign({},$class.prototype);
        const clone = $class.bind(clonePrototype);
        assign(clone,$class);
        clone.prototype = Object.setPrototypeOf(clonePrototype,Object.getPrototypeOf($class.prototype));
        Object.setPrototypeOf(clone,Object.getPrototypeOf($class));
        return clone;
    };
    if(!$global.ReadableStreamBYOBReader){
      $global.ReadableStreamBYOBReader ??= cloneClass(ReadableStreamDefaultReader);
      Object.defineProperty(ReadableStreamBYOBReader,'name',{
        value:'ReadableStreamBYOBReader',
        enumerable:true,
        configurable:true,
        writable:true
      });
      setStrings(ReadableStreamBYOBReader);
      const _getReader = ReadableStream.prototype.getReader;
      ReadableStream.prototype.getReader = Object.setPrototypeOf(function getReader(options){
          const reader = _getReader.call(this);
          if(options?.mode == 'byob'){
              Object.setPrototypeOf(reader,ReadableStreamBYOBReader);
          }
          return reader;
      },_getReader);
    }
    const _read = ReadableStreamBYOBReader.prototype.read;
    ReadableStreamBYOBReader.prototype.read = extend(setStrings(async function read(view,options){
        const chunk = await _read.call(this);
        // wut
        return chunk;
    })),_read);
    const supportsReadableStreamBYOBReaderConstructor = () => {
        try {
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue('test');
                    controller.close();
                },
                type:'bytes'
            });
            const reader = new ReadableStreamBYOBReader(stream);
            reader.read();
            return true;
        } catch {
            return false;
        }
    }


    if (!supportsReadableStreamBYOBReaderConstructor()) {
        const _ReadableStreamBYOBReader = $global.ReadableStreamBYOBReader;
        const $ReadableStreamBYOBReader = function ReadableStreamBYOBReader(stream) {
            return Object.setPrototypeOf(stream.getReader(), $global.ReadableStreamBYOBReader.prototype);
        };
        setStrings($ReadableStreamBYOBReader);
        extend($ReadableStreamBYOBReader, _ReadableStreamBYOBReader);
        $global.ReadableStreamBYOBReader = new Proxy($ReadableStreamBYOBReader, Object.setPrototypeOf({
            construct:Object.setPrototypeOf(function construct(_, [stream]) {
                return $ReadableStreamBYOBReader(stream);
            },$ReadableStreamBYOBReader.prototype)
        },$ReadableStreamBYOBReader));
        $global.ReadableStreamBYOBReader.prototype.constructor = $global.ReadableStreamBYOBReader;
    }

})();
