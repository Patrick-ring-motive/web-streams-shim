  (() => {
    if(!typeof Request || !typeof Response || !typeof ReadableStream)return;
    const Q = fn => {
      try {
        return fn?.()
      } catch {}
    };
    class StreamParts{
      record;
      body;
      blob;
      stream;
      reader;
    };
    const close = ctrl => Q(() => ctrl.close());
    const cancel = reader => Q(() => reader.cancel());
    const releaseLock = reader => Q(() => reader.releaseLock());
    const isPromise = x => x instanceof Promise || x?.constructor?.name === 'Promise' || typeof x?.then === 'function';
    for (const record of [Request, Response]) {
      (() => {
        if (new record("https://example.com", {
            method: "POST",
            body: "test"
          }).body) {
          return
        };
        Object.defineProperty(record.prototype, "body", {
          get: (() => {
            const $bodies = new(globalThis.WeakMap ?? Map);
            return Object.setPrototypeOf(function body() {
              if (/GET|HEAD/.test(this.method)) return null;
              const $streamParts = $bodies.get(this) ?? new StreamParts();
              $bodies.set(this,$streamParts);
              $streamParts.record ??= this.clone();
              $streamParts.body ??= new ReadableStream({
                start: Object.setPrototypeOf(async function start(controller) {
                  try {
                    $streamParts.blob ??= $streamParts.record.blob();
                    if (isPromise($streamParts.blob)) {
                      $streamParts.blob = await $streamParts.blob;
                    }
                    $streamParts.stream ??= $streamParts.blob.stream();
                    $streamParts.reader ??= $streamParts.stream.getReader();
                    let chunk = await $streamParts.reader.read();
                    while (chunk?.done === false) {
                      controller.enqueue(chunk?.value);
                      chunk = await $streamParts.reader.read();
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    releaseLock($streamParts.reader);
                    close(controller);
                    cancel($streamParts.reader);
                    cancel($streamParts.stream);
                  }
                }, ReadableStreamDefaultController),
              });
              return $streamParts.body;
            }, ReadableStream);
          })(),
          configurable: true,
          enumerable: true,
        });
      })();
    }
  })();
