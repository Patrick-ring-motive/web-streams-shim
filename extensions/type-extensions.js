/**
 * Type Extensions - Sets up prototype chains for Web API methods
 * Extends methods on Request, Response, and Blob to inherit from the class
 * of the type they return (e.g., Response.prototype.blob extended with Blob)
 * This provides better runtime type traceability and debugging experience
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

    /**
     * Map of method names to their return type constructors
     * Methods that return specific types get extended with those types' prototypes
     */
    const typeMap = {
        blob: Q(() => Blob),
        text: Q(() => TextDecoder),
        json: Q(() => JSON),
        arrayBuffer: Q(() => ArrayBuffer),
        stream: Q(() => ReadableStream),
        formData: Q(() => FormData),
        bytes: Q(() => Uint8Array),
        slice: Q(() => Blob)
    };

    /**
     * Map of getter property names to their return type constructors
     */
    const getterMap = {
        url: Q(() => URL),
        headers: Q(() => Headers),
        body: Q(() => ReadableStream)
    };

    /**
     * Extend methods on Request, Response, and Blob prototypes
     * to inherit from their return type constructors
     */
    for (const record of [Q(() => Request), Q(() => Response), Q(() => Blob)]) {
        if (!record) continue;

        // Extend methods that return typed values
        for (const [methodName, TypeClass] of Object.entries(typeMap)) {
            const method = record.prototype?.[methodName];
            if (method && TypeClass) {
                try {
                    extend(method, TypeClass);
                } catch (e) {
                    console.warn(`Failed to extend ${record.name}.prototype.${methodName}`, e);
                }
            }
        }

        // Extend getter properties
        for (const [propName, TypeClass] of Object.entries(getterMap)) {
            const descriptor = Object.getOwnPropertyDescriptor(record.prototype, propName);
            if (descriptor?.get && TypeClass) {
                try {
                    extend(descriptor.get, TypeClass);
                } catch (e) {
                    console.warn(`Failed to extend ${record.name}.prototype.${propName} getter`, e);
                }
            }
        }
    }

    // Also extend ArrayBuffer methods if present
    const arrayBufferMethods = {
        bytes: Q(() => Uint8Array),
        slice: Q(() => ArrayBuffer)
    };

    if (Q(() => ArrayBuffer)) {
        for (const [methodName, TypeClass] of Object.entries(arrayBufferMethods)) {
            const method = ArrayBuffer.prototype?.[methodName];
            if (method && TypeClass) {
                try {
                    extend(method, TypeClass);
                } catch (e) {
                    console.warn(`Failed to extend ArrayBuffer.prototype.${methodName}`, e);
                }
            }
        }
    }
})();

