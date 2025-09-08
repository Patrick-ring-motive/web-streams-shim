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
        let $Request = Request;
        $Request = class Request extends $Request{
          constructor(...args){
            super(...args.map(duplexHalf));
          }
        }
        $global.Request = $Request;
    })();
    (()=>{
        let $Response = Response;
        $Response = class Response extends $Request{
          constructor(...args){
            super(...args.map(duplexHalf));
          }
        }
        $global.Response = $Response;
    })();
    (()=>{
        const $fetch = fetch;
        $global.fetch = Object.setPrototypeOf(function fetch(...args){
            return $fetch.apply(this,args.map(duplexHalf));
        },$fetch);
    })();
})();
