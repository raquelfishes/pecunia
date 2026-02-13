# Contributing to Pecunia

Thank you for your interest in contributing to Pecunia! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and considerate in all interactions. We're all here to build something useful together.

## How to Contribute

### Reporting Bugs

Before submitting a bug report:
1. Check existing issues to avoid duplicates
2. Test with the latest version
3. Gather relevant information (error messages, steps to reproduce, etc.)

When submitting:
```markdown
**Description**: Brief description of the bug

**Steps to Reproduce**:
1. Step one
2. Step two
3. ...

**Expected Behavior**: What should happen

**Actual Behavior**: What actually happens

**Environment**:
- Google Sheets version
- Browser (if relevant)
- Node.js version (for development issues)

**Additional Context**: Screenshots, logs, etc.
```

### Suggesting Features

We love new ideas! When suggesting a feature:
1. Check if it's already been suggested
2. Explain the use case
3. Describe the expected behavior
4. Consider edge cases

### Pull Requests

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/yourusername/pecunia.git
   cd pecunia
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/my-feature
   # or
   git checkout -b fix/my-bugfix
   ```

3. **Make your changes**
   - Write clear, documented code
   - Follow existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add feature: description of feature"
   ```

   Good commit messages:
   - `Add feature: support for cryptocurrency symbols`
   - `Fix bug: cache expiration not working correctly`
   - `Docs: update README with new examples`
   - `Test: add tests for multiple attributes`

6. **Push and create PR**
   ```bash
   git push origin feature/my-feature
   ```
   Then create a Pull Request on GitHub.

## Development Guidelines

### Code Style

- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings
- **Semicolons**: Always use semicolons
- **Line length**: Aim for 100 characters max
- **Naming**:
  - Functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Private functions: prefix with underscore `_privateFunction`

### Testing

All new features must include tests:

```javascript
describe('New Feature', () => {
  beforeEach(() => {
    global.resetMocks();
  });

  it('should do something', () => {
    const result = myNewFunction();
    expect(result).toBe(expected);
  });

  it('should handle edge case', () => {
    const result = myNewFunction(edgeCase);
    expect(result).toBe(expected);
  });
});
```

### Documentation

Update documentation when:
- Adding new features
- Changing function signatures
- Modifying behavior
- Adding new cache commands

Required documentation:
- JSDoc comments for functions
- README examples for user-facing features
- Code comments for complex logic

Example JSDoc:
```javascript
/**
 * Retrieves cached finance data with fallback to L2 cache
 *
 * @param {string} symbol - Stock ticker (e.g., "NASDAQ:GOOGL")
 * @param {string} attribute - Data attribute (e.g., "price")
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {any|null} Cached value or null if not found
 */
function getCachedFinanceData(symbol, attribute, dateStr) {
  // Implementation
}
```

## Project Structure

```
pecunia/
├── src/
│   ├── Code.js           # Main source code
│   └── appsscript.json   # Apps Script config
├── tests/
│   ├── pecunia.test.js   # Test suite
│   └── mocks/
│       └── googleAppsMocks.js  # Google services mocks
├── .github/
│   └── workflows/
│       └── test.yml      # CI/CD pipeline
├── package.json          # Dependencies and scripts
├── .eslintrc.json       # Linting rules
└── README.md            # User documentation
```

## Testing Strategy

### Unit Tests

Test individual functions in isolation:
- Cache functions
- Data processing
- Command handlers

### Integration Tests

Test complete workflows:
- PECUNIA with valid data
- PECUNIA with errors
- Cache persistence
- Multiple attributes

### Edge Cases

Always test:
- Empty inputs
- Null/undefined values
- Invalid symbols
- Date edge cases
- Cache size limits
- Expired cache

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. Create GitHub release

## Areas for Contribution

Current priorities:
- [ ] Add support for more cache backends
- [ ] Implement automatic cache backup/export
- [ ] Add performance monitoring
- [ ] Create Google Sheets addon version
- [ ] Add support for cryptocurrency prices
- [ ] Implement webhook notifications for price alerts

## Questions?

- Open an issue for questions
- Check existing issues and PRs
- Read the [SETUP.md](SETUP.md) guide

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Every contribution makes Pecunia better. Whether it's code, documentation, bug reports, or feature suggestions - thank you for helping improve this project! 🙏
