(()=>{
  const typeMap = {
    blob:Blob,
    text:TextDecoder,
    json:JSON,
    arrayBuffer:ArrayBuffer,
    stream:ReadableStream,
    formData:FormData,
    byte:Uint8Array,
    slice:Blob
  };
  const getMap = {
    url:URL,
    headers:Headers,
    body:ReadableStream
  };
})();
