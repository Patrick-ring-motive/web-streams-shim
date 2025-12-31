/**
 * TypeScript definitions for web-streams-shim
 * Extends native Web Streams API interfaces with polyfilled methods
 */

/// <reference lib="dom" />

/**
 * Extended ReadableStream with async iteration support
 */
interface ReadableStream<R = any> {
  /**
   * Returns an async iterator for the stream
   * Allows using for-await-of loops on ReadableStreams
   * @returns An async iterator that yields stream chunks
   */
  [Symbol.asyncIterator](): ReadableStreamDefaultReader<R>;
  
  /**
   * Alias for Symbol.asyncIterator for explicit iteration
   * @returns An async iterator that yields stream chunks
   */
  values(): ReadableStreamDefaultReader<R>;
}

/**
 * Static methods added to ReadableStream constructor
 */
interface ReadableStreamConstructor {
  /**
   * Creates a ReadableStream from an iterable or async iterable
   * @param iterable - An iterable or async iterable to convert
   * @returns A new ReadableStream that yields values from the iterable
   */
  from<R>(iterable: Iterable<R> | AsyncIterable<R>): ReadableStream<R>;
}

/**
 * Extended ReadableStreamDefaultReader with async iterator protocol support
 */
interface ReadableStreamDefaultReader<R = any> extends AsyncIterator<ReadableStreamReadResult<R>> {
  /**
   * Returns the reader itself (for async iteration protocol)
   * @returns This reader instance
   */
  [Symbol.asyncIterator](): this;
  
  /**
   * Reads the next chunk from the stream
   * @returns Promise resolving to the next chunk
   */
  next(): Promise<ReadableStreamReadResult<R>>;
  
  /**
   * Returns from the async iterator and releases the lock
   * @param value - Optional return value
   * @returns Promise resolving to an iterator result marked as done
   */
  return?(value?: any): Promise<ReadableStreamReadResult<R>>;
  
  /**
   * Throws an error and terminates the stream
   * @param error - The error to throw
   * @returns Promise resolving to an iterator result marked as done
   */
  throw?(error?: any): Promise<ReadableStreamReadResult<R>>;
  
  /**
   * Async dispose method for explicit resource management
   * @param reason - Optional reason for disposal
   * @returns Promise that resolves when disposal is complete
   */
  [Symbol.asyncDispose]?(reason?: any): Promise<void>;
}

/**
 * Extended ReadableStreamBYOBReader with async iterator protocol support
 */
interface ReadableStreamBYOBReader extends AsyncIterator<ReadableStreamReadResult<Uint8Array>> {
  /**
   * Returns the reader itself (for async iteration protocol)
   * @returns This reader instance
   */
  [Symbol.asyncIterator](): this;
  
  /**
   * Reads the next chunk from the stream into the provided view
   * @param view - The ArrayBufferView to read into
   * @returns Promise resolving to the next chunk
   */
  next(view?: ArrayBufferView): Promise<ReadableStreamReadResult<Uint8Array>>;
  
  /**
   * Returns from the async iterator and releases the lock
   * @param value - Optional return value
   * @returns Promise resolving to an iterator result marked as done
   */
  return?(value?: any): Promise<ReadableStreamReadResult<Uint8Array>>;
  
  /**
   * Throws an error and terminates the stream
   * @param error - The error to throw
   * @returns Promise resolving to an iterator result marked as done
   */
  throw?(error?: any): Promise<ReadableStreamReadResult<Uint8Array>>;
  
  /**
   * Async dispose method for explicit resource management
   * @param reason - Optional reason for disposal
   * @returns Promise that resolves when disposal is complete
   */
  [Symbol.asyncDispose]?(reason?: any): Promise<void>;
}

/**
 * Extended Request interface with streaming body support
 */
interface Request {
  /**
   * Returns the body as a ReadableStream (alias for body property)
   * @returns The request body as a ReadableStream
   */
  stream?(): ReadableStream<Uint8Array>;
  
  /**
   * Async iterator for the request body
   * @returns An async iterator over body chunks
   */
  [Symbol.asyncIterator]?(): AsyncIterator<Uint8Array>;
  
  /**
   * Returns an async iterator over body chunks
   * @returns An async iterator over body chunks
   */
  values?(): AsyncIterator<Uint8Array>;
  
  /**
   * Returns the body as a Uint8Array
   * @returns Promise resolving to the body as bytes
   */
  bytes?(): Promise<Uint8Array>;
}

/**
 * Extended Response interface with streaming body support
 */
interface Response {
  /**
   * Returns the body as a ReadableStream (alias for body property)
   * @returns The response body as a ReadableStream
   */
  stream?(): ReadableStream<Uint8Array>;
  
  /**
   * Async iterator for the response body
   * @returns An async iterator over body chunks
   */
  [Symbol.asyncIterator]?(): AsyncIterator<Uint8Array>;
  
  /**
   * Returns an async iterator over body chunks
   * @returns An async iterator over body chunks
   */
  values?(): AsyncIterator<Uint8Array>;
  
  /**
   * Returns the body as a Uint8Array
   * @returns Promise resolving to the body as bytes
   */
  bytes?(): Promise<Uint8Array>;
}

/**
 * Extended Blob interface with streaming body support
 */
interface Blob {
  /**
   * Returns the blob content as a ReadableStream
   * @returns The blob content as a ReadableStream
   */
  stream?(): ReadableStream<Uint8Array>;
  
  /**
   * Returns the blob as a ReadableStream (alias for stream())
   * @returns The blob content as a ReadableStream
   */
  body?: ReadableStream<Uint8Array>;
  
  /**
   * Indicates whether the blob body has been consumed
   */
  bodyUsed?: boolean;
  
  /**
   * Async iterator for the blob content
   * @returns An async iterator over blob chunks
   */
  [Symbol.asyncIterator]?(): AsyncIterator<Uint8Array>;
  
  /**
   * Returns an async iterator over blob chunks
   * @returns An async iterator over blob chunks
   */
  values?(): AsyncIterator<Uint8Array>;
  
  /**
   * Returns the blob content as a Uint8Array
   * @returns Promise resolving to the blob content as bytes
   */
  bytes?(): Promise<Uint8Array>;
}

/**
 * ReadableByteStreamController polyfill
 * Polyfilled when not available natively
 */
declare class ReadableByteStreamController extends ReadableStreamDefaultController {
  constructor();
}

declare global {
  /**
   * Global ReadableByteStreamController (polyfilled if missing)
   */
  var ReadableByteStreamController: typeof ReadableByteStreamController;
}

export {};
