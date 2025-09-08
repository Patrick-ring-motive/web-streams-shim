(()=>{
    if (!typeof Request || !typeof Response || !typeof ReadableStream) return;
    for(const record of [Request, Response, ReadableStream, Blob]){
        Object.defineProperty(record.prototype, 'duplex', {
            value: 'half',
            configurable: true,
            writable: true,
            enumerable: false,
        });
    }
})();
