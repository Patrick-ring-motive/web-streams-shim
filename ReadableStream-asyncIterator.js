  (() => {
    if(!typeof ReadableStream)return;
    const Q = fn => {
      try {
        return fn?.()
      } catch {}
    };
    (() => {
      ReadableStreamDefaultReader.prototype.next ?? Object.defineProperty(ReadableStreamDefaultReader.prototype,'next',{
        value:Object.setPrototypeOf(function next() {
          return this.read();
        }, ReadableStreamDefaultReader.prototype.read),
        configurable:true,
        writable:true,
        enumerable:false,
      });                                                                                                                
    })();
    (() => {
      ReadableStreamDefaultReader.prototype[Symbol.asyncIterator] ??= Object.setPrototypeOf(function asyncIterator() {
        return this;
      }, ReadableStreamDefaultReader);
    })();
    (() => {
      class StreamEnd{
        done = true;
        value;
        constructor(value){
          this.value = value;
        }
      }
      (()=>{
      ReadableStreamDefaultReader.prototype['return'] ?? Object.defineProperty(ReadableStreamDefaultReader.prototype,'return',{
        value: Object.setPrototypeOf(function release(reason) {
        Q(() => this.cancel?.(reason));
        Q(() => this.releaseLock?.());
        return new StreamEnd(reason);
      }, ReadableStreamDefaultReader.prototype.releaseLock),
        configurable:true,
        writable:true,
        enumerable:false,
      });
    })();
      (()=>{
      ReadableStreamDefaultReader.prototype['throw'] ?? Object.defineProperty(ReadableStreamDefaultReader.prototype,'throw',{
        value: Object.setPrototypeOf(function release(reason) {
        Q(() => this.cancel?.(reason));
        Q(() => this.releaseLock?.());
        return new StreamEnd(reason);
      }, ReadableStreamDefaultReader.prototype.cancel),
        configurable:true,
        writable:true,
        enumerable:false,
      });
    })();
    })();
    (() => {
      const $readers = new(globalThis.WeakMap ?? Map);
      Object.setPrototypeOf(ReadableStream.prototype.getReader,ReadableStreamDefaultReader);
      ReadableStream.prototype[Symbol.asyncIterator] ??= Object.setPrototypeOf(function asyncIterator() {
        const $reader = $readers.get(this) ?? Q(() => this?.getReader?.());
        $readers.set(this, $reader);
        return $reader;
      }, ReadableStream.prototype.getReader);
      ReadableStream.prototype.values ??= Object.setPrototypeOf(function values() {
        return this[Symbol.asyncIterator]();
      }, ReadableStream.prototype[Symbol.asyncIterator]);
    })();
  })();
