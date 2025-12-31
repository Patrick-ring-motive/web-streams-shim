# Web Streams Extensions

**Non-standard convenience methods and polyfills for modern serverless environments**

This directory contains extensions to the Web Streams API that are **intentionally non-standard**. They provide helpful functionality and API consistency that isn't part of official specifications but is useful in practice.

## Purpose

These extensions are designed for:
- **Cloudflare Workers** - Missing File, Location constructors
- **Vercel Edge Runtime** - Limited Web API surface
- **Deno Deploy** - Some API gaps in standard library
- **Google Apps Script** - Non-browser environment needing browser APIs
- **Other serverless platforms** - Various API compatibility needs

## Files

### Core Extensions

#### [`web-streams-extensions.js`](web-streams-extensions.js)
**Complete extension bundle with all non-standard methods**

Adds:
- `Request/Response.stream()` - Method alias for `.body` property
- `Request/Response/Blob` async iteration - Direct iteration over content
- `Blob.body` and `Blob.bodyUsed` - Match Request/Response API surface
- `Blob` helper methods - `blob()`, `clone()`, `formData()`, `json()`
- `ArrayBuffer` iteration - `bytes()`, `Symbol.iterator`, `values()`
- `SharedArrayBuffer` iteration - `bytes()`, `Symbol.iterator`, `values()`
- `ReadableStream` helper methods - `text()`, `json()`, `arrayBuffer()`, `blob()`, `bytes()`, `formData()`, `clone()`, `stream()`, `body`
- `ReadableStream.from()` fallback - Creates streams in limited environments
- Advanced parsing - `sharedArrayBuffer()`, `dataView()`, `searchParams()`, `file()` on Request/Response/Blob/ReadableStream
- `DataView` iteration - `bytes()`, `Symbol.iterator`, `values()`

```javascript
// Usage
import 'web-streams-shim/extensions';

// Method-based API
const stream = response.stream();

// Direct iteration
for await (const chunk of response) {
  console.log(chunk);
}

// Blob API consistency
const blobStream = myBlob.body;
const isReading = myBlob.bodyUsed;

// ArrayBuffer iteration
const buffer = await response.arrayBuffer();
for (const byte of buffer) {
  // Process each byte
}

// SharedArrayBuffer iteration
const shared = await response.sharedArrayBuffer();
for (const byte of shared) {
  // Process each byte (thread-safe)
}

// ReadableStream parsing helpers (consume stream)
const stream = response.body;
const text = await stream.text();        // Parse as text
const json = await stream.json();        // Parse as JSON
const blob = await stream.blob();        // Create Blob
const bytes = await stream.bytes();      // Get Uint8Array
const buffer = await stream.arrayBuffer(); // Get ArrayBuffer
const form = await stream.formData();    // Parse FormData
const cloned = stream.clone();           // Tee and return copy

// ReadableStream self-reference (API consistency)
const same = stream.stream();            // Returns self
const body = stream.body;                // Returns self

// Advanced parsing methods (work on Request/Response/Blob/ReadableStream)
const shared = await response.sharedArrayBuffer();  // SharedArrayBuffer for Workers
const view = await response.dataView();             // DataView for binary manipulation
const params = await response.searchParams();       // URLSearchParams from text
const file = await response.file('data.json', {     // File object with metadata
  type: 'application/json',
  lastModified: Date.now()
});

// DataView iteration
const view = await response.dataView();
for (const byte of view) {
  // Iterate over DataView bytes
}
const viewBytes = view.bytes(); // Convert to Uint8Array

// ReadableStream.from() - works even without native support
const stream = ReadableStream.from(['hello', 'world']);
for await (const chunk of stream) {
  console.log(chunk); // 'hello', 'world'
}
```

#### [`Record-stream.js`](Record-stream.js)
**Minimal stream() method only**

Lightweight alternative that only adds `stream()` method and `Blob.body` property. Use when you don't need the other extensions.

```javascript
// Usage
import 'web-streams-shim/extensions/Record-stream.js';

const stream = response.stream(); // Alias for response.body
const blobStream = myBlob.body;
```

#### [`type-extensions.js`](type-extensions.js)
**Prototype chain setup for runtime type traceability**

Extends Web API methods to inherit from the class of the type they return. This provides better debugging and type introspection.

```javascript
// After loading type-extensions.js
Response.prototype.blob instanceof Function // true
Response.prototype.blob.__proto__ === Blob // true (extended with Blob)

// Better runtime type checking
console.log(Response.prototype.json); // Shows connection to JSON
console.log(Response.prototype.arrayBuffer); // Shows connection to ArrayBuffer
```

**Extends:**
- `Request/Response/Blob/ReadableStream` methods: blob(), text(), json(), arrayBuffer(), stream(), formData(), bytes(), slice(), sharedArrayBuffer(), dataView(), searchParams(), file()
- `Request/Response/Blob` getters: url, headers, body
- `ArrayBuffer` methods: bytes(), slice()
- `SharedArrayBuffer` methods: bytes(), slice()
- `DataView` methods: bytes()
- Iteration: ArrayBuffer, SharedArrayBuffer, DataView (Symbol.iterator, values())

### Polyfills for Missing Constructors

#### [`file.js`](file.js)
**File constructor polyfill for serverless environments**

Provides a complete `File` class implementation when the native constructor is missing. Extends `Blob` with file-specific properties.

```javascript
// Usage in Cloudflare Workers
import 'web-streams-shim/extensions/file.js';

const file = new File(['content'], 'document.txt', {
  type: 'text/plain',
  lastModified: Date.now()
});

console.log(file.name); // 'document.txt'
console.log(file.lastModified); // timestamp
console.log(file.size); // 7 (from Blob)
```

**Properties:**
- `name` - File name string
- `lastModified` - Timestamp in milliseconds
- `lastModifiedDate` - Date object (deprecated but included)
- `webkitRelativePath` - Always empty string
- All `Blob` properties (size, type, etc.)

#### [`location.js`](location.js)
**Location constructor polyfill for serverless environments**

Provides a `Location` class when it doesn't exist. Extends `URL` with Location-specific methods and properties.

```javascript
// Usage in Deno Deploy
import 'web-streams-shim/extensions/location.js';

const loc = new Location('https://example.com/path?query=value');

console.log(loc.href); // 'https://example.com/path?query=value'
console.log(loc.pathname); // '/path'
console.log(loc.search); // '?query=value'

// Location-specific methods (no-ops in server context)
loc.assign('https://other.com'); // Updates href, doesn't navigate
loc.reload(); // Console log, doesn't actually reload
loc.replace('https://other.com'); // Updates href, doesn't navigate
```

**Why these exist:** Browser code often checks `location.href` or creates `new Location()`. These polyfills allow that code to run in serverless environments without modification, even though navigation methods are no-ops.

## Usage

### Load Everything
```html
<script src="https://cdn.jsdelivr.net/npm/web-streams-shim/extensions/web-streams-extensions.js"></script>
```

### Selective Loading
```javascript
// Just stream() method
await import('web-streams-shim/extensions/Record-stream.js');

// Just File constructor
await import('web-streams-shim/extensions/file.js');

// Type system extensions
await import('web-streams-shim/extensions/type-extensions.js');
```

### With Module Bundler
```javascript
// All extensions
import 'web-streams-shim/extensions';

// Individual extensions
import 'web-streams-shim/extensions/file.js';
import 'web-streams-shim/extensions/location.js';
```

##  Important Notes

### Non-Standard Warning
**These extensions are NOT part of any web standard.** They are convenience methods that:
- Fill gaps in serverless platforms
- Provide API consistency
- Enable browser code to run server-side
- Add useful iteration patterns


### ArrayBuffer/SharedArrayBuffer/DataView Iteration Caution

Making `ArrayBuffer`, `SharedArrayBuffer`, and `DataView` iterable is particularly non-standard. This could:
- Surprise developers expecting normal buffer behavior  
- Conflict with future standards
- Break code that relies on buffers not being iterable

Use with awareness of these implications.

### ReadableStream.from() Fallback

The `ReadableStream.from()` implementation provides fallbacks for environments where:
- The static `from()` method doesn't exist
- The constructor doesn't support async iterable sources
- Streams need to be created from iterables in any environment

The fallback chain tries: native `from()` → constructor with async source → collect to Blob then Response.body

## Testing

Extensions should be tested in target environments:

```javascript
// Test in your serverless platform
import 'web-streams-shim/extensions';

// Verify File works
const file = new File(['test'], 'test.txt');
console.assert(file.name === 'test.txt', 'File name works');

// Verify Location works  
const loc = new Location('https://example.com/path');
console.assert(loc.pathname === '/path', 'Location parsing works');

// Verify stream() alias
const res = new Response('test');
console.assert(res.stream() === res.body, 'stream() is alias for body');

// Verify async iteration
for await (const chunk of res) {
  console.log('Chunk received:', chunk);
}

// Verify SharedArrayBuffer
const shared = await res.sharedArrayBuffer();
console.assert(shared instanceof SharedArrayBuffer, 'SharedArrayBuffer works');

// Verify DataView iteration
const view = await new Response('test').dataView();
let byteCount = 0;
for (const byte of view) {
  byteCount++;
}
console.assert(byteCount === 4, 'DataView iteration works');

// Verify searchParams
const params = await new Response('key=value&foo=bar').searchParams();
console.assert(params.get('key') === 'value', 'searchParams works');

// Verify file() method
const fileObj = await res.file('data.txt', { type: 'text/plain' });
console.assert(fileObj.name === 'data.txt', 'file() method works');

// Verify ReadableStream.from fallback
const stream = ReadableStream.from(['a', 'b', 'c']);
const chunks = [];
for await (const chunk of stream) {
  chunks.push(chunk);
}
console.assert(chunks.length === 3, 'ReadableStream.from works');
```

## Related

- [../README.md](../README.md) - Main library documentation
- [../CONTRIBUTING.md](../CONTRIBUTING.md) - Contributing guidelines
- [web-streams-core.js](../web-streams-core.js) - Standard polyfills

## Philosophy

Extensions exist to be **pragmatic** rather than **pure**:
- Standards are ideal, but environments vary
- Browser APIs are useful server-side too
- Consistency helps developer experience
- Non-standard doesn't mean wrong

If a method helps you ship code faster and works reliably, use it. Just document that it's non-standard so future maintainers understand.

---

**Version:** 1.0.7  
**Last Updated:** December 31, 2025  
**Maintained by:** patrick.ring.motive@gmail.com
