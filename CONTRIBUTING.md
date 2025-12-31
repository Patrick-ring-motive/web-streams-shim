# Contributing to web-streams-shim

Thank you for your interest in contributing to web-streams-shim! This document provides guidelines and information for contributors.

## Project Overview

web-streams-shim provides polyfills and shims to ensure modern Web Streams functionality is available across environments where native support is missing or incomplete. The library focuses on:

- ReadableStream async iteration support
- ReadableStream.from() static method
- Request/Response/Blob body streaming extensions
- bytes() method for binary data handling
- BYOB (Bring Your Own Buffer) reader support

## Design Philosophy

### Self-Contained Files
Each polyfill file is intentionally **self-contained** with duplicated utility functions. This design allows:
- Individual files to work independently when needed
- Easy cherry-picking of specific polyfills
- Minimal dependencies and side effects
- Better tree-shaking in bundlers

While this creates some duplication, it's a deliberate trade-off for modularity.

### Feature Detection First
All polyfills use feature detection before applying. Native implementations are never overwritten unless `FORCE_POLYFILLS` is enabled (test mode only).

### Prototype Extension Pattern
The library extends native prototypes safely using:
- Conditional property definition
- Non-enumerable properties to avoid iteration issues
- Proper prototype chain management

## Development Setup

### Prerequisites
- Node.js 18+ (for development dependencies)
- A modern web browser for testing

### Getting Started
```bash
# Clone the repository
git clone https://github.com/Patrick-ring-motive/web-streams-shim.git
cd web-streams-shim

# Install dependencies
npm install

# Run tests (opens test.html in browser)
npm test
```

## Code Structure

```
web-streams-shim/
├── web-streams-core.js           # Main polyfill bundle
├── ReadableStream-asyncIterator.js
├── ReadableStream-from.js
├── ReadableStreamBYOBReader.js
├── ReadableStreamDefaultReader-constructor.js
├── Record-body.js                # Request/Response body streams
├── Record-bytes.js               # bytes() method polyfill
├── Record-duplex.js              # Duplex stream support
├── extensions/                    # Non-standard extensions
│   ├── web-streams-extensions.js # Additional convenience methods
│   ├── Record-stream.js          # stream() alias method
│   ├── file.js                   # File object support
│   ├── location.js               # Location-specific patches
│   └── type-extensions.js        # Type system extensions
└── test/
    ├── test.html                 # Test runner page
    └── test.js                   # Test suite
```

## Making Contributions

### Reporting Issues
When reporting bugs, please include:
- Browser name and version
- Operating system
- Minimal code example reproducing the issue
- Expected vs actual behavior
- Console errors (if any)

### Code Contributions

#### Adding New Polyfills
1. Create a new self-contained file with the pattern:
```javascript
(() => {
    // Feature detection
    if (typeof TargetAPI === 'undefined') return;
    
    // Utility functions (Q, extend, setStrings, etc.)
    const Q = fn => { /* ... */ };
    
    // Polyfill implementation with conditional application
    if (!TargetAPI.prototype.method) {
        Object.defineProperty(TargetAPI.prototype, 'method', {
            value: /* implementation */,
            configurable: true,
            writable: true,
            enumerable: false
        });
    }
})();
```

2. Add comprehensive JSDoc comments
3. Include the polyfill in web-streams-core.js if it's a core feature
4. Add tests in test/test.js
5. Update README.md with compatibility information

#### Testing Requirements
- All new features must include tests in test/test.js
- Tests should verify both polyfilled and native behavior
- Test error cases and edge conditions
- Verify async iteration patterns work correctly

#### Code Style
- Use 4-space indentation
- Use descriptive variable names
- Prefer `const` over `let` where possible
- Use optional chaining (`?.`) for safe property access
- Wrap all polyfills in IIFEs to avoid global scope pollution
- Use arrow functions for utility functions
- Use `function` keyword for named methods/constructors

#### Documentation
- Add JSDoc comments for all public APIs
- Include `@param`, `@returns`, and `@example` tags
- Document browser compatibility in README.md
- Update TypeScript definitions in .d.ts files

### Pull Request Process

1. **Fork and Branch**
   - Fork the repository
   - Create a feature branch: `git checkout -b feature/my-feature`
   - Make your changes with clear, atomic commits

2. **Test Your Changes**
   - Run the test suite in multiple browsers
   - Add new tests for new features
   - Ensure no regressions in existing functionality

3. **Update Documentation**
   - Update README.md if adding new features
   - Add/update TypeScript definitions
   - Include code examples in JSDoc comments

4. **Submit Pull Request**
   - Provide clear description of changes
   - Reference any related issues
   - Ensure all tests pass
   - Be responsive to code review feedback

## Testing Guidelines

### Browser Testing
Test in at least:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- One older browser version where polyfills are needed

### Test Patterns
```javascript
runner.test('Feature: Description', async () => {
    const stream = new ReadableStream({/* ... */});
    // Test implementation
    assert(condition, 'Assertion message');
});
```

### Running Tests
Open `test/test.html` in a browser. Tests run automatically and display results with:
- ✓ Green for passing tests
- ✗ Red for failing tests
- Summary statistics at the bottom

## Browser Compatibility

### Target Browsers
The library targets browsers with:
- Partial Web Streams API support
- Missing async iteration on streams
- Missing ReadableStream.from()
- Incomplete body streaming support

### Known Issues
- IE11: Not supported (requires full polyfill like web-streams-polyfill)
- Safari < 14.1: Limited BYOB reader support
- Firefox < 100: Some iteration edge cases

See README.md for detailed compatibility matrices.

## Performance Considerations

### Best Practices
- Polyfills only apply when features are missing
- Use feature detection, not browser detection
- Avoid unnecessary object creation in hot paths
- Leverage native implementations when available

### Benchmarking
When adding performance-sensitive code:
- Compare against native implementation
- Test with large datasets
- Measure memory usage for streaming operations
- Profile in multiple browsers

## Release Process

1. Update version in package.json
2. Update CHANGELOG (if exists)
3. Create git tag: `git tag v1.0.x`
4. Push tag: `git push origin v1.0.x`
5. Create GitHub release
6. npm publish happens automatically via GitHub Actions

## Community

### Getting Help
- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: General questions and ideas
- Email: patrick.ring.motive@gmail.com

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the community

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Additional Resources

- [Web Streams API Specification](https://streams.spec.whatwg.org/)
- [MDN Web Streams Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
- [Can I Use - Web Streams](https://caniuse.com/streams)

Thank you for contributing to web-streams-shim! 
