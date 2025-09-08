(()=>{
    if (!typeof Request || !typeof Response || !typeof ReadableStream) return;
    const Q = fn => {
            try {
                return fn?.();
            } catch {}
        };
    const $global = Q(()=>globalThis) ?? Q(()=>self) ?? Q(()=>global) ?? Q(()=>window) ?? this;
    const duplexHalf = x => Q(()=>Object.defineProperty(x, 'duplex', {
            value: 'half',
            configurable: true,
            writable: true,
            enumerable: false,
        })) ?? x;
    for(const record of [Request, Response, ReadableStream, Blob]){
        duplexHalf(record.prototype);
    }
    (()=>{
        const _Request = Request;
        const $Request = class Request extends _Request{
          constructor(...args){
            super(...args.map(duplexHalf));
          }
        }
        $global.Request = $Request
    })();
})();
