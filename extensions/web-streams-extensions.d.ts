/**
 * TypeScript definitions for web-streams-shim extensions
 * Additional non-standard convenience methods for Web Streams
 */

/// <reference lib="dom" />
/// <reference path="./web-streams-core.d.ts" />

/**
 * Extended Request interface with additional streaming utilities
 */
interface Request {
  /**
   * Returns the body as a ReadableStream (alias for body property)
   * Non-standard convenience method
   * @returns The request body as a ReadableStream
   */
  stream(): ReadableStream<Uint8Array>;
}

/**
 * Extended Response interface with additional streaming utilities
 */
interface Response {
  /**
   * Returns the body as a ReadableStream (alias for body property)
   * Non-standard convenience method
   * @returns The response body as a ReadableStream
   */
  stream(): ReadableStream<Uint8Array>;
}

/**
 * Extended Blob interface with body property and streaming support
 */
interface Blob {
  /**
   * Returns the blob content as a ReadableStream
   * Non-standard convenience method that matches Request/Response API
   * @returns The blob content as a ReadableStream
   */
  stream(): ReadableStream<Uint8Array>;
  
  /**
   * The blob content as a ReadableStream
   * Non-standard property that matches Request/Response API
   */
  body: ReadableStream<Uint8Array>;
  
  /**
   * Indicates whether the blob body has been consumed
   * Non-standard property that matches Request/Response API
   */
  bodyUsed: boolean;
}

export {};
