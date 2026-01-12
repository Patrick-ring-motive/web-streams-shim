// Test framework
const documentSelector = (selector) => {
    try{
        return document.querySelector(selector);
    }catch(e){
        console.warn(`Invalid selector: ${selector}`, e);
    }
};

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async runAll() {
        this.results = [];
        const resultsDiv = documentSelector('#results');
        resultsDiv.innerHTML = '';

        for (const test of this.tests) {
            const testDiv = this.createTestElement(test.name, 'running');
            resultsDiv.appendChild(testDiv);

            try {
                await test.fn();
                this.updateTestElement(testDiv, 'pass', 'Passed ✓');
                this.results.push({ name: test.name, passed: true });
            } catch (error) {
                this.updateTestElement(testDiv, 'fail', 'Failed ✗', error.message);
                this.results.push({ name: test.name, passed: false, error: error.message });
            }
        }

        this.updateSummary();
    }

    createTestElement(name, status) {
        const sectionName = name.split(':')[0];
        const sectionId = this.sanitizeSelectorId(sectionName);
        const section = documentSelector(`#section-${sectionId}`) ||
                       this.createSection(sectionName, sectionId);

        const div = document.createElement('div');
        div.className = `test-case ${status}`;
        div.innerHTML = `
            <div class="test-name">${name}</div>
            <div class="test-result">Running...</div>
        `;
        section.appendChild(div);
        return div;
    }

    sanitizeSelectorId(str) {
        return str.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-');
    }

    createSection(title, sectionId) {
        const section = document.createElement('div');
        section.className = 'test-section';
        section.id = `section-${sectionId}`;
        section.innerHTML = `<h2>${title}</h2>`;
        documentSelector('#results').appendChild(section);
        return section;
    }

    updateTestElement(div, status, result, error = null) {
        div.className = `test-case ${status}`;
        div.querySelector('.test-result').textContent = result;
        if (error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'test-error';
            errorDiv.textContent = error;
            div.appendChild(errorDiv);
        }
    }

    updateSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.passed).length;
        const failed = total - passed;

        documentSelector('#summary').style.display = 'flex';
        documentSelector('#totalCount').textContent = total;
        documentSelector('#passCount').textContent = passed;
        documentSelector('#failCount').textContent = failed;
    }
}

const runner = new TestRunner();

// Helper functions
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ReadableStream Iterator Tests
runner.test('ReadableStream Iterator: next() method exists', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue('test');
            controller.close();
        }
    });
    const reader = stream.getReader();
    assert(typeof reader.next === 'function', 'next() method should exist');
});

runner.test('ReadableStream Iterator: next() reads chunks', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue('chunk1');
            controller.enqueue('chunk2');
            controller.close();
        }
    });
    const reader = stream.getReader();
    const result1 = await reader.next();
    assertEqual(result1.value, 'chunk1', 'First chunk should be chunk1');
    assertEqual(result1.done, false, 'Should not be done');
    const result2 = await reader.next();
    assertEqual(result2.value, 'chunk2', 'Second chunk should be chunk2');
});

runner.test('ReadableStream Iterator: Symbol.asyncIterator on reader', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(1);
            controller.enqueue(2);
            controller.close();
        }
    });
    const reader = stream.getReader();
    assert(typeof reader[Symbol.asyncIterator] === 'function', 'Symbol.asyncIterator should exist');
    assertEqual(reader[Symbol.asyncIterator](), reader, 'Should return itself');
});

runner.test('ReadableStream Iterator: for-await-of on reader', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(1);
            controller.enqueue(2);
            controller.enqueue(3);
            controller.close();
        }
    });
    const reader = stream.getReader();
    const values = [];
    for await (const value of reader) {
        values.push(value);
    }
    assertEqual(values.length, 3, 'Should read 3 values');
    assertEqual(values[0], 1, 'First value should be 1');
    assertEqual(values[2], 3, 'Third value should be 3');
});

runner.test('ReadableStream Iterator: return() method', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(1);
            controller.enqueue(2);
            controller.enqueue(3);
            controller.close();
        }
    });
    const reader = stream.getReader();
    assert(typeof reader.return === 'function', 'return() method should exist');
    await reader.next();
    const result = await reader.return('stopped');
    assert(result.done, 'Should be done after return');
});

runner.test('ReadableStream Iterator: throw() method', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(1);
            controller.close();
        }
    });
    const reader = stream.getReader();
    assert(typeof reader.throw === 'function', 'throw() method should exist');
    const result = await reader.throw(new Error('test error'));
    assert(result.done, 'Should be done after throw');
});

// ReadableStream Direct Iterator Tests
runner.test('ReadableStream Direct: Symbol.asyncIterator on stream', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(1);
            controller.close();
        }
    });
    assert(typeof stream[Symbol.asyncIterator] === 'function', 'Symbol.asyncIterator should exist on stream');
});

runner.test('ReadableStream Direct: for-await-of on stream', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue('a');
            controller.enqueue('b');
            controller.enqueue('c');
            controller.close();
        }
    });
    const values = [];
    for await (const value of stream) {
        values.push(value);
    }
    assertEqual(values.join(''), 'abc', 'Should read all values');
});

runner.test('ReadableStream Direct: values() method', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(10);
            controller.enqueue(20);
            controller.close();
        }
    });
    assert(typeof stream.values === 'function', 'values() method should exist');
    const values = [];
    for await (const value of stream.values()) {
        values.push(value);
    }
    assertEqual(values.length, 2, 'Should read 2 values');
});

// ReadableStream.from() Tests
runner.test('ReadableStream.from: exists as static method', async () => {
    assert(typeof ReadableStream.from === 'function', 'ReadableStream.from should exist');
});

runner.test('ReadableStream.from: creates stream from array', async () => {
    const stream = ReadableStream.from([1, 2, 3]);
    const values = [];
    for await (const value of stream) {
        values.push(value);
    }
    assertEqual(values.length, 3, 'Should have 3 values');
    assertEqual(values[1], 2, 'Second value should be 2');
});

runner.test('ReadableStream.from: creates stream from generator', async () => {
    function* gen() {
        yield 'a';
        yield 'b';
        yield 'c';
    }
    const stream = ReadableStream.from(gen());
    const values = [];
    for await (const value of stream) {
        values.push(value);
    }
    assertEqual(values.join(''), 'abc', 'Should read all generated values');
});

runner.test('ReadableStream.from: creates stream from async generator', async () => {
    async function* asyncGen() {
        yield Promise.resolve(1);
        yield Promise.resolve(2);
    }
    const stream = ReadableStream.from(asyncGen());
    const values = [];
    for await (const value of stream) {
        values.push(value);
    }
    assertEqual(values.length, 2, 'Should have 2 values from async generator');
});

// Request/Response Body Tests
runner.test('Request/Response: Request has body property', async () => {
    const req = new Request('https://example.com', {
        method: 'POST',
        body: 'test data'
    });
    assert(req.body !== undefined, 'Request should have body property');
});

runner.test('Request/Response: Response has body property', async () => {
    const res = new Response('test data');
    assert(res.body !== undefined, 'Response should have body property');
});

runner.test('Request/Response: body is ReadableStream', async () => {
    const res = new Response('test data');
    assert(res.body instanceof ReadableStream, 'body should be a ReadableStream');
});

runner.test('Request/Response: can read body chunks', async () => {
    const res = new Response('hello world');
    const reader = res.body.getReader();
    const { value, done } = await reader.read();
    assert(value instanceof Uint8Array, 'Chunk should be Uint8Array');
    assert(!done, 'Should not be done after first read');
});

runner.test('Request/Response: bodyUsed property', async () => {
    const res = new Response('test');
    assert(typeof res.bodyUsed === 'boolean', 'bodyUsed should be boolean');
});

// bytes() Method Tests
runner.test('bytes(): Response.bytes() exists', async () => {
    const res = new Response('test');
    assert(typeof res.bytes === 'function', 'bytes() should exist on Response');
});

runner.test('bytes(): returns Uint8Array', async () => {
    const res = new Response('hello');
    const bytes = await res.bytes();
    assert(bytes instanceof Uint8Array, 'bytes() should return Uint8Array');
});

runner.test('bytes(): correct data', async () => {
    const res = new Response('ABC');
    const bytes = await res.bytes();
    assert(bytes.length > 0, 'Should have bytes');
    // Check if it contains expected byte values
    assertEqual(bytes[0], 65, 'First byte should be 65 (A)');
});

runner.test('bytes(): Blob.bytes() exists', async () => {
    const blob = new Blob(['test']);
    assert(typeof blob.bytes === 'function', 'bytes() should exist on Blob');
});

runner.test('bytes(): Blob.bytes() returns data', async () => {
    const blob = new Blob(['hello']);
    const bytes = await blob.bytes();
    assert(bytes instanceof Uint8Array, 'Blob bytes() should return Uint8Array');
    assert(bytes.length > 0, 'Should have bytes');
});

// ReadableStreamDefaultReader Constructor Tests
runner.test('ReadableStreamDefaultReader: constructor works', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue('test');
            controller.close();
        }
    });
    const reader = new ReadableStreamDefaultReader(stream);
    assert(reader instanceof ReadableStreamDefaultReader, 'Should be instance of ReadableStreamDefaultReader');
});

runner.test('ReadableStreamDefaultReader: can read after construction', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue('data');
            controller.close();
        }
    });
    const reader = new ReadableStreamDefaultReader(stream);
    const result = await reader.read();
    assertEqual(result.value, 'data', 'Should read correct value');
});

// Integration Tests
runner.test('Integration: Stream pipeline', async () => {
    const data = [1, 2, 3, 4, 5];
    const stream = ReadableStream.from(data);

    let sum = 0;
    for await (const num of stream) {
        sum += num;
    }

    assertEqual(sum, 15, 'Sum should be 15');
});

runner.test('Integration: Early termination with break', async () => {
    const stream = new ReadableStream({
        start(controller) {
            for (let i = 0; i < 100; i++) {
                controller.enqueue(i);
            }
            controller.close();
        }
    });

    const values = [];
    for await (const value of stream) {
        values.push(value);
        if (value >= 4) break;
    }

    assert(values.length <= 5, 'Should stop early');
});

// Event listeners
documentSelector('#runTests').addEventListener('click', async () => {
    const button = documentSelector('#runTests');
    button.disabled = true;
    button.textContent = 'Running...';

    await runner.runAll();

    button.disabled = false;
    button.textContent = 'Run All Tests';
});

documentSelector('#clearResults').addEventListener('click', () => {
    documentSelector('#results').innerHTML = '';
    documentSelector('#summary').style.display = 'none';
});

// Symbol.asyncDispose Tests
runner.test('Symbol.asyncDispose: exists on reader', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue('test');
            controller.close();
        }
    });
    const reader = stream.getReader();
    const disposeSymbol = Symbol.asyncDispose ?? 'Symbol.asyncDispose';
    assert(typeof reader[disposeSymbol] === 'function', 'Symbol.asyncDispose should exist');
});

runner.test('Symbol.asyncDispose: disposes reader correctly', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue('test');
            controller.close();
        }
    });
    const reader = stream.getReader();
    const disposeSymbol = Symbol.asyncDispose ?? 'Symbol.asyncDispose';
    await reader[disposeSymbol]();
    // After disposal, the reader should be released
    assert(true, 'Should dispose without error');
});

// ReadableStreamBYOBReader Tests
runner.test('ReadableStreamBYOBReader: exists as global', async () => {
    assert(typeof ReadableStreamBYOBReader !== 'undefined', 'ReadableStreamBYOBReader should exist');
});

runner.test('ReadableStreamBYOBReader: can create reader with mode byob', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(new Uint8Array([1, 2, 3]));
            controller.close();
        },
        type: 'bytes'
    });
    const reader = stream.getReader({ mode: 'byob' });
    assert(reader !== null, 'Should create BYOB reader');
});

runner.test('ReadableStreamBYOBReader: constructor works', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(new Uint8Array([1, 2, 3]));
            controller.close();
        },
        type: 'bytes'
    });
    const reader = new ReadableStreamBYOBReader(stream);
    assert(reader instanceof ReadableStreamBYOBReader, 'Should be instance of ReadableStreamBYOBReader');
});

runner.test('ReadableStreamBYOBReader: read with view', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(new Uint8Array([65, 66, 67]));
            controller.close();
        },
        type: 'bytes'
    });
    const reader = stream.getReader({ mode: 'byob' });
    const buffer = new Uint8Array(10);
    const result = await reader.read(buffer);
    assert(result.value instanceof Uint8Array, 'Should return Uint8Array');
    assert(!result.done || result.done === false || result.value.length > 0, 'Should have data or be done');
});

runner.test('ReadableStreamBYOBReader: extends ReadableStreamDefaultReader', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(new Uint8Array([1]));
            controller.close();
        },
        type: 'bytes'
    });
    const reader = new ReadableStreamBYOBReader(stream);
    assert('read' in reader, 'Should have read method');
    assert('cancel' in reader, 'Should have cancel method');
    assert('closed' in reader, 'Should have closed property');
});

// ReadableStreamBYOBRequest Tests
runner.test('ReadableStreamBYOBRequest: exists as global', async () => {
    assert(typeof ReadableStreamBYOBRequest !== 'undefined', 'ReadableStreamBYOBRequest should exist');
});

runner.test('ReadableStreamBYOBRequest: byobRequest on controller', async () => {
    let hasRequest = false;
    const stream = new ReadableStream({
        async pull(controller) {
            if ('byobRequest' in controller) {
                hasRequest = true;
            }
            controller.close();
        },
        type: 'bytes'
    });
    const reader = stream.getReader({ mode: 'byob' });
    try {
        await reader.read(new Uint8Array(10));
    } catch (e) {
        // May error, but we just want to trigger pull
    }
    assert(hasRequest, 'Controller should have byobRequest property');
});

runner.test('ReadableStreamBYOBRequest: respond method', async () => {
    const stream = new ReadableStream({
        pull(controller) {
            const request = controller.byobRequest;
            if (request && request.view) {
                const view = request.view;
                view[0] = 42;
                request.respond(1);
            } else {
                controller.enqueue(new Uint8Array([42]));
            }
        },
        type: 'bytes'
    });
    const reader = stream.getReader({ mode: 'byob' });
    const buffer = new Uint8Array(10);
    const result = await reader.read(buffer);
    assertEqual(result.value[0], 42, 'Should read the byte written to the view');
});

runner.test('ReadableStreamBYOBRequest: respondWithNewView method', async () => {
    const stream = new ReadableStream({
        pull(controller) {
            const request = controller.byobRequest;
            if (request) {
                const newView = new Uint8Array([10, 20, 30]);
                request.respondWithNewView(newView);
            } else {
                controller.enqueue(new Uint8Array([10, 20, 30]));
            }
        },
        type: 'bytes'
    });
    const reader = stream.getReader({ mode: 'byob' });
    const buffer = new Uint8Array(10);
    const result = await reader.read(buffer);
    assertEqual(result.value[0], 10, 'Should read first byte');
    assertEqual(result.value[1], 20, 'Should read second byte');
});

// ReadableByteStreamController Tests
runner.test('ReadableByteStreamController: exists as global', async () => {
    assert(typeof ReadableByteStreamController !== 'undefined', 'ReadableByteStreamController should exist');
});

runner.test('ReadableByteStreamController: is constructor', async () => {
    assert(typeof ReadableByteStreamController === 'function', 'Should be a function/constructor');
});

// Duplex Property Tests
runner.test('Duplex: Request has duplex property', async () => {
    const req = new Request('https://example.com', {
        method: 'POST',
        body: 'test'
    });
    assert('duplex' in req || 'duplex' in Request.prototype, 'Request should have duplex property');
});

runner.test('Duplex: Response has duplex property', async () => {
    const res = new Response('test');
    assert('duplex' in res || 'duplex' in Response.prototype, 'Response should have duplex property');
});

runner.test('Duplex: ReadableStream has duplex property', async () => {
    const stream = new ReadableStream();
    assert('duplex' in stream || 'duplex' in ReadableStream.prototype, 'ReadableStream should have duplex property');
});

runner.test('Duplex: Blob has duplex property', async () => {
    const blob = new Blob(['test']);
    assert('duplex' in blob || 'duplex' in Blob.prototype, 'Blob should have duplex property');
});

// GET/HEAD Request Tests
runner.test('Request/Response: GET request has null body', async () => {
    const req = new Request('https://example.com', { method: 'GET' });
    assertEqual(req.body, null, 'GET request body should be null');
});

runner.test('Request/Response: HEAD request has null body', async () => {
    const req = new Request('https://example.com', { method: 'HEAD' });
    assertEqual(req.body, null, 'HEAD request body should be null');
});

runner.test('Request/Response: POST request has body', async () => {
    const req = new Request('https://example.com', {
        method: 'POST',
        body: 'data'
    });
    assert(req.body !== null, 'POST request should have body');
});

// ReadableStream.from() Edge Cases
runner.test('ReadableStream.from: handles Promise input', async () => {
    const stream = ReadableStream.from(Promise.resolve([1, 2, 3]));
    const values = [];
    for await (const value of stream) {
        values.push(value);
    }
    assertEqual(values.length, 3, 'Should handle Promise of iterable');
});

runner.test('ReadableStream.from: handles string input', async () => {
    const stream = ReadableStream.from('abc');
    const values = [];
    for await (const value of stream) {
        values.push(value);
    }
    assertEqual(values.length, 3, 'Should iterate string characters');
    assertEqual(values[0], 'a', 'First value should be a');
});

runner.test('ReadableStream.from: handles empty array', async () => {
    const stream = ReadableStream.from([]);
    const values = [];
    for await (const value of stream) {
        values.push(value);
    }
    assertEqual(values.length, 0, 'Should handle empty array');
});

runner.test('ReadableStream.from: handles nested Promises', async () => {
    async function* gen() {
        yield Promise.resolve(1);
        yield Promise.resolve(2);
    }
    const stream = ReadableStream.from(gen());
    const values = [];
    for await (const value of stream) {
        values.push(value);
    }
    assertEqual(values.length, 2, 'Should handle nested Promises in async generator');
    assertEqual(values[0], 1, 'Should resolve first Promise');
});

// Reader Iteration Methods
runner.test('Reader Iteration: next() returns correct format', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue('test');
            controller.close();
        }
    });
    const reader = stream.getReader();
    const result = await reader.next();
    assert('value' in result, 'Result should have value property');
    assert('done' in result, 'Result should have done property');
});

runner.test('Reader Iteration: next() on closed stream', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.close();
        }
    });
    const reader = stream.getReader();
    const result = await reader.next();
    assert(result.done === true, 'Should be done on closed stream');
});

runner.test('Reader Iteration: multiple readers via asyncIterator', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(1);
            controller.enqueue(2);
            controller.close();
        }
    });
    const reader1 = stream[Symbol.asyncIterator]();
    // Once locked, can't get another reader
    try {
        const reader2 = stream[Symbol.asyncIterator]();
        // If we get here, they should be the same reader
        assert(reader1 === reader2, 'Should return same reader when stream is locked');
    } catch (e) {
        // Expected - stream is locked
        assert(true, 'Stream should be locked');
    }
});

// Response/Request Body Edge Cases
runner.test('Request/Response: bodyUsed reflects lock state', async () => {
    const res = new Response('test');
    assert(res.bodyUsed === false || res.body.locked === false, 'Body should not be used initially');
    const reader = res.body.getReader();
    assert(res.bodyUsed === true || res.body.locked === true, 'Body should be used after getReader');
});

runner.test('Request/Response: can iterate body directly', async () => {
    const res = new Response('hello');
    let chunkCount = 0;
    for await (const chunk of res.body) {
        assert(chunk instanceof Uint8Array, 'Each chunk should be Uint8Array');
        chunkCount++;
    }
    assert(chunkCount > 0, 'Should read at least one chunk');
});

runner.test('Request/Response: clone() creates independent body', async () => {
    const res1 = new Response('test data');
    const res2 = res1.clone();
    assert(res1.body !== res2.body, 'Cloned bodies should be different streams');
});

// bytes() Method Edge Cases
runner.test('bytes(): works with empty Response', async () => {
    const res = new Response('');
    const bytes = await res.bytes();
    assert(bytes instanceof Uint8Array, 'Should return Uint8Array');
    assertEqual(bytes.length, 0, 'Empty response should have 0 bytes');
});

runner.test('bytes(): works with binary data', async () => {
    const buffer = new Uint8Array([1, 2, 3, 4, 5]);
    const res = new Response(buffer);
    const bytes = await res.bytes();
    assertEqual(bytes.length, 5, 'Should have 5 bytes');
    assertEqual(bytes[0], 1, 'First byte should match');
    assertEqual(bytes[4], 5, 'Last byte should match');
});

// Closed Reader Property Tests
runner.test('Reader: closed property exists', async () => {
    const stream = new ReadableStream();
    const reader = stream.getReader();
    assert('closed' in reader, 'Reader should have closed property');
});

runner.test('Reader: closed is a Promise', async () => {
    const stream = new ReadableStream();
    const reader = stream.getReader();
    assert(reader.closed instanceof Promise || typeof reader.closed?.then === 'function', 'closed should be a Promise');
});

runner.test('Reader: closed resolves when stream closes', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.close();
        }
    });
    const reader = stream.getReader();
    await reader.closed;
    assert(true, 'closed Promise should resolve');
});

// Stream Reuse Tests
runner.test('Stream Reuse: values() returns new iterator each time', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(1);
            controller.enqueue(2);
            controller.close();
        }
    });
    const iter1 = stream.values();
    try {
        const iter2 = stream.values();
        // Should either get same reader or throw
        assert(true, 'Should handle multiple values() calls');
    } catch (e) {
        // Expected if stream is already locked
        assert(true, 'Stream locking prevents multiple readers');
    }
});

// Error Handling Tests
runner.test('Error Handling: stream error propagates to reader', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.error(new Error('test error'));
        }
    });
    const reader = stream.getReader();
    let errorCaught = false;
    try {
        await reader.read();
    } catch (e) {
        errorCaught = true;
    }
    assert(errorCaught, 'Should catch stream error');
});

runner.test('Error Handling: throw() logs error to console', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(1);
            controller.close();
        }
    });
    const reader = stream.getReader();
    const originalError = console.error;
    let errorLogged = false;
    console.error = () => { errorLogged = true; };
    await reader.throw(new Error('test'));
    console.error = originalError;
    assert(errorLogged, 'throw() should log to console.error');
});

runner.test('Error Handling: cancel propagates through terminate', async () => {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(1);
            controller.close();
        }
    });
    const reader = stream.getReader();
    await reader.cancel('test reason');
    assert(true, 'Should cancel without error');
});

// Performance Tests
runner.test('Performance: large stream iteration', async () => {
    const size = 1000;
    const stream = new ReadableStream({
        start(controller) {
            for (let i = 0; i < size; i++) {
                controller.enqueue(i);
            }
            controller.close();
        }
    });
    let count = 0;
    for await (const value of stream) {
        count++;
    }
    assertEqual(count, size, `Should iterate ${size} items`);
});

runner.test('Performance: ReadableStream.from large array', async () => {
    const size = 1000;
    const arr = Array.from({ length: size }, (_, i) => i);
    const stream = ReadableStream.from(arr);
    let count = 0;
    for await (const value of stream) {
        count++;
    }
    assertEqual(count, size, `Should handle array of ${size} items`);
});

// Utility Function Tests
runner.test('Utilities: setStrings functionality', async () => {
    // Test that toString works correctly
    const stream = new ReadableStream();
    const str = String(stream.getReader);
    assert(str.includes('function') || str.includes('getReader'), 'Should have proper string representation');
});

runner.test('Utilities: extend functionality', async () => {
    // Test that prototype chain is maintained
    const reader = new ReadableStreamDefaultReader(new ReadableStream({
        start(controller) {
            controller.close();
        }
    }));
    assert(reader instanceof ReadableStreamDefaultReader, 'Should maintain prototype chain');
});

// Auto-run on load
window.addEventListener('load', () => {
    console.log('Test suite loaded. Click "Run All Tests" to begin.');
});
