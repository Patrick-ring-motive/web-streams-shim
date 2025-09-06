(() => {
  const Q = fn => {
      try {
        return fn?.()
      } catch {}
    };
  for (const record of [Q(()=>Request), Q(()=>Response),Q(()=>Blob)]) {
    (() => {
      (record?.prototype??{}).bytes ??= Object.setPrototypeOf(async function bytes() {
        return new Uint8Array(await this.arrayBuffer());
      }, Q(()=>Uint8Array)??{});
    })();
  };
})();
    
