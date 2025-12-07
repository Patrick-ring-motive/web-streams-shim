
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
    
    for (const record of [Q(() => Request), Q(() => Response)]) {
        (() => {
            while(record.__proto__.name === record.name) record = record.__proto__;
            (record?.prototype ?? {}).stream ??= extend(setStrings(function stream() {
                return this.body;
            }), Q(() => ReadableStream) ?? {});
        })();
    }
    for (const record of [Q(() => Request), Q(() => Response),Q(()=>Blob)]) {
        (() => {
            while(record.__proto__.name === record.name) record = record.__proto__;
            (record?.prototype ?? {})[Symbol.asyncIterator] ??= extend(setStrings(function stream() {
                return this.body;
            }), Q(() => ReadableStream) ?? {});
        })();
    }
    if(!('body' in Blob.prototype)){
      Object.defineProperty(Blob.prototype,'body',{
        get:extend(setStrings(function body(){return this.stream();},ReadableStream)),
        set:()=>{},
        configurable:true,
        enumerable:true
      });
    }
    if(!('bodyUsed' in Blob.prototype)){
         Object.defineProperty(record.prototype, "bodyUsed", {
           get:setStrings(function bodyUsed(){
             return this.body?.locked;
           }),
           set:()=>{},
           configurable:true,
           enumerable:true
         });
    }
    Blob.prototype.blob ?? = extend(setStrings(function blob(){
        return this;
    }),Blob);
    Blob.prototype.clone ?? = extend(setStrings(function clone(){
        return this.slice();
    }),Blob);
    Blob.prototype.formData ?? = extend(setStrings(function formData(){
        return new Response(this).formData();
    }),FormData);
    Blob.prototype.json ?? = extend(setStrings(function json(){
        return new Response(this).json();
    }),JSON);
})();
