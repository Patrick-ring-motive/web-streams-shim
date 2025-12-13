if(typeof File === 'undefined'){
  // Sham File class extending Blob
globalThis.File = class File extends Blob {
  constructor(bits, filename, options = {}) {
    // Extract File-specific options
    const { lastModified = Date.now(), ...blobOptions } = options;
    
    // Call Blob constructor with bits and blob options
    super(bits, blobOptions);
    
    // Add File-specific properties
    this._name = filename;
    this._lastModified = lastModified;
    this._lastModifiedDate = new Date(lastModified);
  }

  get name() {
    return this._name;
  }

  get lastModified() {
    return this._lastModified;
  }

  get lastModifiedDate() {
    return this._lastModifiedDate;
  }

  get webkitRelativePath() {
    return '';
  }
}
}
