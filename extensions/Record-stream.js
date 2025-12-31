/**
 * Record Stream Extensions - Minimal stream() method polyfills
 * 
 * Adds stream() method to Request, Response, and Blob objects as a convenient
 * alias for the .body property. This is a lightweight alternative to the full
 * web-streams-extensions.js that only adds the stream() method.
 * 
 * Also adds Blob.body property for API consistency with Request/Response.
 * 
 * Use this instead of web-streams-extensions.js when you only need the
 * stream() alias and don't want the other non-standard extensions.
 * 
 * @note Non-standard convenience method
 */
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
    
    for (const record of [Q(() => Request), Q(() => Response)]) {
        (() => {
            let currentRecord = record;
            while(currentRecord.__proto__.name === currentRecord.name) {
                currentRecord = currentRecord.__proto__;
            }
            (currentRecord?.prototype ?? {}).stream ??= extend(setStrings(function stream() {
                return this.body;
            }), Q(() => ReadableStream) ?? {});
        })();
    }
    if(!('body' in Blob.prototype)){
      Object.defineProperty(Blob.prototype,'body',{
        get:extend(setStrings(function body(){return this.stream();})),
        set:()=>{},
        configurable:true,
        enumerable:false
      });
    }
})();
