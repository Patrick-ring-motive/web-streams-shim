/**

- Polyfill for the body property on Request and Response objects
- Creates a ReadableStream body property when the native implementation doesn’t provide one
- This handles environments where fetch API exists but body streams are not implemented
  */
  (() => {
  // Early return if required APIs are not available
  if (!typeof Request || !typeof Response || !typeof ReadableStream) return;

/**

- Safely executes a function and catches any errors
- @param {Function} fn - Function to execute
- @returns {*} The result of fn() or undefined if an error occurred
  */
  const Q = fn => {
  try {
  return fn?.();
  } catch {}
  };

/**

- Internal class to manage streaming components for body property
- Keeps track of cloned record, blob conversion, stream, and reader state
- @private
  */
  class StreamParts {
  /** @type {Request|Response} The cloned request/response record */
  record;
  /** @type {ReadableStream} The body stream */
  body;
  /** @type {Blob|Promise<Blob>} The blob representation */
  blob;
  /** @type {ReadableStream} The blob’s stream */
  stream;
  /** @type {ReadableStreamDefaultReader} The stream reader */
  reader;
  }

/**

- Safely closes a ReadableStream controller
- @param {ReadableStreamDefaultController} ctrl - The controller to close
  */
  const close = ctrl => Q(() => ctrl.close());

/**

- Safely cancels a ReadableStream or ReadableStreamReader
- @param {ReadableStream|ReadableStreamDefaultReader} reader - The stream or reader to cancel
  */
  const cancel = reader => Q(() => reader.cancel());

/**

- Safely releases the lock on a ReadableStream reader
- @param {ReadableStreamDefaultReader} reader - The reader to release
  */
  const releaseLock = reader => Q(() => reader.releaseLock());

/**

- Checks if a value is a Promise-like object
- @param {*} x - Value to check
- @returns {boolean} True if the value appears to be a Promise
  */
  const isPromise = x =>
  x instanceof Promise ||
  x?.constructor?.name === ‘Promise’ ||
  typeof x?.then === ‘function’;

// Apply body property polyfill to Request and Response
for (const record of [Request, Response]) {
(() => {
// Test if body property already works correctly
if (new record(“https://example.com”, {
method: “POST”,
body: “test”
}).body) {
return;
}

```
  /**
   * Polyfill implementation of the body property getter
   * Creates a ReadableStream from the request/response body content
   * Uses WeakMap to associate stream parts with each request/response instance
   */
  Object.defineProperty(record.prototype, "body", {
    get: (() => {
      // WeakMap to store StreamParts for each request/response instance
      // Fallback to Map if WeakMap is not available
      const $bodies = new (globalThis.WeakMap ?? Map);

      /**
       * Body property getter function
       * @returns {ReadableStream|null} The body as a ReadableStream, or null for GET/HEAD requests
       * @note Sets ReadableStream as the prototype of the body function for better runtime type traceability
       * @example
       * // Usage with Request
       * const req = new Request('/api', { method: 'POST', body: 'data' });
       * const stream = req.body; // ReadableStream
       * 
       * // Usage with Response
       * const res = new Response('hello world');
       * const stream = res.body; // ReadableStream
       * const reader = stream.getReader();
       */
      return Object.setPrototypeOf(function body() {
        // GET and HEAD requests have no body
        if (/GET|HEAD/.test(this.method)) return null;

        // Get or create StreamParts for this instance
        const $streamParts = $bodies.get(this) ?? new StreamParts();
        $bodies.set(this, $streamParts);

        // Clone the original request/response to avoid consuming the original
        $streamParts.record ??= this.clone();

        // Create the body stream if it doesn't exist
        $streamParts.body ??= new ReadableStream({
          /**
           * Start method for the ReadableStream
           * Converts the body to a blob, then streams its content
           * @param {ReadableStreamDefaultController} controller - Stream controller
           */
          start: Object.setPrototypeOf(async function start(controller) {
            try {
              // Convert body to blob if not already done
              $streamParts.blob ??= $streamParts.record.blob();
              
              // Await blob conversion if it's a promise
              if (isPromise($streamParts.blob)) {
                $streamParts.blob = await $streamParts.blob;
              }

              // Get stream from blob and create reader
              $streamParts.stream ??= $streamParts.blob.stream();
              $streamParts.reader ??= $streamParts.stream.getReader();

              // Read all chunks from the blob stream and enqueue them
              let chunk = await $streamParts.reader.read();
              while (chunk?.done === false) {
                controller.enqueue(chunk?.value);
                chunk = await $streamParts.reader.read();
              }
            } catch (e) {
              console.error(e);
            } finally {
              // Clean up resources
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
```

}
})();
