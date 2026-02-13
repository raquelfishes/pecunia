# 💰 Pecunia

[![Test and Lint](https://github.com/yourusername/pecunia/workflows/Test%20and%20Lint/badge.svg)](https://github.com/yourusername/pecunia/actions)
[![codecov](https://codecov.io/gh/yourusername/pecunia/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/pecunia)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![code style: eslint](https://img.shields.io/badge/code%20style-eslint-4B32C3.svg)](https://eslint.org/)

**Enhanced GOOGLEFINANCE wrapper with intelligent caching for Google Sheets**

Pecunia (Latin for "money") is a Google Apps Script custom function that extends GOOGLEFINANCE with a two-tier caching system. It automatically stores historical data and provides fallback values when GOOGLEFINANCE returns errors or is unavailable.

## ✨ Features

- **🔄 Two-tier caching system**: Fast L1 in-memory cache + persistent L2 cache
- **📊 Historical data storage**: Automatically saves daily values for trend analysis
- **🛡️ Fallback protection**: Uses cached values when GOOGLEFINANCE returns #N/A or #ERROR!
- **⚡ Loading state handling**: Returns cached data while GOOGLEFINANCE is loading
- **🔧 Cache management commands**: Built-in commands to inspect, clear, and manage cache
- **📈 Multiple attributes**: Support for comma-separated attributes (e.g., "price,volume,name")
- **🧪 Fully tested**: Comprehensive Jest test suite with 83% coverage

## 🚀 Quick Start

### Installation

#### Option 1: Using clasp (Recommended for developers)

1. Install clasp globally:
```bash
npm install -g @google/clasp
```

2. Clone this repository:
```bash
git clone https://github.com/yourusername/pecunia.git
cd pecunia
```

3. Install dependencies:
```bash
npm install
```

4. Login to clasp:
```bash
clasp login
```

5. Create a new Apps Script project or link to existing one:
```bash
# Create new project
clasp create --type sheets --title "Pecunia"

# OR link to existing project
clasp clone YOUR_SCRIPT_ID
```

6. Push the code to your Google Apps Script project:
```bash
npm run push
```

#### Option 2: Manual installation

1. Open your Google Spreadsheet
2. Go to **Extensions > Apps Script**
3. Copy the contents of `src/Code.js` into the script editor
4. Save the project (Ctrl+S or Cmd+S)

## 📖 Usage

### Basic Usage

The simplest way to use PECUNIA is as a drop-in replacement for GOOGLEFINANCE:

```
=PECUNIA("NASDAQ:GOOGL", "price", GOOGLEFINANCE("NASDAQ:GOOGL", "price"))
```

**How it works:**
1. GOOGLEFINANCE fetches the current price
2. PECUNIA caches the value with today's date
3. If GOOGLEFINANCE returns #N/A or #ERROR!, PECUNIA returns the cached value instead

### Multiple Attributes

Fetch multiple attributes at once:

```
=PECUNIA("NASDAQ:GOOGL", "price,volume,name",
  {GOOGLEFINANCE("NASDAQ:GOOGL", "price"),
   GOOGLEFINANCE("NASDAQ:GOOGL", "volume"),
   GOOGLEFINANCE("NASDAQ:GOOGL", "name")})
```

Returns an array: `[150.50, 1000000, "Alphabet Inc."]`

### Historical Data

Save data with a specific date:

```
=PECUNIA("NASDAQ:GOOGL", "price",
  GOOGLEFINANCE("NASDAQ:GOOGL", "price"), "2024-01-15")
```

Retrieve historical data:

```
=PECUNIA("NASDAQ:GOOGL", "price", "", "2024-01-15")
```

### Loading State

When GOOGLEFINANCE shows "Loading...", PECUNIA will:
- Return the cached value if available
- Show "Loading..." if no cache exists (cell will recalculate automatically)

## 🔧 Cache Management Commands

PECUNIA includes powerful commands to manage your cache. Use them in the third parameter:

### View Help
```
=PECUNIA("NASDAQ:GOOGL", "price", "?")
```
Returns: List of all available commands

### Set Value Manually
```
=PECUNIA("NASDAQ:GOOGL", "price", "SET", "2024-01-15", "150.50")
```
Manually stores a value in the cache

### Get Cached Value
```
=PECUNIA("NASDAQ:GOOGL", "price", "GET", "2024-01-15")
```
Retrieves the cached value for a specific date

### View History
```
=PECUNIA("NASDAQ:GOOGL", "price", "HISTORY")
```
Returns all cached values with dates:
```
History for NASDAQ:GOOGL price:
2024-01-15: 150.50
2024-01-14: 148.20
2024-01-13: 149.10
```

### List All Cache
```
=PECUNIA("", "", "LIST")
```
Shows all cached finance data with age

### Remove Symbol Cache
```
=PECUNIA("NASDAQ:GOOGL", "price", "REMOVE")
```
Removes all cached entries for this symbol/attribute combination

### Clear All Cache
```
=PECUNIA("", "", "CLEARCACHE")
```
⚠️ Removes ALL cached data

### Expire Old Cache
```
=PECUNIA("", "", "EXPIRECACHE")
```
Removes cache entries older than 24 hours

### Test Cache
```
=PECUNIA("", "", "TEST")
```
Runs a test to verify cache is working correctly

## 🏗️ Architecture

### Two-Tier Caching System

```
┌─────────────────────┐
│   GOOGLEFINANCE     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      PECUNIA        │
└──────────┬──────────┘
           │
           ├──────────► L1 Cache (CacheService)
           │            • In-memory
           │            • ~5MB limit
           │            • 6 hour expiry
           │            • Very fast
           │
           └──────────► L2 Cache (PropertiesService)
                        • Persistent
                        • ~9MB limit
                        • 24 hour expiry
                        • Survives sessions
```

**Cache Key Format:**
```
finance_SYMBOL_attribute_YYYY-MM-DD
```

Example: `finance_NASDAQ:GOOGL_price_2024-01-15`

### Data Flow

1. **Fresh Data**: GOOGLEFINANCE returns valid data → Store in L1+L2 → Return value
2. **Loading**: GOOGLEFINANCE shows "Loading..." → Check cache → Return cached or "Loading..."
3. **Error**: GOOGLEFINANCE returns #N/A/#ERROR! → Check cache → Return cached or #N/A
4. **Historical**: Specific date requested → Check L1 → Check L2 → Return value or #N/A

## 🧪 Development

### Running Tests

Run the full test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

### Linting

Check code quality:
```bash
npm run lint
```

Auto-fix issues:
```bash
npm run lint:fix
```

### Deploying Changes

After making changes:

```bash
# Push to Apps Script
npm run push

# Or deploy a new version
npm run deploy
```

Open your script in the browser:
```bash
npm run open
```

## 📊 Example Sheet Setup

Here's a complete example setup for tracking stocks:

| Symbol | Price Formula | Volume Formula | Last Updated |
|--------|--------------|----------------|--------------|
| NASDAQ:GOOGL | `=PECUNIA("NASDAQ:GOOGL", "price", GOOGLEFINANCE("NASDAQ:GOOGL", "price"))` | `=PECUNIA("NASDAQ:GOOGL", "volume", GOOGLEFINANCE("NASDAQ:GOOGL", "volume"))` | `=NOW()` |
| NYSEARCA:VOO | `=PECUNIA("NYSEARCA:VOO", "price", GOOGLEFINANCE("NYSEARCA:VOO", "price"))` | `=PECUNIA("NYSEARCA:VOO", "volume", GOOGLEFINANCE("NYSEARCA:VOO", "volume"))` | `=NOW()` |

### Historical Tracking Sheet

Create a sheet that saves daily values:

| Date | GOOGL Price | VOO Price |
|------|-------------|-----------|
| 2024-01-15 | `=PECUNIA("NASDAQ:GOOGL", "price", GOOGLEFINANCE("NASDAQ:GOOGL", "price"), "2024-01-15")` | `=PECUNIA("NYSEARCA:VOO", "price", GOOGLEFINANCE("NYSEARCA:VOO", "price"), "2024-01-15")` |
| 2024-01-14 | `=PECUNIA("NASDAQ:GOOGL", "price", "", "2024-01-14")` | `=PECUNIA("NYSEARCA:VOO", "price", "", "2024-01-14")` |

**Tip**: Use `=""&TODAY()` in column A to auto-generate dates, then reference that cell in the date parameter.

## 🔍 Troubleshooting

### "Loading..." Never Resolves

**Cause**: GOOGLEFINANCE is still fetching data
**Solution**: Wait a few seconds. If it persists, the symbol might be invalid or market is closed.

### #N/A Even With Cache

**Cause**: No cached data exists for this symbol/date combination
**Solution**:
1. Check the symbol is correct
2. Use `=PECUNIA("SYMBOL", "price", "HISTORY")` to see what dates are cached
3. Manually set a value with the SET command

### Cache Not Persisting Between Sessions

**Cause**: Only L1 cache is being used, or you're exceeding size limits
**Solution**:
1. Run `=PECUNIA("", "", "TEST")` to verify cache is working
2. Clear old data with `=PECUNIA("", "", "EXPIRECACHE")`
3. Check you haven't exceeded ~9MB in PropertiesService

### Tests Failing

**Cause**: Dependencies not installed or mock issues
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm test
```

## 📝 API Reference

### PECUNIA Function Signature

```javascript
PECUNIA(symbol, attributes, googleFinanceValues, date, cmdOption)
```

**Parameters:**

- `symbol` (string, required): Stock ticker with exchange (e.g., "NASDAQ:GOOGL", "NYSEARCA:VOO")
- `attributes` (string, default: "price"): Single attribute or comma-separated list (e.g., "price,volume,name")
- `googleFinanceValues` (any, optional): The GOOGLEFINANCE result(s). Can be single value, array, or command string
- `date` (string, optional): Date in YYYY-MM-DD format. Defaults to today
- `cmdOption` (string, optional): Value for SET command or other command options

**Returns:**
- Single value or array depending on attributes
- Cached value if GOOGLEFINANCE returns error
- Command result if using cache management commands

## 🎯 Setting Up Badges

After you push your repository to GitHub, update the badges at the top of this README:

1. **Replace `yourusername/pecunia`** with your actual GitHub username and repository name in all badge URLs

2. **GitHub Actions Badge** (Test and Lint):
   - Will work automatically once you push to GitHub
   - Shows green ✓ when tests pass

3. **Codecov Badge** (Coverage):
   - Sign up at [codecov.io](https://codecov.io/)
   - Add your repository
   - Set `CODECOV_TOKEN` in GitHub Secrets: `Settings > Secrets and variables > Actions > New repository secret`
   - Badge will update automatically after each push

Example badge URLs after update:
```markdown
[![Test and Lint](https://github.com/yourname/pecunia/workflows/Test%20and%20Lint/badge.svg)](https://github.com/yourname/pecunia/actions)
[![codecov](https://codecov.io/gh/yourname/pecunia/branch/main/graph/badge.svg)](https://codecov.io/gh/yourname/pecunia)
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linter: `npm run lint:fix`
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to the branch: `git push origin feature/my-new-feature`
8. Submit a pull request

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Always use semicolons
- Follow existing code patterns
- Add tests for new features

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Inspired by [cachefinance](https://github.com/demmings/cachefinance)
- Built with [clasp](https://github.com/google/clasp)
- Tested with [Jest](https://jestjs.io/)

## 📚 Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [GOOGLEFINANCE Function Reference](https://support.google.com/docs/answer/3093281)
- [Apps Script Best Practices](https://developers.google.com/apps-script/guides/support/best-practices)

## 🐛 Issues

Found a bug? Have a feature request? Please [open an issue](https://github.com/yourusername/pecunia/issues) on GitHub.

## 📧 Contact

For questions or support, please open an issue on GitHub or reach out to the maintainers.

---

Made with ❤️ for the Google Sheets community
