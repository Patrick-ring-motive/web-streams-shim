(() => {
  const Q = fn => {
      try {
        return fn?.()
      } catch {}
    };
  for (const record of [Request, Response, Blob]) {
    (() => {
      record.prototype.bytes ??= Object.setPrototypeOf(async function bytes() {
        return new Uint8Array(await this.arrayBuffer());
      }, Uint8Array);
    })();
  };
})();
    
