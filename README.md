## Web Streams Shim

🛶 Web Streams Shim is designed to create parity between the streaming interfaces within modern runtimes. This does not polyfill the interfaces if they are missing entirely. For that you will want [web-streams-polyfill](https://www.npmjs.com/package/web-streams-polyfill) which is not affiliated with the project.

This library provides essential polyfills and shims to ensure modern Web Streams functionality is available and compliant across environments where native support is missing or incomplete, particularly focusing on `ReadableStream`, `Request`, `Response`, and `Blob` objects.

## Install

```html
<script src="https://cdn.jsdelivr.net/npm/web-streams-shim@1.0.4/web-streams-core.js"></script>
```

***

## Key Features and Polyfills

The library focuses on extending core browser APIs to meet the latest Web Stream and Fetch specifications.

### Conditional Filling

Each polyfill performs feature detection before initializing. If a feature is detected as already present then it is skipped so as not to overwrite native behavior where possible.

### ReadableStream Async Iteration

The library adds **comprehensive support for modern JavaScript iteration patterns** to `ReadableStream` and its readers.

| Target | Method/Property | Description |
| :--- | :--- | :--- |
| [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) | [`[Symbol.asyncIterator]`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator) | Allows the stream to be directly iterable in `for-await-of` loops. |
| [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) | `values()` | An alias for `[Symbol.asyncIterator]` for explicit iteration. |

![ReadableStream.asyncIterator](https://caniuse.smokestack.workers.dev/?feature=api.ReadableStream.@@asyncIterator)
![ReadableStream.values](https://caniuse.smokestack.workers.dev/?feature=api.ReadableStream.values)

### Stream Construction Utility

The library adds the static method for creating streams from existing data sources.

| Target | Method/Property | Description |
| :--- | :--- | :--- |
| [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) | [`from(obj)`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/from_static) | **Creates a new `ReadableStream` from any iterable or async iterable object**. It handles both synchronous and asynchronous iterators, including objects that yield `Promise`-like values. |

![ReadableStream.from](https://caniuse.smokestack.workers.dev/?feature=api.ReadableStream.from)

### Body and Bytes Shims

These shims ensure `Request` and `Response` objects (Records) consistently expose their body as a stream and provide the `bytes()` utility.

| Target | Method/Property | Description |
| :--- | :--- | :--- |
| [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request/body) | [`body`](https://developer.mozilla.org/en-US/docs/Web/API/Request/body) | Polyfills the `body` property to return a **`ReadableStream` representation of the body content**. This is crucial for environments where `fetch` exists but streaming is absent. |
| [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response/body)  | [`body`](https://developer.mozilla.org/en-US/docs/Web/API/Response/body) | Provides the body content as a `ReadableStream`. |
| [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request/bytes), [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response/bytes), [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob/bytes) | [`bytes()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) | Adds the `bytes()` method, which **asynchronously returns the object's body/content as a `Uint8Array`**. |

![Request.body](https://caniuse.smokestack.workers.dev/?feature=api.Request.body)
![Response.body](https://caniuse.smokestack.workers.dev/?feature=api.Response.body)
![Request.bytes](https://caniuse.smokestack.workers.dev/?feature=api.Request.bytes)
![Response.bytes](https://caniuse.smokestack.workers.dev/?feature=api.Response.bytes)
![Blob.bytes](https://caniuse.smokestack.workers.dev/?feature=api.Blob.bytes)

### Duplex Compliance Shim

To satisfy modern `fetch` specifications when streaming request bodies, the library ensures compliance for **half-duplex operations**. This is in many ways a reverse shim as it allows legacy code to continue to work in the absence of a duplex parameter that did not exist when the code was implemented.

*   **Property Injection:** The `duplex: 'half'` property is added to the prototypes of `Request`, `Response`, `ReadableStream`, and `Blob`.
*   **Constructor Wrapping:** The global `Request` and `Response` constructors are subclassed and **wrapped** to automatically apply `duplex: 'half'` utility function to all arguments passed during instantiation.
*   **Fetch Wrapping:** The global `fetch` function is **wrapped** to automatically apply `duplex: 'half'` to its arguments before execution, guaranteeing compliance when streams are used in options.

![Request.duplex](https://caniuse.smokestack.workers.dev/?feature=api.Request.duplex)

### ReadableStreamDefaultReader Constructor Support

The library adds support for the `ReadableStreamDefaultReader` constructor.

| Target | Method/Property | Description |
| :--- | :--- | :--- |
| [`ReadableStreamDefaultReader`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader) | [`constructor(stream)`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/ReadableStreamDefaultReader) | **Polyfills the `ReadableStreamDefaultReader` constructor** to accept a stream directly. In environments where the native constructor doesn't support this (like Bun), it delegates to `stream.getReader()` and properly sets up the prototype chain. This allows `new ReadableStreamDefaultReader(stream)` to work consistently across all runtimes. |

![ReadableStreamDefaultReader.constructor](https://caniuse.smokestack.workers.dev/?feature=api.ReadableStreamDefaultReader.constructor)
