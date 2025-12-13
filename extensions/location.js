if(typeof Location === 'undefined'){
// Sham Location class extending URL
class Location extends URL {
  constructor(href, base) {
    super(href, base);
  }

  // Location properties that delegate to URL
  get ancestorOrigins() {
    return { length: 0 };
  }

  // Location methods
  assign(url) {
    this.href = url;
  }

  reload(forceReload = false) {
    // Sham implementation - does nothing
    console.log(`reload(${forceReload}) called`);
  }

  replace(url) {
    this.href = url;
  }

  toString() {
    return this.href;
  }
}
}
