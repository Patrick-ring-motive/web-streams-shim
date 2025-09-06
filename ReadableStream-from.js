  (() => {
    if(!typeof ReadableStream)return
    const Q = fn => {
      try {
        return fn?.()
      } catch {}
    };
    const close = ctrl => Q(() => ctrl.close());
    const cancel = reader => Q(() => reader.cancel());
    const isPromise = x => x instanceof Promise || x?.constructor?.name === 'Promise' || typeof x?.then === 'function';
    ReadableStream.from ??= Object.setPrototypeOf(function from(obj) {
      let $iter, $readableStream;
      $readableStream = new ReadableStream({
        pull: Object.setPrototypeOf(async function pull(controller) {
          try {
            $iter ??= obj?.[Symbol.iterator]?.() ?? obj?.[Symbol.asyncIterator]?.() ?? [...obj][Symbol.iterator]();
            let chunk = $iter.next();
            if (isPromise(chunk)) {
              chunk = await chunk;
            }
            if (chunk?.done === false) {
              let value = chunk?.value;
              if (isPromise(value)) {
                value = await value;
              }
              controller.enqueue(value);
            } else {
              close(controller);
            }
          } catch (e) {
            close(controller);
            cancel($readableStream);
            throw e;
          }
        }, ReadableStreamDefaultController),
      });
      return $readableStream
    }, ReadableStream);
  })();
