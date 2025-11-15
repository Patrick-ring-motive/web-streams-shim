
const supportsReadableStreamDefaultReaderConstructor = () => { 
  try {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('test');
        controller.close();
      }
    });
    const reader = new ReadableStreamDefaultReader(stream);
    reader.read();
    return true;
  } catch {
    return false;
  }
}
