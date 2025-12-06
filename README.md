## Web Streams Shim Library

This README provides an overview of the features in this Web Streams Shim Library, which is designed to create parity between the streaming interfaces within modern runtimes.

This library provides essential polyfills and shims to ensure modern Web Streams functionality is available and compliant across environments where native support is missing or incomplete, particularly focusing on `ReadableStream`, `Request`, `Response`, and `Blob` objects.

***

## Key Features and Polyfills

The library focuses on extending core browser APIs to meet the latest Web Stream and Fetch specifications.

### 1. ReadableStream Async Iteration

The library adds **comprehensive support for modern JavaScript iteration patterns** to `ReadableStream` and its readers.

| Target | Method/Property | Description |
| :--- | :--- | :--- |
| [`ReadableStream.prototype`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) | `[Symbol.asyncIterator]` | Allows the stream to be directly iterable in `for-await-of` loops. |
| [`ReadableStream.prototype`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) | `values()` | An alias for `[Symbol.asyncIterator]` for explicit iteration. |

![ReadableStream.asyncIterator](https://caniuse.smokestack.workers.dev/?feature=api.ReadableStream.@@asyncIterator)
![ReadableStream.values](https://caniuse.smokestack.workers.dev/?feature=api.ReadableStream.values)

### 2. Stream Construction Utility

The library adds the static method for creating streams from existing data sources.

| Target | Method | Description |
| :--- | :--- | :--- |
| [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) | [`from(obj)`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/from_static) | **Creates a new `ReadableStream` from any iterable or async iterable object**. It handles both synchronous and asynchronous iterators, including objects that yield `Promise`-like values. |

![Symbol.asyncIterator](https://caniuse.smokestack.workers.dev/?feature=api.ReadableStream.from)

### 3. Fetch and Body Integration Shims

These shims ensure `Request` and `Response` objects (Records) consistently expose their body as a stream and provide the `bytes()` utility.

| Target | Method/Property | Description |
| :--- | :--- | :--- |
| `Request.prototype` | `body` (Getter) | Polyfills the `body` property to return a **`ReadableStream` representation of the body content**. This is crucial for environments where `fetch` exists but streaming is absent. |
| `Response.prototype` | `body` (Getter) | Provides the body content as a `ReadableStream`. The implementation clones the original record, converts the body to a `Blob`, gets the blob's stream, and enqueues chunks via a controller. |
| `Request.prototype`, `Response.prototype`, `Blob.prototype` | `bytes()` | Adds the `bytes()` method, which **asynchronously returns the object's body/content as a `Uint8Array`**. It achieves this by calling the native `arrayBuffer()` and wrapping the result. |

![Request.body](https://caniuse.smokestack.workers.dev/?feature=api.Request.body)
![Response.body](https://caniuse.smokestack.workers.dev/?feature=api.Response.body)
![Request.bytes](https://caniuse.smokestack.workers.dev/?feature=api.Request.bytes)
![Response.bytes](https://caniuse.smokestack.workers.dev/?feature=api.Response.bytes)
![Blob.bytes](https://caniuse.smokestack.workers.dev/?feature=api.Blob.bytes)

### 4. Duplex Compliance Shim

To satisfy modern `fetch` specifications when streaming request bodies, the library ensures compliance for **half-duplex operations**.

*   **Property Injection:** The `duplex: 'half'` property is added to the prototypes of `Request`, `Response`, `ReadableStream`, and `Blob`.
*   **Constructor Wrapping:** The global `Request` and `Response` constructors are subclassed and **wrapped** to automatically apply the `duplexHalf` utility function to all arguments passed during instantiation.
*   **Fetch Wrapping:** The global `fetch` function is **wrapped** to automatically apply the `duplexHalf` utility function to its arguments before execution, guaranteeing compliance when streams are used in options.

![Request.duplex](https://caniuse.smokestack.workers.dev/?feature=api.Request.duplex)

### 5. ReadableStreamDefaultReader Constructor Support

The library adds support for the `ReadableStreamDefaultReader` constructor, which is **missing in some runtimes like Bun**. This was the primary motivation for creating this library.

| Target | Method/Property | Description |
| :--- | :--- | :--- |
| [`ReadableStreamDefaultReader`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader) | [`constructor(stream)`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/ReadableStream) | **Polyfills the `ReadableStreamDefaultReader` constructor** to accept a stream directly. In environments where the native constructor doesn't support this (like Bun), it delegates to `stream.getReader()` and properly sets up the prototype chain. This allows `new ReadableStreamDefaultReader(stream)` to work consistently across all runtimes. |

![ReadableStreamDefaultReader.constructor](https://caniuse.smokestack.workers.dev/?feature=api.ReadableStreamDefaultReader.constructor)
